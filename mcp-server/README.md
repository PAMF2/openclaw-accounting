# QuickBooks Online MCP Server

> Connect Claude directly to your QuickBooks Online account. Pull transactions, reports, aging, and create journal entries from within Claude.

## Tools (14)

| Tool | What It Does |
|------|-------------|
| `get_chart_of_accounts` | Fetch full COA with types, numbers, balances |
| `query_transactions` | Fetch purchases, deposits, transfers by date range |
| `get_profit_loss` | P&L report (by total, month, quarter, or year) |
| `get_balance_sheet` | Balance sheet as of any date |
| `get_general_ledger` | All transactions by account for a date range |
| `list_customers` | All customers/clients |
| `list_vendors` | All vendors |
| `list_invoices` | Invoices filtered by date, customer, or payment status |
| `list_bills` | AP bills filtered by date or unpaid status |
| `get_ar_aging` | Accounts Receivable aging summary |
| `get_ap_aging` | Accounts Payable aging summary |
| `create_journal_entry` | Create manual journal entries (debit/credit lines) |
| `get_trial_balance` | Trial balance as of any date |

## Prompts

| Prompt | Description |
|--------|------------|
| `month-end-close` | Complete month-end workflow — pull reports, analyze, generate client summary |
| `categorize-transactions` | Pull transactions, match to COA, flag anomalies |

## Installation

### Claude Desktop / Claude Code

```json
{
  "mcpServers": {
    "quickbooks": {
      "command": "npx",
      "args": ["-y", "@openclaw/quickbooks-mcp"],
      "env": {
        "QBO_CLIENT_ID": "your-client-id",
        "QBO_CLIENT_SECRET": "your-client-secret",
        "QBO_REALM_ID": "your-company-realm-id",
        "QBO_ACCESS_TOKEN": "your-access-token",
        "QBO_REFRESH_TOKEN": "your-refresh-token"
      }
    }
  }
}
```

### Get Your Credentials

1. Go to [developer.intuit.com](https://developer.intuit.com)
2. Create an app (Accounting scope)
3. Copy Client ID and Client Secret
4. Run the OAuth 2.0 flow to get access + refresh tokens
5. Find your Realm ID (Company ID) in the OAuth callback URL

The server auto-refreshes expired tokens (access tokens last 1 hour, refresh tokens last 100 days).

## Example Usage

- "Pull this month's P&L and compare to last month"
- "Show me all uncategorized transactions for March"
- "Who owes us money? Show the AR aging report"
- "Run month-end close for Acme Corp, March 2026"
- "Create a journal entry to accrue $5,000 in payroll"
- "What's our current ratio and cash position?"

## Rate Limits

QuickBooks allows 500 requests per minute. The server handles 401s with automatic token refresh.
