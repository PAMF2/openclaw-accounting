# Anomaly Detection Rules for Transaction Categorization

## 1. Duplicate Transaction Detection

### Exact Duplicates
- **Rule**: Flag transactions with identical amount, date, and vendor description
- **Threshold**: 100% match on all three fields within a 3-day window
- **Action**: Flag as `DUPLICATE_EXACT` - likely a double-charge or import error
- **Exception**: Recurring subscriptions (same vendor, same amount, monthly intervals)

### Near Duplicates
- **Rule**: Flag transactions with same vendor and amount within 7 days
- **Threshold**: Same vendor pattern + same amount + within 7 calendar days
- **Action**: Flag as `DUPLICATE_POSSIBLE` - request confirmation
- **Exception**: Daily purchases at same vendor (e.g., coffee shops, gas stations) under $50

### Split Transaction Detection
- **Rule**: Flag multiple transactions to the same vendor on the same day that sum to a round number
- **Threshold**: 2+ transactions, same vendor, same day, sum is a round hundred or thousand
- **Action**: Flag as `SPLIT_POSSIBLE` - may be circumventing approval thresholds
- **Example**: Two charges of $4,800 and $4,700 to same vendor = $9,500 (just under $10K threshold)

---

## 2. Amount-Based Anomalies

### Unusual Amount Thresholds by Category

| Category | Normal Range | Flag Threshold | Likely Issue |
|----------|-------------|----------------|--------------|
| Office Supplies | $5 - $500 | > $2,500 | May be equipment (capitalize) |
| Meals & Entertainment | $10 - $200 | > $500 | Excessive; needs documentation |
| Software Subscriptions | $5 - $500/mo | > $2,000/mo | Review for annual charge vs monthly |
| Travel - Airfare | $100 - $1,500 | > $3,000 | First class? International? Needs approval |
| Travel - Lodging | $80 - $400/night | > $600/night | Luxury hotel; needs justification |
| Gas/Fuel | $20 - $120 | > $200 | Fleet vehicle or personal fill-ups |
| Bank Fees | $5 - $50 | > $200 | Wire fees ok; check for penalty charges |
| Professional Fees | $200 - $10,000 | > $25,000 | Large engagement; needs contract review |
| Repairs & Maintenance | $50 - $2,000 | > $10,000 | May need capitalization |
| Advertising | $100 - $5,000 | > $20,000 | Monthly spend spike; verify campaign |

### Round Number Detection
- **Rule**: Flag transactions that are exact round numbers ($1,000, $5,000, $10,000)
- **Threshold**: Any transaction that is a multiple of $1,000 over $2,000
- **Rationale**: Real expenses rarely land on exact thousands; may indicate estimates, advances, or loans
- **Exception**: Rent, loan payments, and recurring fixed charges

### Micro-Transaction Patterns
- **Rule**: Flag clusters of very small transactions ($0.01 - $5.00) to the same vendor
- **Threshold**: 3+ micro-transactions within 24 hours
- **Rationale**: May indicate card testing fraud or authorization holds
- **Action**: Flag as `MICRO_CLUSTER` - verify with cardholder

### Large Transaction Alert
- **Rule**: Flag any single transaction exceeding defined thresholds
- **Thresholds by business size**:
  - Small business (< $1M revenue): > $5,000
  - Medium business ($1M - $10M): > $15,000
  - Large business (> $10M): > $50,000
- **Action**: Flag as `LARGE_TRANSACTION` - needs approval documentation

---

## 3. Timing-Based Anomalies

### Weekend and Holiday Transactions
- **Rule**: Flag transactions occurring on weekends or federal holidays
- **Categories to flag**: Office supplies, professional fees, repairs
- **Categories to exempt**: Online subscriptions, automatic payments, gas, meals
- **Action**: Flag as `OFF_HOURS` - verify business purpose

### After-Hours Transactions
- **Rule**: Flag in-person transactions (POS) occurring between 10 PM and 5 AM
- **Threshold**: Any POS transaction in the late-night window
- **Exception**: Restaurants, bars, entertainment venues, 24-hour stores
- **Action**: Flag as `AFTER_HOURS` - may indicate personal use of company card

### End-of-Period Spikes
- **Rule**: Flag unusual transaction volume in last 5 days of month or quarter
- **Threshold**: Transaction count or total amount > 2x the daily average for that vendor/category
- **Rationale**: May indicate expense loading to hit budget or year-end spending
- **Action**: Flag as `PERIOD_END_SPIKE` - review for proper period allocation

### Dormant Vendor Reactivation
- **Rule**: Flag transactions from a vendor not seen in 90+ days
- **Threshold**: No prior transaction from same vendor pattern in last 90 days
- **Action**: Flag as `DORMANT_VENDOR` - verify vendor relationship is still active

---

## 4. Personal Expense Indicators

### Known Personal Expense Vendors
Flag any transaction matching these vendor patterns as `PERSONAL_POSSIBLE`:

| Vendor Pattern | Why Suspect |
|----------------|------------|
| NETFLIX* | Streaming entertainment |
| HULU* | Streaming entertainment |
| SPOTIFY* | Personal music streaming |
| DISNEY+* | Streaming entertainment |
| HBO MAX* | Streaming entertainment |
| APPLE MUSIC* | Personal music streaming |
| YOUTUBE PREMIUM | Personal subscription |
| PELOTON* | Personal fitness |
| PLANET FITNESS* | Personal gym membership |
| ORANGETHEORY* | Personal fitness |
| EQUINOX* | Personal gym membership |
| SEPHORA* | Personal cosmetics |
| NORDSTROM* | Personal clothing |
| NIKE* | Personal clothing/shoes |
| LULULEMON* | Personal clothing |
| PETCO* | Pet supplies |
| PETSMART* | Pet supplies |
| CHEWY* | Pet supplies |
| INSTACART* | Personal grocery delivery |
| WHOLE FOODS* | Personal groceries (unless catering/office) |
| TRADER JOE* | Personal groceries |
| KROGER* | Personal groceries |
| SAFEWAY* | Personal groceries |
| PUBLIX* | Personal groceries |
| GAMESTOP* | Personal entertainment |
| STEAM* | Personal gaming |
| PLAYSTATION* | Personal gaming |
| XBOX* | Personal gaming |
| TINDER* | Personal dating app |
| BUMBLE* | Personal dating app |
| VENMO* | Person-to-person payment (review recipient) |
| ZELLE* | Person-to-person payment (review recipient) |
| CASH APP* | Person-to-person payment (review recipient) |
| DAYCARE* | Personal childcare |
| TUITION* | Personal education (unless employee benefit) |
| MORTGAGE* | Personal housing |
| STUDENT LOAN* | Personal debt |

### Mixed-Use Vendor Rules
These vendors can be business OR personal - flag for review:

| Vendor Pattern | Business Use | Personal Use |
|----------------|-------------|--------------|
| AMAZON* | Office supplies, equipment | Personal shopping |
| COSTCO* | Bulk office/kitchen supplies | Personal groceries |
| WALMART* | Office supplies | Personal shopping |
| TARGET* | Office supplies | Personal shopping |
| GAS STATIONS | Company vehicle fuel | Personal vehicle fuel |
| UBER/LYFT | Business travel | Personal rides |
| DOORDASH/GRUBHUB | Client/team meals | Personal meals |
| HOME DEPOT/LOWES | Business repairs | Personal home improvement |

### Personal Expense Pattern Detection
- **Rule**: Flag if > 3 personal-indicator transactions in a single month per cardholder
- **Threshold**: 3+ transactions matching personal vendor patterns
- **Action**: Flag as `PERSONAL_PATTERN` - may indicate systematic personal use
- **Escalation**: Notify manager if > 5 personal-indicator transactions in a month

---

## 5. Business-Type-Specific Rules

### Restaurant / Food Service
| Rule | Threshold | Flag |
|------|-----------|------|
| Food cost ratio spike | COGS Food > 35% of Food Revenue | `FOOD_COST_HIGH` |
| Alcohol cost ratio | COGS Beverage > 25% of Bar Revenue | `BEVERAGE_COST_HIGH` |
| Daily cash deposit variance | Cash deposits < 90% of POS cash sales | `CASH_SHORTAGE` |
| Void/comp ratio | Voids + comps > 3% of daily sales | `VOID_EXCESSIVE` |
| Single vendor concentration | > 80% of food purchases from one vendor | `VENDOR_CONCENTRATION` |
| Weekend vs weekday revenue | Weekend per-day < 60% of weekday average | `WEEKEND_DROP` |

### SaaS / Technology
| Rule | Threshold | Flag |
|------|-----------|------|
| Hosting cost spike | Monthly hosting > 1.5x prior month | `HOSTING_SPIKE` |
| New SaaS subscription | New vendor in 6500 category | `NEW_SUBSCRIPTION` |
| Redundant tools | 2+ vendors in same SaaS subcategory | `TOOL_OVERLAP` |
| Developer tool spending | Per-developer tool cost > $500/mo | `DEV_TOOL_HIGH` |
| Single cloud vendor lock | > 90% of hosting at one provider | `CLOUD_CONCENTRATION` |

### Retail
| Rule | Threshold | Flag |
|------|-----------|------|
| Inventory shrink | Physical count < book value by > 2% | `SHRINK_HIGH` |
| Gross margin drop | Margin drops > 3% MoM | `MARGIN_EROSION` |
| Returns spike | Returns > 8% of sales for period | `RETURNS_HIGH` |
| Supplier price increase | Same SKU cost up > 5% from prior order | `PRICE_INCREASE` |
| Excess shipping spend | Shipping > 8% of revenue | `SHIPPING_HIGH` |

### Consulting / Professional Services
| Rule | Threshold | Flag |
|------|-----------|------|
| Subcontractor ratio | 1099 labor > 40% of revenue | `SUBCONTRACTOR_HEAVY` |
| Travel as % of revenue | Travel > 10% of revenue | `TRAVEL_HIGH` |
| Entertainment spending | Entertainment > $500/mo per partner | `ENTERTAINMENT_HIGH` |
| Unbilled time | Contractor cost without matching revenue | `UNBILLED_COST` |

### Construction
| Rule | Threshold | Flag |
|------|-----------|------|
| Material cost per job | Materials > 45% of contract value | `MATERIAL_OVERRUN` |
| Change order frequency | > 3 change orders per project | `CHANGE_ORDER_FREQUENCY` |
| Retainage tracking | Retainage held > 10% past completion | `RETAINAGE_OVERDUE` |
| Equipment idle cost | Rental charges without matching revenue | `EQUIPMENT_IDLE` |
| Permit cost anomaly | Permit fees > 2% of project value | `PERMIT_HIGH` |

---

## 6. Regulatory and Compliance Flags

### IRS Reporting Thresholds
| Threshold | Rule | Action |
|-----------|------|--------|
| $600 | Cumulative payments to single 1099 vendor | Flag for 1099-NEC preparation |
| $10,000 | Single cash transaction or structured series | Flag for FinCEN CTR filing |
| $5,000 | Payments to foreign persons | Flag for 1042-S / withholding review |
| $25 | Per-person gift deduction limit | Flag gifts > $25 per recipient |

### Structuring Detection
- **Rule**: Flag multiple cash deposits just under $10,000 within 30 days
- **Threshold**: 2+ cash deposits of $8,000 - $9,999 within 30 days
- **Action**: Flag as `STRUCTURING_POSSIBLE` - potential BSA/AML concern
- **Severity**: HIGH - requires immediate compliance review

### Related Party Transactions
- **Rule**: Flag payments to vendors sharing name elements with officers/owners
- **Method**: Compare vendor names against known officer/owner names and addresses
- **Action**: Flag as `RELATED_PARTY` - needs disclosure and fair-market-value verification

---

## 7. Confidence Scoring

### Categorization Confidence Levels

| Confidence | Score Range | Criteria | Action |
|------------|------------|----------|--------|
| HIGH | 90-100% | Exact vendor match in mapping + amount in normal range | Auto-categorize |
| MEDIUM | 70-89% | Partial vendor match OR amount slightly outside range | Auto-categorize with review flag |
| LOW | 50-69% | Fuzzy vendor match OR new vendor + reasonable category | Suggest category, require confirmation |
| UNCERTAIN | < 50% | Unknown vendor + ambiguous description | Route to 9999 (Ask Accountant) |

### Confidence Adjustments
- **+10%**: Vendor has been manually confirmed in this category before
- **+5%**: Transaction amount matches prior transactions to same vendor
- **-10%**: Amount is outside the normal range for the category
- **-15%**: Vendor pattern matches multiple possible categories
- **-20%**: Weekend/holiday + personal vendor indicator
- **-30%**: First-time vendor with ambiguous description

---

## 8. Alert Priority Matrix

| Priority | Criteria | Response Time | Notification |
|----------|----------|---------------|-------------|
| CRITICAL | Structuring, fraud indicators, > $50K unexplained | Immediate | Email + SMS to controller |
| HIGH | Duplicate charges, personal expense patterns, > $10K anomaly | Same day | Email to bookkeeper + manager |
| MEDIUM | Category mismatch, unusual amounts, dormant vendor | Within 3 days | Queue for batch review |
| LOW | Minor timing issues, rounding flags, new vendor | Next review cycle | Include in weekly summary |

---

## 9. Machine Learning Enhancement Signals

### Feedback Loop Inputs
When a human reviewer overrides a categorization or dismisses an anomaly flag, record:
- Original category assigned
- Corrected category
- Vendor pattern
- Amount
- Reviewer notes

These corrections should be used to:
1. Update vendor-GL mappings for exact matches
2. Adjust confidence scoring weights
3. Refine anomaly thresholds per client
4. Train per-client categorization preferences over time

### Client-Specific Threshold Calibration
After 3 months of data:
- Calculate actual standard deviations per category per client
- Replace default thresholds with client-specific 2-sigma boundaries
- Flag only transactions outside client-specific norms
- Maintain global thresholds as floor (never relax below them)
