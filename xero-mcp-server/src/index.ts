#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const CLIENT_ID = process.env.XERO_CLIENT_ID;
const CLIENT_SECRET = process.env.XERO_CLIENT_SECRET;
const TENANT_ID = process.env.XERO_TENANT_ID;
let accessToken = process.env.XERO_ACCESS_TOKEN ?? "";
let refreshToken = process.env.XERO_REFRESH_TOKEN ?? "";

if (!CLIENT_ID || !CLIENT_SECRET || !TENANT_ID) {
  console.error(
    "ERROR: XERO_CLIENT_ID, XERO_CLIENT_SECRET, and XERO_TENANT_ID are required.\n" +
      "Create an app at https://developer.xero.com to get credentials.\n" +
      "Also set XERO_ACCESS_TOKEN and XERO_REFRESH_TOKEN.",
  );
  process.exit(1);
}

const BASE_URL = "https://api.xero.com/api.xro/2.0";
const TOKEN_URL = "https://identity.xero.com/connect/token";

async function refreshAccessToken(): Promise<void> {
  if (!refreshToken) {
    throw new Error("No refresh token. Re-authenticate with Xero.");
  }
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
    "base64",
  );
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
  });
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
  };
  accessToken = data.access_token;
  refreshToken = data.refresh_token;
  console.error("Xero access token refreshed");
}

interface XeroRequestOptions {
  method?: string;
  path: string;
  params?: Record<string, string | number | undefined>;
  body?: unknown;
}

async function xeroRequest<T = unknown>(opts: XeroRequestOptions): Promise<T> {
  const url = new URL(`${BASE_URL}${opts.path}`);
  if (opts.params) {
    for (const [k, v] of Object.entries(opts.params)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  const serializedBody = opts.body ? JSON.stringify(opts.body) : undefined;
  const method = opts.method ?? "GET";
  const makeFetchOpts = () => ({
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Xero-Tenant-Id": TENANT_ID as string,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: serializedBody,
  });

  let res = await fetch(url.toString(), makeFetchOpts());

  if (res.status === 401) {
    await refreshAccessToken();
    res = await fetch(url.toString(), makeFetchOpts());
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Xero API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

const VALID_INVOICE_STATUSES = new Set([
  "DRAFT",
  "SUBMITTED",
  "AUTHORISED",
  "PAID",
]);

const VALID_ACCOUNT_TYPES = new Set([
  "BANK",
  "CURRENT",
  "CURRLIAB",
  "DEPRECIATN",
  "DIRECTCOSTS",
  "EQUITY",
  "EXPENSE",
  "FIXED",
  "LIABILITY",
  "NONCURRENT",
  "OTHERINCOME",
  "OVERHEADS",
  "PREPAYMENT",
  "REVENUE",
  "SALES",
  "TERMLIAB",
  "PAYGLIABILITY",
]);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validateEnum(
  value: string,
  allowed: Set<string>,
  fieldName: string,
): string {
  if (!allowed.has(value)) {
    throw new Error(
      `Invalid ${fieldName} '${value}'. Must be one of: ${[...allowed].join(", ")}`,
    );
  }
  return value;
}

function validateDate(value: string, fieldName: string): string {
  if (!DATE_RE.test(value)) {
    throw new Error(
      `Invalid ${fieldName} '${value}'. Expected format: YYYY-MM-DD`,
    );
  }
  return value;
}

function mcpSuccess(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function mcpError(error: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
      },
    ],
    isError: true as const,
  };
}

const server = new McpServer(
  { name: "xero-mcp", version: "1.0.0" },
  {
    instructions:
      "This server connects to Xero. " +
      "Use list_accounts first to understand the chart of accounts. " +
      "Then use list_invoices or list_bank_transactions for transactional data, " +
      "get_profit_loss / get_balance_sheet / get_trial_balance for financial reports, " +
      "and get_aged_receivables / get_aged_payables for aging analysis.",
  },
);

server.registerTool(
  "list_invoices",
  {
    title: "List Invoices",
    description:
      "List invoices from Xero. Filter by status (DRAFT/SUBMITTED/AUTHORISED/PAID) and date range.",
    inputSchema: {
      status: z
        .string()
        .optional()
        .describe("Invoice status: DRAFT, SUBMITTED, AUTHORISED, PAID"),
      startDate: z
        .string()
        .optional()
        .describe("Filter invoices on or after this date YYYY-MM-DD"),
      endDate: z
        .string()
        .optional()
        .describe("Filter invoices on or before this date YYYY-MM-DD"),
      page: z
        .number()
        .optional()
        .default(1)
        .describe("Page number (100 per page)"),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ status, startDate, endDate, page }) => {
    try {
      const params: Record<string, string | number | undefined> = {
        page,
      };

      const whereClauses: string[] = [];
      if (status) {
        whereClauses.push(
          `Status=="${validateEnum(status, VALID_INVOICE_STATUSES, "status")}"`,
        );
      }
      if (startDate) {
        whereClauses.push(
          `Date>=DateTime(${validateDate(startDate, "startDate").replace(/-/g, ",")})`,
        );
      }
      if (endDate) {
        whereClauses.push(
          `Date<=DateTime(${validateDate(endDate, "endDate").replace(/-/g, ",")})`,
        );
      }
      if (whereClauses.length > 0) {
        params["where"] = whereClauses.join("&&");
      }

      return mcpSuccess(await xeroRequest({ path: "/Invoices", params }));
    } catch (error) {
      return mcpError(error);
    }
  },
);

server.registerTool(
  "get_invoice",
  {
    title: "Get Invoice",
    description: "Fetch a single invoice from Xero by its InvoiceID.",
    inputSchema: {
      invoiceId: z.string().describe("Xero InvoiceID (GUID)"),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ invoiceId }) => {
    try {
      return mcpSuccess(await xeroRequest({ path: `/Invoices/${invoiceId}` }));
    } catch (error) {
      return mcpError(error);
    }
  },
);

server.registerTool(
  "list_contacts",
  {
    title: "List Contacts",
    description:
      "List contacts (customers and suppliers) from Xero. Optionally search by name or email.",
    inputSchema: {
      searchTerm: z
        .string()
        .optional()
        .describe("Search contacts by name or email address"),
      page: z
        .number()
        .optional()
        .default(1)
        .describe("Page number (100 per page)"),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ searchTerm, page }) => {
    try {
      const params: Record<string, string | number | undefined> = { page };
      if (searchTerm) {
        params["searchTerm"] = searchTerm;
      }
      return mcpSuccess(await xeroRequest({ path: "/Contacts", params }));
    } catch (error) {
      return mcpError(error);
    }
  },
);

server.registerTool(
  "get_contact",
  {
    title: "Get Contact",
    description: "Fetch a single contact from Xero by ContactID.",
    inputSchema: {
      contactId: z.string().describe("Xero ContactID (GUID)"),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ contactId }) => {
    try {
      return mcpSuccess(await xeroRequest({ path: `/Contacts/${contactId}` }));
    } catch (error) {
      return mcpError(error);
    }
  },
);

server.registerTool(
  "list_accounts",
  {
    title: "List Accounts",
    description:
      "Fetch the chart of accounts from Xero. Optionally filter by account type.",
    inputSchema: {
      type: z
        .string()
        .optional()
        .describe(
          "Filter by account type: BANK, CURRENT, EXPENSE, REVENUE, SALES, EQUITY, etc.",
        ),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ type }) => {
    try {
      const params: Record<string, string | number | undefined> = {};
      if (type) {
        params["where"] =
          `Type=="${validateEnum(type, VALID_ACCOUNT_TYPES, "type")}"`;
      }
      return mcpSuccess(await xeroRequest({ path: "/Accounts", params }));
    } catch (error) {
      return mcpError(error);
    }
  },
);

server.registerTool(
  "list_bank_transactions",
  {
    title: "List Bank Transactions",
    description:
      "Fetch bank transactions from Xero for a date range. Returns spend and receive money transactions.",
    inputSchema: {
      startDate: z.string().describe("Start date YYYY-MM-DD"),
      endDate: z.string().describe("End date YYYY-MM-DD"),
      page: z
        .number()
        .optional()
        .default(1)
        .describe("Page number (100 per page)"),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ startDate, endDate, page }) => {
    try {
      const where =
        `Date>=DateTime(${validateDate(startDate, "startDate").replace(/-/g, ",")})` +
        `&&Date<=DateTime(${validateDate(endDate, "endDate").replace(/-/g, ",")})`;
      return mcpSuccess(
        await xeroRequest({
          path: "/BankTransactions",
          params: { where, page },
        }),
      );
    } catch (error) {
      return mcpError(error);
    }
  },
);

server.registerTool(
  "get_profit_loss",
  {
    title: "Get Profit & Loss",
    description: "Fetch the Profit & Loss report from Xero for a date range.",
    inputSchema: {
      fromDate: z.string().describe("Start date YYYY-MM-DD"),
      toDate: z.string().describe("End date YYYY-MM-DD"),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ fromDate, toDate }) => {
    try {
      return mcpSuccess(
        await xeroRequest({
          path: "/Reports/ProfitAndLoss",
          params: {
            fromDate: validateDate(fromDate, "fromDate"),
            toDate: validateDate(toDate, "toDate"),
          },
        }),
      );
    } catch (error) {
      return mcpError(error);
    }
  },
);

server.registerTool(
  "get_balance_sheet",
  {
    title: "Get Balance Sheet",
    description:
      "Fetch the Balance Sheet report from Xero as of a specific date.",
    inputSchema: {
      date: z.string().describe("As-of date YYYY-MM-DD"),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ date }) => {
    try {
      return mcpSuccess(
        await xeroRequest({
          path: "/Reports/BalanceSheet",
          params: { date: validateDate(date, "date") },
        }),
      );
    } catch (error) {
      return mcpError(error);
    }
  },
);

server.registerTool(
  "get_trial_balance",
  {
    title: "Get Trial Balance",
    description:
      "Fetch the Trial Balance report from Xero — all account balances as of a date.",
    inputSchema: {
      date: z.string().describe("As-of date YYYY-MM-DD"),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ date }) => {
    try {
      return mcpSuccess(
        await xeroRequest({
          path: "/Reports/TrialBalance",
          params: { date: validateDate(date, "date") },
        }),
      );
    } catch (error) {
      return mcpError(error);
    }
  },
);

server.registerTool(
  "get_aged_receivables",
  {
    title: "Get Aged Receivables",
    description:
      "Fetch the Aged Receivables by Contact report from Xero — who owes you money and how overdue.",
    inputSchema: {
      date: z
        .string()
        .optional()
        .describe("As-of date YYYY-MM-DD (defaults to today)"),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ date }) => {
    try {
      const params: Record<string, string | number | undefined> = {};
      if (date) params["date"] = validateDate(date, "date");
      return mcpSuccess(
        await xeroRequest({
          path: "/Reports/AgedReceivablesbyContact",
          params,
        }),
      );
    } catch (error) {
      return mcpError(error);
    }
  },
);

server.registerTool(
  "get_aged_payables",
  {
    title: "Get Aged Payables",
    description:
      "Fetch the Aged Payables by Contact report from Xero — what you owe suppliers and how overdue.",
    inputSchema: {
      date: z
        .string()
        .optional()
        .describe("As-of date YYYY-MM-DD (defaults to today)"),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ date }) => {
    try {
      const params: Record<string, string | number | undefined> = {};
      if (date) params["date"] = validateDate(date, "date");
      return mcpSuccess(
        await xeroRequest({
          path: "/Reports/AgedPayablesbyContact",
          params,
        }),
      );
    } catch (error) {
      return mcpError(error);
    }
  },
);

server.registerTool(
  "create_manual_journal",
  {
    title: "Create Manual Journal",
    description:
      "Create a manual journal entry in Xero with debit and credit lines. Debits must equal credits.",
    inputSchema: {
      date: z.string().describe("Journal date YYYY-MM-DD"),
      narration: z.string().describe("Journal narration / description"),
      lines: z
        .array(
          z.object({
            accountCode: z
              .string()
              .describe("Xero account code (e.g. '200', '400')"),
            amount: z
              .number()
              .describe(
                "Amount — positive for debit, negative for credit (Xero sign convention)",
              ),
            description: z.string().optional().describe("Line description"),
            taxType: z
              .string()
              .optional()
              .describe("Tax type code, e.g. OUTPUT, INPUT, NONE"),
          }),
        )
        .describe("Journal lines — net of all lines must equal zero"),
    },
    annotations: { destructiveHint: false, idempotentHint: false },
  },
  async ({ date, narration, lines }) => {
    try {
      const journalLines = lines.map((line) => {
        const entry: Record<string, unknown> = {
          LineAmount: line.amount,
          AccountCode: line.accountCode,
          Description: line.description ?? "",
        };
        if (line.taxType) entry["TaxType"] = line.taxType;
        return entry;
      });

      return mcpSuccess(
        await xeroRequest({
          method: "POST",
          path: "/ManualJournals",
          body: {
            Date: validateDate(date, "date"),
            Narration: narration,
            JournalLines: journalLines,
          },
        }),
      );
    } catch (error) {
      return mcpError(error);
    }
  },
);

server.registerPrompt(
  "month-end-close",
  {
    title: "Month-End Close",
    description:
      "Run a complete month-end close workflow for a Xero client — pull reports, analyze, generate client summary",
    argsSchema: {
      month: z.string().describe("Month to close, e.g. '2026-03'"),
      clientName: z.string().describe("Client/company name for the report"),
    },
  },
  ({ month, clientName }) => {
    const [year, mon] = month.split("-");
    const startDate = `${year}-${mon}-01`;
    const lastDay = new Date(Number(year), Number(mon), 0).getDate();
    const endDate = `${year}-${mon}-${String(lastDay).padStart(2, "0")}`;
    return {
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text:
              `Run month-end close for ${clientName} in Xero, period: ${startDate} to ${endDate}.\n\n` +
              "1. Fetch the P&L for this month and prior month for comparison using get_profit_loss\n" +
              "2. Fetch the Balance Sheet as of month-end using get_balance_sheet\n" +
              "3. Fetch the Trial Balance using get_trial_balance\n" +
              "4. Check aged receivables for overdue invoices using get_aged_receivables\n" +
              "5. Check aged payables for overdue bills using get_aged_payables\n\n" +
              "Generate a client-ready monthly financial summary with:\n" +
              "- Income Statement: revenue, expenses, net income (MoM change)\n" +
              "- Key metrics: gross margin, net margin, current ratio\n" +
              "- Variance analysis for items >10% off from prior month\n" +
              "- AR/AP status summary\n" +
              "- 2-3 advisory notes based on what the numbers show\n" +
              "- Action items for the client",
          },
        },
      ],
    };
  },
);

server.registerPrompt(
  "categorize-transactions",
  {
    title: "Categorize Transactions",
    description:
      "Pull bank transactions from Xero and suggest GL account coding",
    argsSchema: {
      startDate: z.string().describe("Start date YYYY-MM-DD"),
      endDate: z.string().describe("End date YYYY-MM-DD"),
    },
  },
  ({ startDate, endDate }) => ({
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text:
            `Fetch bank transactions from Xero from ${startDate} to ${endDate} using list_bank_transactions.\n\n` +
            "Then fetch the chart of accounts using list_accounts.\n\n" +
            "For each transaction:\n" +
            "1. Analyze the contact name and reference/description\n" +
            "2. Suggest the correct account code from the chart of accounts\n" +
            "3. Flag any anomalies (unusual amounts, duplicates, possible personal expenses)\n" +
            "4. Mark uncertain items as NEEDS REVIEW\n\n" +
            "Present as a table: Date | Contact | Amount | Suggested Account | Account Code | Confidence | Flags\n\n" +
            "At the end, summarize: total categorized, total needing review, any anomalies found.",
        },
      },
    ],
  }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Xero MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
