# Complete Example: Transaction Categorization

## Input: Raw Bank Statement Data

Client: Brightline Consulting LLC (S-Corp, management consulting)
Period: March 2025
Account: Chase Business Checking ****4821

```
Date        Description                              Amount      Type
03/01/2025  GUSTO PAYROLL 030125                    -12,450.00  Debit
03/01/2025  GUSTO TAX PYMNT 030125                   -2,988.00  Debit
03/03/2025  STRIPE TRANSFER                          18,750.00  Credit
03/03/2025  STRIPE PROCESSING FEE                      -543.75  Debit
03/04/2025  AMAZON MKTP US*2R4KL7                      -247.99  Debit
03/05/2025  DELTA AIR 0068742981                       -487.20  Debit
03/05/2025  UBER *TRIP 38HXKL                           -34.50  Debit
03/06/2025  MARRIOTT CHICAGO ORD                       -289.00  Debit
03/06/2025  GIBSONS BAR STEAKH                          -187.43  Debit
03/07/2025  UBER *TRIP 49JMPL                           -28.75  Debit
03/07/2025  DELTA AIR 0068742982                       -487.20  Debit
03/10/2025  ADOBE CREATIVE CLD                          -59.99  Debit
03/10/2025  MICROSOFT 365 BUS                           -22.00  Debit
03/10/2025  SLACK TECHNOLOGIES                          -12.50  Debit
03/11/2025  NETFLIX.COM                                 -22.99  Debit
03/12/2025  STRIPE TRANSFER                          31,200.00  Credit
03/12/2025  STRIPE PROCESSING FEE                      -904.80  Debit
03/14/2025  STAPLES #0472                               -89.47  Debit
03/15/2025  GUSTO PAYROLL 031525                    -12,450.00  Debit
03/15/2025  GUSTO TAX PYMNT 031525                   -2,988.00  Debit
03/17/2025  SEPHORA #1294                               -67.50  Debit
03/18/2025  COSTCO WHSE #1042                          -342.18  Debit
03/19/2025  VERIZON WIRELESS                           -185.00  Debit
03/20/2025  STATE FARM INS PREM                        -475.00  Debit
03/21/2025  EFTPS TAX PMT 1120S                      -5,000.00  Debit
03/22/2025  CHASE CHECKING FEE                          -15.00  Debit
03/24/2025  AIRBNB *HMKR87X                            -450.00  Debit
03/25/2025  WHOLE FOODS MKT #10847                      -53.22  Debit
```

---

## Output: Categorized Transactions

### Categorized Transaction Detail

| Date | Description | Amount | GL Code | GL Account Name | Category | Confidence | Flags |
|------|-------------|--------|---------|-----------------|----------|------------|-------|
| 03/01 | GUSTO PAYROLL 030125 | -$12,450.00 | 6000 | Salaries and Wages | Payroll | 95% HIGH | |
| 03/01 | GUSTO TAX PYMNT 030125 | -$2,988.00 | 6100 | Payroll Taxes - Employer | Payroll Taxes | 95% HIGH | |
| 03/03 | STRIPE TRANSFER | $18,750.00 | 4020 | Revenue - Consulting Fees | Revenue | 90% HIGH | |
| 03/03 | STRIPE PROCESSING FEE | -$543.75 | 7410 | Payment Processing Fees | Bank/Processing | 95% HIGH | Verify: fee rate is 2.9% of $18,750 = $543.75 - matches |
| 03/04 | AMAZON MKTP US*2R4KL7 | -$247.99 | 6400 | Office Supplies | Supplies | 65% LOW | REVIEW: Amazon can be personal; amount is moderate. Confirm business purpose. |
| 03/05 | DELTA AIR 0068742981 | -$487.20 | 7000 | Travel - Airfare | Travel | 95% HIGH | |
| 03/05 | UBER *TRIP 38HXKL | -$34.50 | 7030 | Travel - Ground Transport | Travel | 85% MEDIUM | Appears to be airport rideshare (same day as flight) |
| 03/06 | MARRIOTT CHICAGO ORD | -$289.00 | 7010 | Travel - Lodging | Travel | 95% HIGH | |
| 03/06 | GIBSONS BAR STEAKH | -$187.43 | 7100 | Business Meals | Meals | 80% MEDIUM | 50% deductible. High amount - document attendees and business purpose. |
| 03/07 | UBER *TRIP 49JMPL | -$28.75 | 7030 | Travel - Ground Transport | Travel | 85% MEDIUM | Return trip - consistent with travel pattern |
| 03/07 | DELTA AIR 0068742982 | -$487.20 | 7000 | Travel - Airfare | Travel | 90% HIGH | DUPLICATE_POSSIBLE: Same vendor, same amount as 03/05. Likely return flight - confirmed by 2-day gap. |
| 03/10 | ADOBE CREATIVE CLD | -$59.99 | 6500 | Software Subscriptions | Technology | 95% HIGH | |
| 03/10 | MICROSOFT 365 BUS | -$22.00 | 6500 | Software Subscriptions | Technology | 95% HIGH | |
| 03/10 | SLACK TECHNOLOGIES | -$12.50 | 6500 | Software Subscriptions | Technology | 95% HIGH | |
| 03/11 | NETFLIX.COM | -$22.99 | 9999 | Uncategorized / Ask Accountant | PERSONAL | 95% HIGH | PERSONAL_POSSIBLE: Netflix is a personal streaming service. Reclassify to Owner's Draws (3210) or request reimbursement. |
| 03/12 | STRIPE TRANSFER | $31,200.00 | 4020 | Revenue - Consulting Fees | Revenue | 90% HIGH | |
| 03/12 | STRIPE PROCESSING FEE | -$904.80 | 7410 | Payment Processing Fees | Bank/Processing | 95% HIGH | Verify: 2.9% of $31,200 = $904.80 - matches |
| 03/14 | STAPLES #0472 | -$89.47 | 6400 | Office Supplies | Supplies | 95% HIGH | |
| 03/15 | GUSTO PAYROLL 031525 | -$12,450.00 | 6000 | Salaries and Wages | Payroll | 95% HIGH | |
| 03/15 | GUSTO TAX PYMNT 031525 | -$2,988.00 | 6100 | Payroll Taxes - Employer | Payroll Taxes | 95% HIGH | |
| 03/17 | SEPHORA #1294 | -$67.50 | 9999 | Uncategorized / Ask Accountant | PERSONAL | 95% HIGH | PERSONAL_POSSIBLE: Sephora is a personal cosmetics retailer. Reclassify to Owner's Draws (3210) or request reimbursement. |
| 03/18 | COSTCO WHSE #1042 | -$342.18 | 6400 | Office Supplies | Supplies | 55% LOW | REVIEW: Costco can be office supplies, kitchen supplies, or personal. Amount is high for supplies. Request receipt to confirm business purpose. |
| 03/19 | VERIZON WIRELESS | -$185.00 | 6350 | Cell Phone | Telecom | 85% MEDIUM | If mixed personal/business use, determine business percentage. |
| 03/20 | STATE FARM INS PREM | -$475.00 | 6800 | Insurance - General Liability | Insurance | 80% MEDIUM | Verify policy type. Could be auto (6850) or GL (6800). Check policy schedule. |
| 03/21 | EFTPS TAX PMT 1120S | -$5,000.00 | 2300 | Federal Income Tax Payable | Tax Payment | 90% HIGH | Not an expense - debit to liability account. Estimated tax payment for S-Corp. |
| 03/22 | CHASE CHECKING FEE | -$15.00 | 7400 | Bank Service Charges | Bank Fees | 95% HIGH | |
| 03/24 | AIRBNB *HMKR87X | -$450.00 | 7010 | Travel - Lodging | Travel | 70% MEDIUM | REVIEW: No corresponding airfare or other travel expenses on this date. Could be personal vacation rental. Confirm business purpose and destination. |
| 03/25 | WHOLE FOODS MKT #10847 | -$53.22 | 9999 | Uncategorized / Ask Accountant | PERSONAL | 85% HIGH | PERSONAL_POSSIBLE: Grocery store purchase. Unless for a client meeting or office event, reclassify to Owner's Draws (3210). |

---

### Anomaly Summary

| Flag Type | Count | Items |
|-----------|-------|-------|
| PERSONAL_POSSIBLE | 3 | Netflix ($22.99), Sephora ($67.50), Whole Foods ($53.22) |
| REVIEW NEEDED | 3 | Amazon ($247.99), Costco ($342.18), Airbnb ($450.00) |
| DUPLICATE_POSSIBLE | 1 | Delta Air ($487.20) - confirmed as return flight |
| HIGH MEAL EXPENSE | 1 | Gibsons ($187.43) - needs attendee documentation |

**Total personal expense flags: $143.71** (recommend reclassifying to Owner's Draws GL 3210)

**Items requiring client confirmation: 4 transactions totaling $1,040.17**

---

### Monthly Summary by Category

| Category | Total | % of Expenses | vs. Prior Month |
|----------|-------|---------------|-----------------|
| Payroll (6000) | $24,900.00 | 52.3% | Flat |
| Payroll Taxes (6100) | $5,976.00 | 12.5% | Flat |
| Travel - Airfare (7000) | $974.40 | 2.0% | +$974.40 (new) |
| Travel - Lodging (7010) | $739.00 | 1.6% | +$739.00 (new) |
| Travel - Ground (7030) | $63.25 | 0.1% | +$63.25 (new) |
| Business Meals (7100) | $187.43 | 0.4% | +$187.43 (new) |
| Software/SaaS (6500) | $94.49 | 0.2% | Flat |
| Office Supplies (6400) | $89.47 | 0.2% | -$12.53 |
| Payment Processing (7410) | $1,448.55 | 3.0% | +$448.55 |
| Cell Phone (6350) | $185.00 | 0.4% | Flat |
| Insurance (6800) | $475.00 | 1.0% | Flat |
| Bank Fees (7400) | $15.00 | 0.0% | Flat |
| **Total Operating Expenses** | **$35,147.59** | | |
| Tax Payment (2300) | $5,000.00 | N/A (balance sheet) | +$5,000 |
| Pending Review | $1,040.17 | N/A | |
| Personal (reclassify) | $143.71 | N/A | |

---

### Revenue Summary

| Source | Amount | Processing Fee | Net Revenue |
|--------|--------|---------------|-------------|
| Stripe 03/03 | $18,750.00 | $543.75 | $18,206.25 |
| Stripe 03/12 | $31,200.00 | $904.80 | $30,295.20 |
| **Total** | **$49,950.00** | **$1,448.55** | **$48,501.45** |

**Effective processing rate: 2.90%**

---

### Action Items for Client

1. **Confirm business purpose** for Amazon purchase ($247.99) on 03/04 - provide receipt
2. **Confirm business purpose** for Costco purchase ($342.18) on 03/18 - provide receipt
3. **Confirm business purpose** for Airbnb stay ($450.00) on 03/24 - provide travel documentation
4. **Reimburse company** for personal charges: Netflix ($22.99), Sephora ($67.50), Whole Foods ($53.22) = **$143.71 total**
5. **Provide meal documentation** for Gibsons steakhouse ($187.43) - who attended and business purpose
6. **Clarify insurance policy type** for State Farm ($475.00) - is this general liability, auto, or another coverage?
7. **Determine business use %** for Verizon cell phone ($185.00) if phone is used for both business and personal
