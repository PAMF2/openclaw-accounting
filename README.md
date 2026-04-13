# Accounting AI Plugins — Claude + Codex + Perplexity + Manus

> The first downloadable AI plugins built for accounting professionals. Categorize transactions, close month-end, prep tax returns, and generate audit workpapers in minutes.

A bookkeeper spending 15 minutes per client on categorization across 20 clients loses 5 hours a week. A tax preparer doing document checklists for 100 returns burns 50 hours a season. These plugins eliminate that — and if you use Claude, the QuickBooks Online MCP server connects live to your clients' books.

---

## What's Inside

| Plugin | What It Does | Best For |
|--------|-------------|----------|
| Transaction Categorizer | Batch-categorizes transactions by GL code with anomaly flags, duplicate detection, deduction identification, and NEEDS REVIEW tagging for exceptions. | Bookkeepers handling 200+ transactions/month per client |
| Month-End Reporter | Turns a trial balance or P&L into a client-ready monthly summary with variance analysis, ratio calculations, and 2-3 actionable advisory notes. | Accountants closing 15+ clients/month |
| Tax Prep Assistant | Generates document checklists by entity type (1040/1120-S/1065/1120), runs a systematic deduction finder, organizes prep worksheets by IRS schedule. | Tax preparers during crunch season |
| Client Communication | Drafts professional emails for any situation — document requests with escalating tone, engagement letters, advisory notes, payment reminders, IRS notice responses. | Firms wanting consistent, professional client communication |
| Audit Prep | Produces PBC lists by FS area, reconciliation templates, audit workpapers with lead sheets and substantive test documentation, and internal control deficiency write-ups. | Auditors building engagement documentation |

---

## Platforms

Works as a downloadable plugin for:

- **Claude Code** — Full MCP server integration + Claude Code skills (auto-invoked commands)
- **ChatGPT / Codex** — Custom GPT with knowledge files and conversation starters
- **Perplexity** — Space instructions with search-optimized prompts
- **Manus** — Autonomous agent instructions

---

## Quick Start

### Claude Code (recommended)

```bash
# Clone the repo
git clone https://github.com/PAMF2/accounting-ai-plugins.git

# Install as a Claude Code plugin
claude plugin install ./accounting-ai-plugins
```

Skills auto-register. Type `/categorize-transactions`, `/month-end-report`, `/tax-prep`, `/client-email`, or `/audit-prep` in any Claude Code session.

### Claude (claude.ai)

1. Open [claude.ai](https://claude.ai) and create a new **Project**
2. Copy the system prompt from `plugins/<plugin-name>/claude/system-prompt.md` into Project instructions
3. Upload knowledge files from `plugins/<plugin-name>/claude/knowledge/`
4. Start the conversation — the AI is now a trained accounting specialist

### ChatGPT / Codex

1. Go to [chat.openai.com](https://chat.openai.com) > **Explore GPTs** > **Create**
2. Paste the contents of `plugins/<plugin-name>/codex/instructions.md` into the instructions field
3. Upload knowledge files from `plugins/<plugin-name>/codex/knowledge/`
4. Add conversation starters from `plugins/<plugin-name>/codex/config.json`
5. Save and use

### Perplexity

1. Open Perplexity and go to **Spaces**
2. Create a new Space for the plugin
3. Paste the system prompt from `plugins/<plugin-name>/claude/system-prompt.md` as the Space instructions
4. Start a conversation — Perplexity applies the prompt across all searches in that Space

### Manus

1. Open Manus and create a new agent
2. Paste the system prompt from `plugins/<plugin-name>/claude/system-prompt.md` as agent instructions
3. Upload knowledge files as agent context
4. Deploy for autonomous accounting task execution

---

## MCP Server — QuickBooks Online

Connect Claude directly to QuickBooks Online. Pull live P&Ls, balance sheets, transaction lists, AR/AP aging, and the general ledger — then feed that data straight into any plugin's workflow. No exports, no copy-paste.

**14 tools, 2 prompts.**

| Tool | What It Does |
|------|-------------|
| `get_chart_of_accounts` | All GL accounts with types, numbers, and balances. Filter by account type. |
| `query_transactions` | Transactions for a date range — purchases, deposits, transfers, journal entries |
| `get_profit_loss` | P&L for a date range, summarized by total, month, quarter, or year |
| `get_balance_sheet` | Balance Sheet as of a specific date |
| `get_general_ledger` | Full General Ledger — all transactions by account for a date range |
| `get_trial_balance` | Trial Balance as of any date — all account balances in one view |
| `list_customers` | All customers with active filter |
| `list_vendors` | All vendors with active filter |
| `list_invoices` | Invoices with date range and unpaid/overdue filters |
| `list_bills` | Bills (AP) with date range and unpaid filters |
| `get_ar_aging` | Accounts Receivable aging — who owes you and how overdue |
| `get_ap_aging` | Accounts Payable aging — what you owe vendors and how overdue |
| `create_journal_entry` | Manual journal entry with debit/credit lines. Validates that debits equal credits. |
| `get_trial_balance` | Trial Balance report as of any date |

| Prompt | What It Does |
|--------|-------------|
| `month-end-close` | Pulls P&L (current + prior month), Balance Sheet, Trial Balance, AR/AP aging — generates a client-ready financial summary with variance analysis and advisory notes |
| `categorize-transactions` | Pulls transactions for a date range, fetches the chart of accounts, categorizes each transaction with GL code, confidence level, and anomaly flags |

**Setup:**

```json
{
  "mcpServers": {
    "quickbooks": {
      "command": "npx",
      "args": ["-y", "quickbooks-mcp"],
      "env": {
        "QBO_CLIENT_ID": "your-client-id",
        "QBO_CLIENT_SECRET": "your-client-secret",
        "QBO_REALM_ID": "your-realm-id",
        "QBO_ACCESS_TOKEN": "your-access-token",
        "QBO_REFRESH_TOKEN": "your-refresh-token"
      }
    }
  }
}
```

Get credentials at [developer.intuit.com](https://developer.intuit.com). The server handles OAuth token refresh automatically — if your access token expires mid-session, it refreshes silently and retries.

---

## Plugin Structure

```
accounting-ai-plugins/
├── README.md
├── .claude-plugin/
│   └── plugin.json                         # Plugin manifest (skills registration)
├── mcp-server/                             # QuickBooks Online MCP server
│   ├── src/index.ts                        #   14 tools, 2 prompts
│   ├── package.json
│   └── README.md
└── plugins/
    ├── transaction-categorizer/
    │   ├── claude/system-prompt.md         # Claude Project instructions
    │   ├── codex/instructions.md           # ChatGPT/Codex GPT instructions
    │   ├── codex/config.json               # GPT name, description, starters
    │   ├── knowledge/                      # GL chart, vendor mappings, anomaly rules
    │   ├── examples/                       # 50+ transactions categorized for consulting firm
    │   └── SKILL.md                        # Claude Code skill
    ├── month-end-reporter/
    │   ├── claude/ + codex/
    │   ├── knowledge/                      # Industry ratio benchmarks, variance templates
    │   └── examples/                       # SaaS company monthly package with advisory notes
    ├── tax-prep-assistant/
    │   ├── claude/ + codex/
    │   ├── knowledge/                      # Entity checklists, 2025 deduction limits
    │   └── examples/                       # S-Corp owner → full prep package
    ├── client-communication/
    │   ├── claude/ + codex/
    │   ├── knowledge/                      # 20 complete email templates
    │   └── examples/                       # 4-email escalation sequence for missing tax docs
    └── audit-prep/
        ├── claude/ + codex/
        ├── knowledge/                      # Assertions matrix (GAAS/PCAOB), PBC templates
        └── examples/                       # Manufacturing company PBC list, 50+ items
```

---

## Pricing

| Product | Price |
|---------|-------|
| Single Plugin | $99 – $199 |
| Firm Bundle (all 5 plugins + QuickBooks MCP server) | $549 |
| Pro Access (all plugins + MCP server + updates) | $49/month |
| Custom Build | Contact us for custom builds |

---

## License

MIT

---

AI automation for accounting professionals.
