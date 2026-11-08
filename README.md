# GNPC Fiscal & Entitlement Reconciliation Suite (Ghana Upstream Fiscal Engine)

An automated, auditable petroleum fiscal and entitlement reconciliation engine tailored to Ghana’s upstream legal framework—specifically the **Petroleum (Exploration and Production) Act, 2016 (Act 919)** and Ghana’s Model Petroleum Agreements.

---

## Architecture & Project Structure

The project includes two synchronized implementations:
1. **Interactive Web Application (React, TypeScript, Tailwind CSS, Chart.js)**:
   - Full interactive executive dashboard with live parameter sliders, field presets (Jubilee, TEN, Sankofa, Custom), waterfall breakdown charts, Brent price sensitivity curves ($50–$120/bbl), PRMA Act 815 distribution modeling, multi-scenario stress test, and CSV export.
2. **Standalone Python Engine (`app.py`)**:
   - Complete self-contained Python script implementing the exact same Act 919 fiscal waterfall rules, cost recovery cap (70%), carry-forward balances, CLI audit tables, automated unit tests, and optional embedded HTTP API server.

```text
├── app.py                 # Standalone Python fiscal calculation engine & CLI/server
├── index.html             # Web app HTML entry point
├── package.json           # Frontend dependencies
├── src/
│   ├── App.tsx            # Main executive suite dashboard
│   ├── utils/
│   │   ├── fiscalEngine.ts       # TypeScript fiscal calculation engine
│   │   ├── fiscalEngine.test.ts  # Node test runner unit tests
│   │   └── exportUtils.ts        # CSV and memorandum export utilities
│   └── components/
│       ├── Header.tsx            # Executive header with parcel reference and export actions
│       ├── ParameterPanel.tsx    # Field presets and synced input sliders
│       ├── KpiCards.tsx          # Top metric cards (State Take, GNPC Entitlement, Contractor Take)
│       ├── WaterfallChart.tsx    # Step-by-step barrel and USD waterfall chart
│       ├── PriceSensitivityChart.tsx # $50-$120/bbl dynamic revenue curve
│       ├── AuditReconciliationTable.tsx # Line-by-line audit sheet with Act 919 legal citations
│       ├── PrmaDistributionPanel.tsx    # Petroleum Revenue Management Act 815 breakdown
│       └── ScenarioComparatorModal.tsx  # Multi-scenario comparison modal
└── README.md
```

---

## How to Run the Python Engine (`app.py`)

No third-party packages required (standard Python library only).

### 1. Run Automated Unit Tests
```bash
python3 app.py --test
```

### 2. Generate a CLI Audit Table
```bash
# Default Jubilee field report
python3 app.py --field jubilee

# Sankofa OCTP Concession with custom price and operating costs
python3 app.py --field sankofa --price 85.0 --costs 42000000 --cargo SGN-LIFTING-08
```

### 3. Start the Local HTTP Microservice
```bash
python3 app.py --serve 8000
```
Endpoints:
- `GET  /api/presets`
- `POST /api/calculate`
- `POST /api/sensitivity`

---

## How to Run the Web Application

```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Governing Legislation
- **Petroleum (Exploration and Production) Act, 2016 (Act 919)**:
  - Section 85: Payment of Royalties (Off-the-top deduction before cost recovery)
  - Section 10: State Equity Participation & Carried Interest (min. 15% statutory)
  - Section 59: Metering and Custody Transfer
- **Model Petroleum Agreements**:
  - Clause 11: 70% Cost Recovery Ceiling & Carry-Forward Provisions
  - Clause 12: Profit Oil Allocation & Contractor Split
- **Petroleum Revenue Management Act, 2011 (Act 815 & Act 893)**:
  - GNPC Level A Cash Calls (30%)
  - Petroleum Holding Fund (70%)
  - Annual Budget Funding Amount (ABFA - up to 70% of net PHF)
  - Ghana Petroleum Funds (GSF 70% & GHF 30%)
