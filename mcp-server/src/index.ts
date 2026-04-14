#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ============================================================
// QuickBooks Online MCP Server
// Connects Claude to QuickBooks Online Accounting API
// Docs: https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities
// ============================================================

const CLIENT_ID = process.env.QBO_CLIENT_ID;
const CLIENT_SECRET = process.env.QBO_CLIENT_SECRET;
const REALM_ID = process.env.QBO_REALM_ID; // Company ID
let accessToken = process.env.QBO_ACCESS_TOKEN ?? "";
let refreshToken = process.env.QBO_REFRESH_TOKEN ?? "";

if (!CLIENT_ID || !CLIENT_SECRET || !REALM_ID) {
  console.error(
    "ERROR: QBO_CLIENT_ID, QBO_CLIENT_SECRET, and QBO_REALM_ID are required.\n" +
      "Create an app at https://developer.intuit.com to get credentials.\n" +
      "Also set QBO_ACCESS_TOKEN and QBO_REFRESH_TOKEN.",
  );
  process.exit(1);
}

const BASE_URL = `https://quickbooks.api.intuit.com/v3/company/${REALM_ID}`;
const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

async function refreshAccessToken(): Promise<void> {
  if (!refreshToken) {
    throw new Error("No refresh token. Re-authenticate with QuickBooks.");
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
  console.error("QuickBooks access token refreshed");
}

interface QboRequestOptions {
  method?: string;
  path: string;
  params?: Record<string, string | number | undefined>;
  body?: unknown;
}

async function qboRequest<T = unknown>(opts: QboRequestOptions): Promise<T> {
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
    throw new Error(`QBO API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

async function qboQuery<T = unknown>(query: string): Promise<T> {
  return qboRequest<T>({
    path: "/query",
    params: { query },
  });
}

const VALID_ACCOUNT_TYPES = new Set([
  "Bank",
  "Other Current Asset",
  "Fixed Asset",
  "Other Asset",
  "Accounts Receivable",
  "Equity",
  "Expense",
  "Other Expense",
  "Cost of Goods Sold",
  "Accounts Payable",
  "Credit Card",
  "Long Term Liability",
  "Other Current Liability",
  "Income",
  "Other Income",
]);

const VALID_TXN_TYPES = new Set([
  "Purchase",
  "Deposit",
  "Transfer",
  "JournalEntry",
]);

const VALID_ENTITY_NAMES = new Set(["Invoice", "Bill"]);

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

function buildDateRangeQuery(
  entity: string,
  opts: {
    startDate?: string;
    endDate?: string;
    unpaidOnly?: boolean;
    limit?: number;
  },
): string {
  validateEnum(entity, VALID_ENTITY_NAMES, "entity");
  const conditions: string[] = [];
  if (opts.startDate)
    conditions.push(
      `TxnDate >= '${validateDate(opts.startDate, "startDate")}'`,
    );
  if (opts.endDate)
    conditions.push(`TxnDate <= '${validateDate(opts.endDate, "endDate")}'`);
  if (opts.unpaidOnly) conditions.push("Balance > '0'");
  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return `SELECT * FROM ${entity} ${where} ORDERBY DueDate MAXRESULTS ${opts.limit ?? 100}`;
}

const server = new McpServer(
  { name: "quickbooks-mcp", version: "1.0.0" },
  {
    instructions:
      "This server connects to QuickBooks Online. " +
      "Use get_chart_of_accounts first to understand the GL structure. " +
      "Then use query_transactions to fetch bank data, get_profit_loss for P&L reports, " +
      "and get_balance_sheet for financial position.",
  },
);

server.registerTool(
  "get_chart_of_accounts",
  {
    title: "Get Chart of Accounts",
    description:
      "Fetch the complete chart of accounts from QuickBooks — all GL accounts with types, numbers, and balances.",
    inputSchema: {
      accountType: z
        .string()
        .optional()
        .describe(
          "Filter by type: Bank, Expense, Income, Other Current Asset, etc.",
        ),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ accountType }) => {
    try {
      let query = "SELECT * FROM Account MAXRESULTS 1000";
      if (accountType) {
        const safeType = validateEnum(
          accountType,
          VALID_ACCOUNT_TYPES,
          "accountType",
        );
        query = `SELECT * FROM Account WHERE AccountType = '${safeType}' MAXRESULTS 1000`;
      }
      return mcpSuccess(await qboQuery(query));
    } catch (error) {
      return mcpError(error);
    }
  },
);

server.registerTool(
  "query_transactions",
  {
    title: "Query Transactions",
    description:
      "Fetch transactions from QuickBooks for a date range. Returns purchases, deposits, transfers, and journal entries.",
    inputSchema: {
      startDate: z.string().describe("Start date YYYY-MM-DD"),
      endDate: z.string().describe("End date YYYY-MM-DD"),
      txnType: z
        .string()
        .optional()
        .describe("Filter by type: Purchase, Deposit, Transfer, JournalEntry"),
      limit: z.number().optional().default(100),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ startDate, endDate, txnType, limit }) => {
    try {
      const safeStart = validateDate(startDate, "startDate");
      const safeEnd = validateDate(endDate, "endDate");
      const entity =
        txnType !== undefined
          ? validateEnum(txnType, VALID_TXN_TYPES, "txnType")
          : "Purchase";
      const query = `SELECT * FROM ${entity} WHERE TxnDate >= '${safeStart}' AND TxnDate <= '${safeEnd}' MAXRESULTS ${limit}`;
      return mcpSuccess(await qboQuery(query));
    } catch (error) {
      return mcpError(error);
    }
  },
);

server.registerTool(
  "get_profit_loss",
  {
    title: "Get Profit & Loss",
    description:
      "Fetch the Profit & Loss (Income Statement) report from QuickBooks for a date range.",
    inputSchema: {
      startDate: z.string().describe("Start date YYYY-MM-DD"),
      endDate: z.string().describe("End date YYYY-MM-DD"),
      summarizeBy: z
        .enum(["Total", "Month", "Quarter", "Year"])
        .optional()
        .default("Total"),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ startDate, endDate, summarizeBy }) => {
    try {
      return mcpSuccess(
        await qboRequest({
          path: "/reports/ProfitAndLoss",
          params: {
            start_date: validateDate(startDate, "startDate"),
            end_date: validateDate(endDate, "endDate"),
            summarize_column_by: summarizeBy,
            minorversion: 75,
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
      "Fetch the Balance Sheet report from QuickBooks as of a specific date.",
    inputSchema: {
      asOfDate: z.string().describe("As-of date YYYY-MM-DD"),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ asOfDate }) => {
    try {
      return mcpSuccess(
        await qboRequest({
          path: "/reports/BalanceSheet",
          params: {
            as_of: validateDate(asOfDate, "asOfDate"),
            minorversion: 75,
          },
        }),
      );
    } catch (error) {
      return mcpError(error);
    }
  },
);

server.registerTool(
  "get_general_ledger",
  {
    title: "Get General Ledger",
    description:
      "Fetch the General Ledger report — all transactions by account for a date range.",
    inputSchema: {
      startDate: z.string().describe("Start date YYYY-MM-DD"),
      endDate: z.string().describe("End date YYYY-MM-DD"),
      account: z.string().optional().describe("Filter by account name"),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ startDate, endDate, account }) => {
    try {
      const params: Record<string, string | number> = {
        start_date: validateDate(startDate, "startDate"),
        end_date: validateDate(endDate, "endDate"),
        minorversion: 75,
      };
      if (account) params.account = account;
      return mcpSuccess(
        await qboRequest({ path: "/reports/GeneralLedger", params }),
      );
    } catch (error) {
      return mcpError(error);
    }
  },
);

server.registerTool(
  "list_customers",
  {
    title: "List Customers",
    description: "List all customers/clients in QuickBooks.",
    inputSchema: {
      active: z
        .boolean()
        .optional()
        .default(true)
        .describe("Only active customers"),
      limit: z.number().optional().default(100),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ active, limit }) => {
    try {
      const where = active ? "WHERE Active = true" : "WHERE Active = false";
      return mcpSuccess(
        await qboQuery(`SELECT * FROM Customer ${where} MAXRESULTS ${limit}`),
      );
    } catch (error) {
      return mcpError(error);
    }
  },
);

server.registerTool(
  "list_vendors",
  {
    title: "List Vendors",
    description: "List all vendors in QuickBooks.",
    inputSchema: {
      active: z.boolean().optional().default(true),
      limit: z.number().optional().default(100),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ active, limit }) => {
    try {
      const where = active ? "WHERE Active = true" : "WHERE Active = false";
      return mcpSuccess(
        await qboQuery(`SELECT * FROM Vendor ${where} MAXRESULTS ${limit}`),
      );
    } catch (error) {
      return mcpError(error);
    }
  },
);

server.registerTool(
  "list_invoices",
  {
    title: "List Invoices",
    description:
      "List invoices from QuickBooks. Filter by date range, customer, or payment status.",
    inputSchema: {
      startDate: z.string().optional().describe("Start date YYYY-MM-DD"),
      endDate: z.string().optional().describe("End date YYYY-MM-DD"),
      unpaidOnly: z
        .boolean()
        .optional()
        .default(false)
        .describe("Only show unpaid/overdue invoices"),
      limit: z.number().optional().default(100),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ startDate, endDate, unpaidOnly, limit }) => {
    try {
      return mcpSuccess(
        await qboQuery(
          buildDateRangeQuery("Invoice", {
            startDate,
            endDate,
            unpaidOnly,
            limit,
          }),
        ),
      );
    } catch (error) {
      return mcpError(error);
    }
  },
);

server.registerTool(
  "list_bills",
  {
    title: "List Bills",
    description:
      "List bills (accounts payable) from QuickBooks. Filter by date or unpaid status.",
    inputSchema: {
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      unpaidOnly: z.boolean().optional().default(false),
      limit: z.number().optional().default(100),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ startDate, endDate, unpaidOnly, limit }) => {
    try {
      return mcpSuccess(
        await qboQuery(
          buildDateRangeQuery("Bill", {
            startDate,
            endDate,
            unpaidOnly,
            limit,
          }),
        ),
      );
    } catch (error) {
      return mcpError(error);
    }
  },
);

server.registerTool(
  "get_ar_aging",
  {
    title: "Get AR Aging",
    description:
      "Fetch the Accounts Receivable aging summary — who owes you money and how overdue.",
    inputSchema: {
      asOfDate: z
        .string()
        .optional()
        .describe("As-of date YYYY-MM-DD (defaults to today)"),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ asOfDate }) => {
    try {
      const params: Record<string, string | number> = { minorversion: 75 };
      if (asOfDate) params.report_date = validateDate(asOfDate, "asOfDate");
      return mcpSuccess(
        await qboRequest({ path: "/reports/AgedReceivables", params }),
      );
    } catch (error) {
      return mcpError(error);
    }
  },
);

server.registerTool(
  "get_ap_aging",
  {
    title: "Get AP Aging",
    description:
      "Fetch the Accounts Payable aging summary — what you owe vendors and how overdue.",
    inputSchema: {
      asOfDate: z.string().optional().describe("As-of date YYYY-MM-DD"),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ asOfDate }) => {
    try {
      const params: Record<string, string | number> = { minorversion: 75 };
      if (asOfDate) params.report_date = validateDate(asOfDate, "asOfDate");
      return mcpSuccess(
        await qboRequest({ path: "/reports/AgedPayables", params }),
      );
    } catch (error) {
      return mcpError(error);
    }
  },
);

server.registerTool(
  "create_journal_entry",
  {
    title: "Create Journal Entry",
    description:
      "Create a manual journal entry in QuickBooks with debit and credit lines.",
    inputSchema: {
      date: z.string().describe("Transaction date YYYY-MM-DD"),
      memo: z.string().describe("Journal entry memo/description"),
      lines: z
        .array(
          z.object({
            accountId: z.string().describe("QBO Account ID"),
            amount: z.number().describe("Amount (positive)"),
            type: z.enum(["debit", "credit"]).describe("Debit or credit"),
            description: z.string().optional().describe("Line description"),
          }),
        )
        .describe("Journal entry lines — debits must equal credits"),
    },
    annotations: { destructiveHint: false, idempotentHint: false },
  },
  async ({ date, memo, lines }) => {
    try {
      const jeLine = lines.map((line) => ({
        JournalEntryLineDetail: {
          PostingType: line.type === "debit" ? "Debit" : "Credit",
          AccountRef: { value: line.accountId },
        },
        Amount: line.amount,
        Description: line.description ?? "",
        DetailType: "JournalEntryLineDetail",
      }));

      return mcpSuccess(
        await qboRequest({
          method: "POST",
          path: "/journalentry",
          params: { minorversion: 75 },
          body: {
            TxnDate: validateDate(date, "date"),
            PrivateNote: memo,
            Line: jeLine,
          },
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
      "Fetch the trial balance report — all account balances as of a date.",
    inputSchema: {
      asOfDate: z.string().describe("As-of date YYYY-MM-DD"),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ asOfDate }) => {
    try {
      return mcpSuccess(
        await qboRequest({
          path: "/reports/TrialBalance",
          params: {
            as_of: validateDate(asOfDate, "asOfDate"),
            minorversion: 75,
          },
        }),
      );
    } catch (error) {
      return mcpError(error);
    }
  },
);

server.registerTool(
  "webhook_setup_guide",
  {
    title: "Webhook Setup Guide",
    description:
      "Get instructions for setting up QuickBooks CloudEvents webhooks to receive real-time notifications.",
    inputSchema: {},
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async () => {
    try {
      return mcpSuccess({
        format: "CloudEvents v1.0",
        deadline: "May 15, 2026 — apps must migrate or stop receiving webhooks",
        setup_steps: [
          "1. Go to Intuit Developer Portal → Your App → Webhooks",
          "2. Set your HTTPS endpoint URL",
          "3. Copy the verifier token for HMAC-SHA256 signature validation",
          "4. Subscribe to entity events (invoice, payment, customer, vendor, etc.)",
          "5. Enable CloudEvents format in the sandbox first, then production",
        ],
        available_events: [
          "qbo.invoice.created.v1",
          "qbo.invoice.updated.v1",
          "qbo.invoice.deleted.v1",
          "qbo.payment.created.v1",
          "qbo.payment.updated.v1",
          "qbo.customer.created.v1",
          "qbo.customer.updated.v1",
          "qbo.customer.merged.v1",
          "qbo.vendor.created.v1",
          "qbo.vendor.updated.v1",
          "qbo.bill.created.v1",
          "qbo.bill.updated.v1",
          "qbo.account.created.v1",
          "qbo.account.updated.v1",
        ],
        sample_payload: {
          specversion: "1.0",
          id: "88cd52aa-33b6-4351-9aa4-47572edbd068",
          source: "intuit.dsnBgbseACLLRZNxo2dfc4evmEJdxde58xeeYcZliOU=",
          type: "qbo.customer.created.v1",
          datacontenttype: "application/json",
          time: "2025-09-10T21:31:25.179Z",
          intuitentityid: "1234",
          intuitaccountid: "310687",
          data: {},
        },
        note: "CloudEvents webhooks only notify you of changes — the data field is empty. Use the MCP tools (get_invoice, list_customers, etc.) to fetch the actual entity after receiving a notification.",
      });
    } catch (error) {
      return mcpError(error);
    }
  },
);

server.registerTool(
  "get_recent_changes",
  {
    title: "Get Recent Changes",
    description:
      "Poll for entities that changed since a given timestamp using Change Data Capture (CDC). Use this instead of webhooks for real-time monitoring.",
    inputSchema: {
      entities: z
        .string()
        .describe(
          "Comma-separated entity list: Invoice,Payment,Customer,Vendor,Bill,Account",
        ),
      changedSince: z
        .string()
        .describe("ISO 8601 timestamp, e.g. 2026-04-13T00:00:00Z"),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ entities, changedSince }) => {
    try {
      const data = await qboRequest({
        path: "/cdc",
        params: { entities, changedSince },
      });
      return mcpSuccess(data);
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
      "Run a complete month-end close workflow — pull reports, analyze, generate client summary",
    argsSchema: {
      month: z.string().describe("Month to close, e.g. '2026-03'"),
      clientName: z.string().describe("Client/company name for the report"),
    },
  },
  ({ month, clientName }) => {
    const [year, mon] = month.split("-");
    const startDate = `${year}-${mon}-01`;
    const lastDay = new Date(Number(year), Number(mon), 0).getDate();
    const endDate = `${year}-${mon}-${lastDay}`;
    return {
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text:
              `Run month-end close for ${clientName}, period: ${startDate} to ${endDate}.\n\n` +
              "1. Fetch the P&L for this month and prior month for comparison\n" +
              "2. Fetch the Balance Sheet as of month-end\n" +
              "3. Fetch the Trial Balance\n" +
              "4. Check AR aging for overdue receivables\n" +
              "5. Check AP aging for overdue payables\n\n" +
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
      "Pull uncategorized transactions and suggest GL account assignments",
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
            `Fetch transactions from ${startDate} to ${endDate}.\n\n` +
            "Then fetch the chart of accounts.\n\n" +
            "For each transaction:\n" +
            "1. Analyze the vendor name and memo/description\n" +
            "2. Suggest the correct GL account from the chart of accounts\n" +
            "3. Flag any anomalies (unusual amounts, duplicates, possible personal expenses)\n" +
            "4. Mark uncertain items as NEEDS REVIEW\n\n" +
            "Present as a table: Date | Vendor | Amount | Suggested GL | Category | Confidence | Flags\n\n" +
            "At the end, summarize: total categorized, total needing review, any anomalies found.",
        },
      },
    ],
  }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("QuickBooks Online MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
