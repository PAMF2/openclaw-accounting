# OpenClaw Accounting AI Plugins

> AI-powered workflows for accounting professionals. Connect your tools to Claude or ChatGPT in minutes.

Plugins for accountants, bookkeepers, tax preparers, and CFOs. Works with **Claude** (Anthropic) and **ChatGPT/Codex** (OpenAI). Includes a **QuickBooks Online MCP Server** for live data access from Claude Desktop.

---

## What You Get

A bookkeeper spending 15 min/client on categorization x 20 clients = **5 hours/week saved**.
A tax preparer spending 30 min/return on document checklists x 100 returns = **50 hours saved per season**.
An accountant spending 45 min/client on month-end reports x 15 clients = **11+ hours/month saved**.

Each plugin ships with:
- **System prompts** tuned for Claude Projects and ChatGPT/Codex GPTs (copy-paste setup in 5 minutes)
- **Knowledge files** with real accounting data — chart of accounts, deduction limits, audit matrices, email templates, financial benchmarks
- **Complete examples** showing realistic end-to-end output so you know exactly what the AI produces before you buy
- **A QuickBooks Online MCP server** that connects Claude Desktop directly to your clients' books — pull transactions, P&L, balance sheets, and aging reports without leaving the conversation

---

## Plugins

### 1. Transaction Categorizer — $149

Paste a bank export. Get back categorized transactions with GL codes, anomaly flags, and confidence scores.

- **Auto-categorize** transactions by GL code using vendor name, amount, memo, and historical patterns — handles 200+ transactions in a single batch
- **Anomaly detection** flags duplicates (same vendor + amount within 7 days), unusual amounts (2x+ category average), possible personal expenses, and missing descriptions
- **Deduction identification** catches travel, meals (50% limitation), home office, auto, professional development, and retirement contributions
- **NEEDS REVIEW tagging** marks uncertain categorizations so the bookkeeper only reviews exceptions, not every line

**Knowledge files included:**
| File | What It Contains |
|------|-----------------|
| `knowledge/chart-of-accounts-standard.csv` | Standard GL structure (4XXX Revenue, 5XXX COGS, 6XXX-7XXX OpEx) with account numbers, types, and descriptions |
| `knowledge/common-vendors-gl-mapping.csv` | Pre-built vendor-to-category mappings for common vendors (Amazon, Staples, Uber, airlines, etc.) |
| `knowledge/anomaly-detection-rules.md` | Detection thresholds and flag criteria for duplicates, outliers, personal expenses, and round-number patterns |

**Example:** [`examples/complete-example-transaction-categorization.md`](plugins/transaction-categorizer/examples/complete-example-transaction-categorization.md) — 50+ transactions categorized for a consulting firm with GL codes, flags, and a summary report.

---

### 2. Month-End Reporter — $199

Paste a trial balance or P&L. Get a client-ready monthly financial summary with variance analysis and advisory notes.

- **Income Statement summary** with month-over-month and year-over-year comparisons, gross margin, and net margin calculations
- **Balance Sheet highlights** including cash position, AR/AP aging status, working capital, and current/quick ratios
- **Variance analysis** auto-flags line items that moved more than 10% from prior month or budget, with plain-language explanations of why
- **Advisory notes** — 2-3 actionable insights based on what the numbers show (e.g., "Accounts receivable grew 22% while revenue was flat — suggest reviewing collection processes")

**Knowledge files included:**
| File | What It Contains |
|------|-----------------|
| `knowledge/financial-ratios-benchmarks.csv` | Industry benchmark data for gross margin, net margin, current ratio, quick ratio, DSO, DPO, and burn rate across 20+ industries |
| `knowledge/variance-explanation-templates.md` | Pre-written variance explanation templates organized by category (revenue, COGS, payroll, rent, utilities, etc.) with common root causes |

**Example:** [`examples/complete-example-month-end-report.md`](plugins/month-end-reporter/examples/complete-example-month-end-report.md) — Full monthly financial package for a SaaS company with P&L, balance sheet, key metrics, variance callouts, and client-facing advisory notes.

---

### 3. Tax Prep Assistant — $199

Describe the client. Get a document checklist, deduction finder, and prep worksheets organized by schedule.

- **Document checklists** customized by entity type — individual (1040), S-Corp (1120-S), C-Corp (1120), partnership (1065) — with specific forms and schedules listed
- **Deduction finder** systematically checks for home office (Form 8829), vehicle (actual vs. standard mileage), meals (50%), retirement contributions (SEP/SIMPLE/401k limits), QBI (Section 199A), SALT cap, charitable, and health insurance deductions
- **Prep worksheets** that organize raw client data by IRS schedule (A, B, C, D, E, SE) so the preparer can work through the return in order
- **Post-filing summary letters** with effective tax rate, key deductions taken, estimated payment schedule for next year, and planning recommendations

**Knowledge files included:**
| File | What It Contains |
|------|-----------------|
| `knowledge/document-checklist-by-entity.md` | Complete document requirements for 1040, 1120-S, 1065, and 1120 returns — organized by income, deductions, credits, and entity-specific items |
| `knowledge/deduction-limits-2025.csv` | Current-year deduction limits and phase-outs: 401(k) ($23,500), HSA ($4,300/$8,550), Section 179 ($1,250,000), standard deduction ($15,000/$30,000), SALT ($10,000), and more |

**Example:** [`examples/complete-example-tax-prep.md`](plugins/tax-prep-assistant/examples/complete-example-tax-prep.md) — Full prep package for an S-Corp owner: document checklist, deduction analysis, officer compensation review, and K-1 preparation notes.

---

### 4. Client Communication — $99

Describe the situation. Get a professional email ready to send — document requests, advisory letters, payment reminders, engagement letters.

- **Document request sequences** with escalating tone — from friendly initial request through urgent final notice with penalty warnings and extension implications
- **Advisory and planning letters** for year-end tax planning, entity restructuring (S-Corp election analysis), estimated payment reminders, and IRS notice responses
- **Engagement and onboarding letters** — new client welcome sequences, annual engagement letters with scope/fees, and scope change notifications
- **Payment collection sequences** — friendly invoice through final notice with service suspension warnings, calibrated to preserve the client relationship

**Knowledge files included:**
| File | What It Contains |
|------|-----------------|
| `knowledge/email-templates-library.md` | 20 complete email templates covering document requests (3-email escalation), engagement letters, advisory letters (year-end planning, entity restructuring, IRS notice response), payment reminders (3-tier escalation), extension notifications, onboarding, referral thank-yous, disengagement letters, mid-year check-ins, bookkeeping recommendations, and fee increase notifications |

**Example:** [`examples/complete-example-email-sequence.md`](plugins/client-communication/examples/complete-example-email-sequence.md) — A 4-email escalation sequence for an S-Corp client who hasn't sent tax documents. Shows the full tone progression from warm (Jan 20) to urgent final notice (Feb 12), with specific penalty amounts and extension consequences.

---

### 5. Audit Prep — $149

Describe the engagement. Get PBC lists, reconciliation templates, workpapers, and audit documentation.

- **PBC (Prepared by Client) lists** organized by financial statement area with due dates, responsibility assignments, and status tracking — customized by entity type and audit scope
- **Reconciliation templates** for bank, accounts receivable aging, accounts payable aging, inventory, fixed asset roll-forward, intercompany balances, and equity roll-forward
- **Audit workpapers** with lead sheets, analytical procedures, substantive test documentation, sample selection methodology, and confirmation letter drafts
- **Audit findings documentation** including management letter comments, internal control deficiency classification (deficiency / significant deficiency / material weakness), and corrective action recommendations

**Knowledge files included:**
| File | What It Contains |
|------|-----------------|
| `knowledge/audit-assertions-matrix.md` | Complete mapping of financial statement assertions (existence, completeness, valuation, rights & obligations, presentation & disclosure) to audit procedures by account area — GAAS and PCAOB aligned |
| `knowledge/pbc-list-templates.csv` | Pre-built PBC list items organized by FS area (cash, receivables, inventory, fixed assets, payables, accrued liabilities, equity, revenue, expenses) with standard document descriptions and typical due dates |

**Example:** [`examples/complete-example-pbc-list.md`](plugins/audit-prep/examples/complete-example-pbc-list.md) — Full PBC list for a manufacturing company audit with 50+ items organized by FS area, due dates, and status tracking.

---

## QuickBooks Online MCP Server

The included MCP server connects Claude Desktop directly to QuickBooks Online, giving AI real-time access to your clients' books. No copy-paste exports needed.

### Tools (14)

| Tool | What It Does |
|------|-------------|
| `get_chart_of_accounts` | Fetch all GL accounts with types, numbers, and balances. Optional filter by account type (Bank, Expense, Income, etc.) |
| `query_transactions` | Pull transactions for a date range — purchases, deposits, transfers, journal entries. Filter by account or transaction type |
| `get_profit_loss` | Fetch the P&L / Income Statement for a date range. Summarize by total, month, quarter, or year |
| `get_balance_sheet` | Fetch the Balance Sheet as of a specific date |
| `get_general_ledger` | Pull the full General Ledger — all transactions by account for a date range. Optional account filter |
| `get_trial_balance` | Fetch the Trial Balance as of a date — all account balances in one view |
| `list_customers` | List all customers/clients. Filter active only |
| `list_vendors` | List all vendors. Filter active only |
| `list_invoices` | List invoices with date range and unpaid/overdue filters |
| `list_bills` | List bills (accounts payable) with date range and unpaid filters |
| `get_ar_aging` | Accounts Receivable aging summary — who owes you and how overdue |
| `get_ap_aging` | Accounts Payable aging summary — what you owe vendors and how overdue |
| `create_journal_entry` | Create a manual journal entry with debit/credit lines. Validates that debits equal credits |
| `get_trial_balance` | Trial Balance report as of any date |

### Prompts (2)

| Prompt | What It Does |
|--------|-------------|
| `month-end-close` | Full month-end workflow: pulls P&L (current + prior month), Balance Sheet, Trial Balance, AR aging, AP aging, then generates a client-ready financial summary with variance analysis and advisory notes |
| `categorize-transactions` | Pulls transactions for a date range, fetches the chart of accounts, then categorizes each transaction with GL code suggestions, confidence levels, and anomaly flags |

### Setup

1. Get QuickBooks Developer credentials at [developer.intuit.com](https://developer.intuit.com)
2. Set environment variables: `QBO_CLIENT_ID`, `QBO_CLIENT_SECRET`, `QBO_REALM_ID`, `QBO_ACCESS_TOKEN`, `QBO_REFRESH_TOKEN`
3. Add to Claude Desktop's MCP config (see [`mcp-server/README.md`](mcp-server/README.md) for details)

The server handles OAuth token refresh automatically. If the access token expires mid-session, it refreshes silently and retries the request.

---

## How It Works

### For Claude Users

1. Open [claude.ai](https://claude.ai) and create a new **Project**
2. Copy the system prompt from the plugin's `claude/system-prompt.md`
3. Upload knowledge files from `claude/knowledge/`
4. Start chatting — AI is now your accounting assistant

### For ChatGPT/Codex Users

1. Go to [chat.openai.com](https://chat.openai.com) and navigate to **Explore GPTs** then **Create**
2. Paste instructions from `codex/instructions.md`
3. Upload knowledge files and configure from `codex/config.json`
4. Save and start using

### For Claude Desktop + QuickBooks (MCP)

1. Install the MCP server (see setup above)
2. Claude Desktop can now pull live data from QuickBooks
3. Combine with any plugin's system prompt for AI-powered accounting with real data access

---

## Target Software Integrations

| Software | Users | Our Plugins |
|----------|-------|-------------|
| **QuickBooks Online** | 7M+ businesses | Transaction Categorizer, Month-End Reporter, Client Communication (via MCP server for live data) |
| **Xero** | 3.5M+ subscribers | Transaction Categorizer, Month-End Reporter, Client Communication |
| **Drake Tax** | 100K+ preparers | Tax Prep Assistant |
| **Lacerte (Intuit)** | 100K+ preparers | Tax Prep Assistant |

---

## Who This Is For

- **Bookkeepers** categorizing 500+ transactions/month per client — stop coding transactions line by line
- **Accountants** preparing monthly financial reports for 20+ clients — generate client-ready reports in minutes instead of hours
- **Tax preparers** during crunch season — faster document processing, deduction identification, and prep worksheet generation
- **Small firm owners** wanting to scale without hiring — handle more clients with the same team
- **Auditors** building PBC lists and workpapers — generate GAAS/PCAOB-compliant documentation from a description of the engagement

---

## Pricing

| Tier | What You Get | Price |
|------|-------------|-------|
| Single Plugin | One plugin with Claude + ChatGPT versions, knowledge files, and examples | $99-$199 |
| Firm Bundle | All 5 plugins + QuickBooks MCP server | $549 |
| Pro Access | All plugins + MCP server + updates + new plugin drops | $49/month |

---

## Repository Structure

```
openclaw-accounting/
├── README.md
├── mcp-server/                         # QuickBooks Online MCP server
│   ├── src/index.ts                    #   14 tools + 2 prompts
│   ├── package.json
│   └── README.md
├── plugins/
│   ├── transaction-categorizer/
│   │   ├── claude/system-prompt.md     # Claude Project instructions
│   │   ├── codex/instructions.md       # ChatGPT/Codex instructions
│   │   ├── codex/config.json           # GPT configuration
│   │   ├── knowledge/                  # 3 files: GL chart, vendor mappings, anomaly rules
│   │   └── examples/                   # Full categorization output example
│   ├── month-end-reporter/
│   │   ├── claude/ + codex/            # System prompts for both platforms
│   │   ├── knowledge/                  # 2 files: ratio benchmarks, variance templates
│   │   └── examples/                   # Full month-end report example
│   ├── tax-prep-assistant/
│   │   ├── claude/ + codex/
│   │   ├── knowledge/                  # 2 files: entity checklists, deduction limits
│   │   └── examples/                   # Full S-Corp prep package example
│   ├── client-communication/
│   │   ├── claude/ + codex/
│   │   ├── knowledge/                  # 1 file: 20 email templates covering all scenarios
│   │   └── examples/                   # 4-email escalation sequence example
│   └── audit-prep/
│       ├── claude/ + codex/
│       ├── knowledge/                  # 2 files: assertions matrix, PBC templates
│       └── examples/                   # Full PBC list example
└── .mcp.json                           # MCP server configuration
```

---

Built by [OpenClaw](https://openclaw.ai) — AI automation for professionals.
