# Complete Example: Tax Preparation Assistant

## Input

**Client Profile:**
- Entity: Meridian Digital Solutions Inc. (S-Corporation, Form 1120-S)
- Industry: Digital marketing consulting
- Owner/Sole Shareholder: James Whitfield, age 42
- Filing status: Married Filing Jointly (spouse Sarah, age 40, W-2 income $65,000 from employer)
- Two children: ages 8 and 11
- Officer salary (W-2): $80,000
- S-Corp distributions taken: $45,000
- Home office: 240 sq ft dedicated office in 2,400 sq ft home
- Business vehicle: personal vehicle, 12,000 business miles / 18,000 total miles
- Solo 401(k) contributions: $23,500 employee deferral + employer match
- S-Corp net income before officer comp: $185,000
- Health insurance: company pays $14,400/year for family plan (>2% shareholder)
- One W-2 employee (part-time admin): $28,000 salary
- State: Texas (no state income tax)

---

## Output

---

### SECTION 1: Customized Document Checklist

#### Corporate Documents (Form 1120-S)

| # | Document | Status | Notes |
|---|----------|--------|-------|
| 1 | Prior year Form 1120-S and K-1 | Needed | For consistency review |
| 2 | QuickBooks P&L (Jan 1 - Dec 31, 2025) | Needed | Accrual or cash basis |
| 3 | QuickBooks Balance Sheet (Dec 31, 2025) | Needed | |
| 4 | Bank statements (all accounts, Dec 2025) | Needed | For reconciliation |
| 5 | Bank reconciliations (Dec 2025) | Needed | |
| 6 | Credit card statements (Dec 2025) | Needed | |
| 7 | Depreciation schedule from prior year | Needed | For continuity |
| 8 | New asset purchases (date, cost, description) | Needed | For Section 179 / depreciation |
| 9 | 1099-NEC forms issued to subcontractors | Needed | Copies of all filed |
| 10 | 1099-K from Stripe/PayPal/Square | Needed | Revenue reconciliation |
| 11 | Payroll reports - annual summary | Needed | W-2 totals, employer taxes |
| 12 | Forms 941 (all quarters) | Needed | Payroll tax reconciliation |
| 13 | Form 940 (annual FUTA) | Needed | |
| 14 | Health insurance premium statements | Needed | >2% shareholder premium |
| 15 | Solo 401(k) contribution records | Needed | Employee + employer amounts |
| 16 | Solo 401(k) Form 5500-EZ (if plan assets > $250K) | If applicable | |
| 17 | Distribution register (dates and amounts) | Needed | Shareholder distributions |
| 18 | Loan to/from shareholder documentation | Needed | If any |
| 19 | Vehicle mileage log | Needed | 12,000 business / 18,000 total |
| 20 | Home office measurements | Needed | 240 sq ft / 2,400 sq ft |
| 21 | Home expenses: mortgage interest, taxes, insurance, utilities | Needed | For home office calculation |

#### Personal Documents (Form 1040)

| # | Document | Status | Notes |
|---|----------|--------|-------|
| 22 | Prior year Form 1040 | Needed | |
| 23 | SSNs for James, Sarah, both children | On file | Verify current |
| 24 | Sarah's W-2 from employer | Needed | $65,000 salary |
| 25 | Schedule K-1 from Meridian Digital | Generated | From 1120-S prep |
| 26 | 1098 Mortgage Interest Statement | Needed | If itemizing |
| 27 | Property tax bills paid | Needed | If itemizing |
| 28 | Charitable contribution receipts | Needed | If itemizing |
| 29 | 1099-INT / 1099-DIV (bank/investment accounts) | Needed | |
| 30 | Sarah's employer 401(k) contribution records | Needed | For retirement planning |
| 31 | HSA contribution records (Form 5498-SA) | If applicable | |
| 32 | Childcare provider info (name, address, EIN, amounts) | Needed | Child/Dependent Care Credit |
| 33 | Bank routing/account for direct deposit | On file | Verify current |

---

### SECTION 2: Deduction Analysis with Calculations

#### A. Officer Compensation Reasonableness Test

| Factor | Amount | Assessment |
|--------|--------|------------|
| Officer W-2 Salary | $80,000 | |
| S-Corp Net Income (before officer comp) | $185,000 | |
| Officer Comp as % of Net Income | 43.2% | Reasonable |
| Comparable salary range (digital marketing consulting) | $70,000 - $120,000 | Within range |
| Health insurance (included on W-2 Box 1) | $14,400 | Properly reported |
| Total W-2 compensation (salary + health ins) | $94,400 | |

**Assessment:** Officer compensation of $80,000 (or $94,400 including health insurance) is reasonable for a single-owner digital marketing consultancy with $185,000 in net income. The compensation represents 43% of pre-comp net income, which is within the acceptable range. The IRS generally looks for at least 40-60% of profits allocated to reasonable compensation. No adjustment recommended.

#### B. S-Corp Income Flow-Through

| Item | Amount | Tax Treatment |
|------|--------|---------------|
| S-Corp Net Income (after officer comp, before distributions) | $105,000 | Passes through on K-1 |
| Less: Employer 401(k) match | TBD (see below) | Corporate deduction |
| Less: Self-employed health insurance (>2% shareholder) | $14,400 | Deducted on personal 1040 |
| K-1 Ordinary Business Income (estimated) | ~$88,600 | Taxed on personal return |
| Distributions to shareholder | $45,000 | Not taxable (reduces basis) |

**Note:** K-1 income is subject to income tax but NOT self-employment tax (this is the primary advantage of the S-Corp election). Distributions are tax-free to the extent of shareholder basis.

#### C. Retirement Contributions

| Contribution Type | Amount | Limit | Notes |
|-------------------|--------|-------|-------|
| Employee 401(k) deferral | $23,500 | $23,500 | Maximum contribution - good |
| Employer profit sharing (25% of $80,000) | $20,000 | $20,000 | Maximum on $80K salary |
| **Total Solo 401(k)** | **$43,500** | **$70,000** | Below max but limited by salary |
| Catch-up (age 50+) | N/A | $7,500 | Not yet eligible (age 42) |

**Tax savings from retirement contributions:**
- $43,500 x estimated 32% marginal rate = **$13,920 in federal tax savings**
- Employer contribution of $20,000 is deducted on the S-Corp return (reduces K-1 income)
- Employee deferral of $23,500 reduces taxable W-2 income

**Optimization note:** If officer salary were increased to $90,000, the employer match could increase to $22,500 (25% x $90,000), adding $2,500 to tax-sheltered retirement savings. However, this would increase payroll taxes by approximately $382 (7.65% employer + employee on the incremental $10,000, net of the additional deduction). Net benefit: approximately $418 in additional tax savings. Consider for 2026.

#### D. Home Office Deduction

**Method comparison:**

| Method | Calculation | Deduction |
|--------|-------------|-----------|
| Simplified | 240 sq ft x $5.00 (max 300 sq ft) | $1,200 |
| Regular (actual expenses) | See below | $3,480 |

**Regular Method Calculation (Recommended):**

| Home Expense | Annual Amount | Business % (10%) | Deductible |
|-------------|---------------|-------------------|------------|
| Mortgage Interest | $18,000 | 10% | $1,800 |
| Property Taxes | $7,200 | 10% | $720 |
| Homeowners Insurance | $2,400 | 10% | $240 |
| Utilities (electric, gas, water) | $4,800 | 10% | $480 |
| Home Repairs/Maintenance | $2,400 | 10% | $240 |
| **Subtotal** | | | **$3,480** |
| Depreciation (home portion) | See note | 10% | ~$1,090 |
| **Total Regular Method** | | | **$4,570** |

Business percentage: 240 / 2,400 = **10%**

**Recommendation:** Use the **Regular Method** for a deduction of **$4,570** versus $1,200 under the simplified method. This saves an additional **$3,370** in deductions.

**Depreciation note:** Home depreciation creates a recapture obligation upon sale. The depreciation amount of ~$1,090/year should be disclosed to the client. If they plan to sell the home within 2-3 years, the simplified method may be preferable to avoid recapture complexity.

#### E. Vehicle / Mileage Deduction

| Method | Calculation | Deduction |
|--------|-------------|-----------|
| Standard Mileage | 12,000 miles x $0.70 | $8,400 |
| Actual Expenses (estimated) | See below | ~$5,600 |

**Actual Expense Estimate:**

| Expense | Annual Total | Business % (66.7%) | Deductible |
|---------|-------------|---------------------|------------|
| Gas | $3,600 | 66.7% | $2,401 |
| Insurance | $1,800 | 66.7% | $1,201 |
| Maintenance | $1,200 | 66.7% | $800 |
| Depreciation | $1,800 | 66.7% | $1,201 |
| **Total** | | | **$5,603** |

Business use percentage: 12,000 / 18,000 = **66.7%**

**Recommendation:** Use **Standard Mileage Rate** for a deduction of **$8,400** versus ~$5,600 actual. Standard mileage is significantly more favorable for this vehicle.

**Required documentation:** Contemporaneous mileage log showing date, destination, business purpose, and miles for each trip. If the client does not have a written log, they should begin maintaining one immediately for 2026. For 2025, reconstruct from calendar appointments and client records.

#### F. Self-Employed Health Insurance Deduction (Personal 1040)

| Item | Amount |
|------|--------|
| Health insurance premiums paid by S-Corp | $14,400 |
| Included on James's W-2 (Box 1, not Box 3/5) | $14,400 |
| Deducted on Form 1040 Schedule 1 Line 17 | $14,400 |

This is an above-the-line deduction on the personal return. The S-Corp includes the premium in the W-2 wages (Box 1 only, NOT subject to FICA), and James deducts it on his personal return. Net effect: the health insurance premium is deductible without being subject to self-employment or payroll taxes.

#### G. Qualified Business Income (QBI) Deduction

| Item | Amount |
|------|--------|
| K-1 Ordinary Business Income (estimated) | $88,600 |
| Less: 50% of W-2 wages paid by S-Corp | See test |
| QBI Deduction (20% of QBI) | $17,720 |

**Phase-out test:**
- Combined taxable income (est.): $80,000 (salary) + $65,000 (Sarah W-2) + $88,600 (K-1) - $43,500 (401k) - $14,400 (health ins) - $30,700 (standard deduction) = ~$145,000
- MFJ threshold: $394,600
- **Below threshold: full 20% QBI deduction applies with no W-2/UBIA limitation**

**QBI Deduction: $88,600 x 20% = $17,720**

Tax savings: $17,720 x 24% marginal rate = **$4,253**

---

### SECTION 3: Tax Prep Worksheet

#### S-Corporation (Form 1120-S) Estimated

| Line Item | Amount |
|-----------|--------|
| Gross Revenue | $330,000 (estimated) |
| Less: COGS (if applicable) | $0 |
| Gross Profit | $330,000 |
| Less: Officer Compensation | $80,000 |
| Less: Employee Wages (admin) | $28,000 |
| Less: Employer Payroll Taxes | $12,500 |
| Less: Health Insurance (>2% shareholder) | $14,400 |
| Less: Employee Benefits (401k admin) | $28,000 |
| Less: Employer 401(k) Match | $20,000 |
| Less: Rent / Home Office | $4,570 |
| Less: Vehicle (mileage) | $8,400 |
| Less: Software / Subscriptions | $6,800 |
| Less: Professional Fees | $4,200 |
| Less: Office Supplies | $2,400 |
| Less: Telephone / Internet | $3,600 |
| Less: Advertising | $8,000 |
| Less: Insurance (business) | $3,200 |
| Less: Meals (50%) | $1,800 |
| Less: Travel | $4,500 |
| Less: Other Deductions | $2,400 |
| **Net Ordinary Income** | **$97,230** |
| Less: Section 179 / Depreciation | $8,630 |
| **K-1 Ordinary Business Income** | **$88,600** |

#### Personal Return (Form 1040) Estimated

| Item | Amount |
|------|--------|
| James W-2 (salary + health ins) | $94,400 |
| Sarah W-2 | $65,000 |
| K-1 Ordinary Income | $88,600 |
| Interest / Dividend Income (estimated) | $1,200 |
| **Total Income** | **$249,200** |
| Less: Employee 401(k) Deferral (James) | ($23,500) |
| Less: Sarah's 401(k) (estimated) | ($8,000) |
| Less: SE Health Insurance Deduction | ($14,400) |
| **Adjusted Gross Income (AGI)** | **$203,300** |
| Less: Standard Deduction (MFJ) | ($30,700) |
| Less: QBI Deduction (20% of $88,600) | ($17,720) |
| **Taxable Income** | **$154,880** |

#### Estimated Federal Tax

| Component | Amount |
|-----------|--------|
| Federal income tax (MFJ brackets) | ~$26,200 |
| Less: Child Tax Credit (2 x $2,000) | ($4,000) |
| Less: Child and Dependent Care Credit | ($1,200) est. |
| **Net Federal Tax** | **~$21,000** |
| Plus: FICA on James W-2 ($80,000 x 7.65%) | $6,120 |
| Plus: FICA on Sarah W-2 ($65,000 x 7.65%) | $4,973 |
| **Total Federal Tax Burden** | **~$32,093** |

**Effective federal tax rate:** ~$32,093 / $249,200 = **12.9%**

**S-Corp Tax Savings Analysis:**
If James operated as a sole proprietor (Schedule C), the $88,600 in K-1 income would be subject to self-employment tax at 15.3%, costing an additional **$13,556** in SE tax. The S-Corp election saves approximately **$13,556 per year** in self-employment taxes (after accounting for the reasonable salary FICA).

---

### SECTION 4: Client Summary Letter

---

Dear James and Sarah,

Thank you for providing the information for your 2025 tax returns. Below is a summary of our key findings and recommendations.

**Tax Return Summary:**
- Estimated federal tax liability: approximately $21,000 (after credits)
- S-Corp election continues to save approximately $13,500/year in self-employment taxes
- QBI deduction of $17,720 provides an additional $4,250 in tax savings
- Total retirement contributions of $43,500 shelter $13,920 from current-year taxes

**Key Deductions Claimed:**
- Home office (regular method): $4,570
- Vehicle mileage (12,000 business miles): $8,400
- Retirement contributions: $43,500 ($23,500 employee + $20,000 employer)
- Self-employed health insurance: $14,400
- QBI deduction: $17,720

**Recommendations for 2026:**

1. **Increase officer salary to $90,000.** This allows an additional $2,500 in employer 401(k) contributions, creating approximately $418 in net tax savings after the payroll tax increase.

2. **Maintain a contemporaneous mileage log.** Your 12,000 business miles generated an $8,400 deduction. A daily log (or mileage tracking app like MileIQ) is essential documentation if audited.

3. **Consider a Backdoor Roth IRA for Sarah.** With combined income above the Roth IRA phase-out, a Backdoor Roth contribution of $7,000 each ($14,000 total) would provide tax-free growth for retirement.

4. **Q4 estimated payment.** Based on these projections, ensure your January 15 estimated payment adequately covers the remaining liability to avoid underpayment penalties.

5. **529 Plan contributions.** With two children ages 8 and 11, consider Texas 529 plan contributions. While Texas has no state income tax (so no state deduction), the federal tax-free growth is valuable for college funding.

Please review this summary and let us know if you have any questions. We will finalize and e-file your returns upon your approval.

Best regards,
[Preparer Name], CPA
[Firm Name]
