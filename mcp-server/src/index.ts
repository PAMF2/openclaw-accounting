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

// --- Token Refresh ---------------------------------------------------------

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

// --- API Client -----------------------------------------------------------

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

  let res = await fetch(url.toString(), {
    method: opts.method ?? "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401) {
    await refreshAccessToken();
    res = await fetch(url.toString(), {
      method: opts.method ?? "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
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

// --- MCP Server -----------------------------------------------------------

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

// --- TOOL: Get Chart of Accounts ------------------------------------------

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
      if (accountType)
        query = `SELECT * FROM Account WHERE AccountType = '${accountType}' MAXRESULTS 1000`;
      const data = await qboQuery(query);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- TOOL: Query Transactions ---------------------------------------------

server.registerTool(
  "query_transactions",
  {
    title: "Query Transactions",
    description:
      "Fetch transactions from QuickBooks for a date range. Returns purchases, deposits, transfers, and journal entries.",
    inputSchema: {
      startDate: z.string().describe("Start date YYYY-MM-DD"),
      endDate: z.string().describe("End date YYYY-MM-DD"),
      accountName: z
        .string()
        .optional()
        .describe("Filter by account name (e.g. 'Checking')"),
      txnType: z
        .string()
        .optional()
        .describe("Filter by type: Purchase, Deposit, Transfer, JournalEntry"),
      limit: z.number().optional().default(100),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ startDate, endDate, accountName, txnType, limit }) => {
    try {
      let query = `SELECT * FROM Purchase WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' MAXRESULTS ${limit}`;
      if (txnType === "Deposit") {
        query = `SELECT * FROM Deposit WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' MAXRESULTS ${limit}`;
      } else if (txnType === "JournalEntry") {
        query = `SELECT * FROM JournalEntry WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' MAXRESULTS ${limit}`;
      } else if (txnType === "Transfer") {
        query = `SELECT * FROM Transfer WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' MAXRESULTS ${limit}`;
      }
      const data = await qboQuery(query);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- TOOL: Get Profit & Loss Report ---------------------------------------

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
      const data = await qboRequest({
        path: "/reports/ProfitAndLoss",
        params: {
          start_date: startDate,
          end_date: endDate,
          summarize_column_by: summarizeBy,
          minorversion: 75,
        },
      });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- TOOL: Get Balance Sheet ----------------------------------------------

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
      const data = await qboRequest({
        path: "/reports/BalanceSheet",
        params: { date_macro: undefined, as_of: asOfDate, minorversion: 75 },
      });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- TOOL: Get General Ledger ---------------------------------------------

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
        start_date: startDate,
        end_date: endDate,
        minorversion: 75,
      };
      if (account) params.account = account;
      const data = await qboRequest({ path: "/reports/GeneralLedger", params });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- TOOL: List Customers -------------------------------------------------

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
      const where = active ? "WHERE Active = true" : "";
      const data = await qboQuery(
        `SELECT * FROM Customer ${where} MAXRESULTS ${limit}`,
      );
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- TOOL: List Vendors ---------------------------------------------------

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
      const where = active ? "WHERE Active = true" : "";
      const data = await qboQuery(
        `SELECT * FROM Vendor ${where} MAXRESULTS ${limit}`,
      );
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- TOOL: List Invoices --------------------------------------------------

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
      const conditions: string[] = [];
      if (startDate) conditions.push(`TxnDate >= '${startDate}'`);
      if (endDate) conditions.push(`TxnDate <= '${endDate}'`);
      if (unpaidOnly) conditions.push("Balance > '0'");
      const where =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const data = await qboQuery(
        `SELECT * FROM Invoice ${where} ORDERBY DueDate MAXRESULTS ${limit}`,
      );
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- TOOL: List Bills -----------------------------------------------------

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
      const conditions: string[] = [];
      if (startDate) conditions.push(`TxnDate >= '${startDate}'`);
      if (endDate) conditions.push(`TxnDate <= '${endDate}'`);
      if (unpaidOnly) conditions.push("Balance > '0'");
      const where =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const data = await qboQuery(
        `SELECT * FROM Bill ${where} ORDERBY DueDate MAXRESULTS ${limit}`,
      );
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- TOOL: Get Accounts Receivable Aging ----------------------------------

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
      if (asOfDate) params.report_date = asOfDate;
      const data = await qboRequest({
        path: "/reports/AgedReceivables",
        params,
      });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- TOOL: Get Accounts Payable Aging -------------------------------------

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
      if (asOfDate) params.report_date = asOfDate;
      const data = await qboRequest({ path: "/reports/AgedPayables", params });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- TOOL: Create Journal Entry -------------------------------------------

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

      const data = await qboRequest({
        method: "POST",
        path: "/journalentry",
        params: { minorversion: 75 },
        body: {
          TxnDate: date,
          PrivateNote: memo,
          Line: jeLine,
        },
      });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- TOOL: Get Trial Balance ----------------------------------------------

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
      const data = await qboRequest({
        path: "/reports/TrialBalance",
        params: { date_macro: undefined, as_of: asOfDate, minorversion: 75 },
      });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- PROMPT: Month-End Close ----------------------------------------------

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

// --- PROMPT: Transaction Review -------------------------------------------

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

// --- Start Server ---------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("QuickBooks Online MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
