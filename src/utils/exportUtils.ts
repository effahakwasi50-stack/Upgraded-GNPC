import { FiscalReconciliationOutput } from './fiscalEngine';

export function formatCurrency(amount: number, decimals = 2): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(decimals)}B`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(decimals)}M`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatExactUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatBarrels(bbls: number, decimals = 0): string {
  if (bbls >= 1_000_000) {
    return `${(bbls / 1_000_000).toFixed(2)}M bbls`;
  }
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(bbls)} bbls`;
}

export function formatExactBarrels(bbls: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(bbls);
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

/**
 * Generates an auditable CSV representation of the fiscal reconciliation
 */
export function generateAuditCSV(output: FiscalReconciliationOutput, cargoRef: string): string {
  const { inputs } = output;
  const timestamp = new Date().toISOString();

  const rows: (string | number)[][] = [
    ['GHANA NATIONAL PETROLEUM CORPORATION (GNPC)'],
    ['UPSTREAM FISCAL & ENTITLEMENT RECONCILIATION AUDIT SHEET'],
    ['Legal Mandate: Petroleum (Exploration & Production) Act, 2016 (Act 919) & Model Petroleum Agreement'],
    ['Generated At (UTC)', timestamp],
    ['Concession / Asset', inputs.concessionName],
    ['Lifting / Parcel Ref', cargoRef],
    [],
    ['INPUT FISCAL PARAMETERS', 'Value', 'Unit', 'Statutory / Contractual Basis'],
    ['Monthly Gross Production (Q_gross)', formatExactBarrels(inputs.grossProductionBarrels), 'bbls', 'Metered Terminal Outturn'],
    ['Achieved Crude Lifting Price', inputs.achievedPriceUSD.toFixed(2), 'USD/bbl', 'Dated Brent Index +/- Concession Diff.'],
    ['Total Monthly Costs Claimed (OPEX + CAPEX)', inputs.monthlyCostsUSD.toFixed(2), 'USD', 'Joint Operations Committee Statement'],
    ['Statutory Royalty Rate', (inputs.statutoryRoyaltyRate * 100).toFixed(2) + '%', '%', 'Act 919 Sec 85 / Model PA'],
    ['Cost Recovery Ceiling Cap', (inputs.costRecoveryCap * 100).toFixed(2) + '%', '% of Net', 'Model PA Contractual Cap (70%)'],
    ['GNPC Statutory Carried Interest', (inputs.gnpcCarriedInterestRate * 100).toFixed(2) + '%', '%', 'Act 919 Section 10(2) Default 15%'],
    ['GNPC Additional Paying Interest (CWI)', (inputs.gnpcPayingInterestRate * 100).toFixed(2) + '%', '%', 'Commercial Option Exercised'],
    ['Total GNPC Equity Interest', (output.gnpcTotalEquityRate * 100).toFixed(2) + '%', '%', 'Sum of Carried & Paying Interest'],
    [],
    ['LINE-BY-LINE WATERFALL RECONCILIATION', 'Physical Volume (bbls)', 'Fiscal Value (USD)', 'Share of Gross (%)', 'Audit Formula / Legal Reference'],
    [
      '1. Gross Production Volume (Q_gross)',
      formatExactBarrels(output.grossProductionBarrels),
      formatExactUSD(output.totalGrossRevenueUSD),
      '100.00%',
      'Gross Metered Liftings',
    ],
    [
      '2. Deduct: State Royalty Oil (B_royalty)',
      formatExactBarrels(output.stateRoyaltyBarrels),
      formatExactUSD(output.stateRoyaltyUSD),
      (output.royaltyRate * 100).toFixed(2) + '%',
      `Q_gross * ${(output.royaltyRate * 100).toFixed(1)}% (Off-the-top deduction before costs)`,
    ],
    [
      '3. Net Available Production (Q_net)',
      formatExactBarrels(output.netProductionBarrels),
      formatExactUSD(output.netProductionBarrels * output.achievedPriceUSD),
      ((output.netProductionBarrels / (output.grossProductionBarrels || 1)) * 100).toFixed(2) + '%',
      'Q_gross - B_royalty',
    ],
    [
      '4. Cost Recovery Ceiling Allowed',
      formatExactBarrels(output.maxCostRecoveryBarrelsAllowed),
      formatExactUSD(output.maxCostRecoveryUSDAllowed),
      ((output.maxCostRecoveryBarrelsAllowed / (output.grossProductionBarrels || 1)) * 100).toFixed(2) + '%',
      `70.0% of Q_net (Contractual recovery limit)`,
    ],
    [
      '5. Cost Oil Claimed by Contractor',
      formatExactBarrels(output.costBarrelsClaimed),
      formatExactUSD(output.costUSDRecovered),
      ((output.costBarrelsClaimed / (output.grossProductionBarrels || 1)) * 100).toFixed(2) + '%',
      `min(Costs in USD / Price, 70% Q_net) ${output.isCostCapped ? '[CAPPED]' : '[FULLY RECOVERED]'}`,
    ],
    [
      '   - Unrecovered Costs Carry-Forward Balance',
      formatExactBarrels(output.unrecoveredCostBarrels),
      formatExactUSD(output.unrecoveredCostUSD),
      '-',
      output.isCostCapped ? 'Carry-forward to subsequent lifting period' : 'Nil (100% recovered this period)',
    ],
    [
      '6. Profit Oil Available Pool (Q_profit)',
      formatExactBarrels(output.profitOilBarrels),
      formatExactUSD(output.profitOilUSD),
      ((output.profitOilBarrels / (output.grossProductionBarrels || 1)) * 100).toFixed(2) + '%',
      'Q_net - Cost Oil Claimed',
    ],
    [
      '7. GNPC Equity Profit Oil Share',
      formatExactBarrels(output.gnpcProfitBarrels),
      formatExactUSD(output.gnpcProfitUSD),
      ((output.gnpcProfitBarrels / (output.grossProductionBarrels || 1)) * 100).toFixed(2) + '%',
      `Q_profit * ${(output.gnpcTotalEquityRate * 100).toFixed(2)}% (Carried + Paying)`,
    ],
    [
      '8. Contractor Profit Oil Share',
      formatExactBarrels(output.contractorProfitBarrels),
      formatExactUSD(output.contractorProfitUSD),
      ((output.contractorProfitBarrels / (output.grossProductionBarrels || 1)) * 100).toFixed(2) + '%',
      'Q_profit - GNPC Profit Oil',
    ],
    [],
    ['CONSOLIDATED FISCAL ENTITLEMENT (TAKE SUMMARY)', 'Physical Volume (bbls)', 'Fiscal Value (USD)', 'Effective Take (%)', 'Standard Cargo Parcels (950k bbl)'],
    [
      'TOTAL GHANA STATE TAKE (GNPC + GoG)',
      formatExactBarrels(output.totalGhanaBarrels),
      formatExactUSD(output.totalGhanaRevenueUSD),
      output.effectiveStateTakePercent.toFixed(2) + '%',
      output.standardParcelsGhana.toFixed(2) + ' cargoes',
    ],
    [
      '  - Comprising: State Royalty Oil',
      formatExactBarrels(output.stateRoyaltyBarrels),
      formatExactUSD(output.stateRoyaltyUSD),
      (output.royaltyRate * 100).toFixed(2) + '%',
      (output.stateRoyaltyBarrels / 950000).toFixed(2) + ' cargoes',
    ],
    [
      '  - Comprising: GNPC Profit Oil Equity',
      formatExactBarrels(output.gnpcProfitBarrels),
      formatExactUSD(output.gnpcProfitUSD),
      ((output.gnpcProfitBarrels / (output.grossProductionBarrels || 1)) * 100).toFixed(2) + '%',
      (output.gnpcProfitBarrels / 950000).toFixed(2) + ' cargoes',
    ],
    [
      'TOTAL CONTRACTOR TAKE (Operator Group)',
      formatExactBarrels(output.contractorTotalBarrels),
      formatExactUSD(output.contractorGrossRevenueUSD),
      output.effectiveContractorTakePercent.toFixed(2) + '%',
      output.standardParcelsContractor.toFixed(2) + ' cargoes',
    ],
    [
      '  - Cost Recovery Reimbursement',
      formatExactBarrels(output.costBarrelsClaimed),
      formatExactUSD(output.costUSDRecovered),
      ((output.costBarrelsClaimed / (output.grossProductionBarrels || 1)) * 100).toFixed(2) + '%',
      (output.costBarrelsClaimed / 950000).toFixed(2) + ' cargoes',
    ],
    [
      '  - Contractor Net Profit Share',
      formatExactBarrels(output.contractorProfitBarrels),
      formatExactUSD(output.contractorProfitUSD),
      ((output.contractorProfitBarrels / (output.grossProductionBarrels || 1)) * 100).toFixed(2) + '%',
      (output.contractorProfitBarrels / 950000).toFixed(2) + ' cargoes',
    ],
    [],
    ['PETROLEUM REVENUE MANAGEMENT ACT (PRMA ACT 815) PREVIEW', 'Allocation (USD)', 'Statutory Share (%)', 'Recipient Account'],
    ['GNPC Level A Financing Allocation', formatExactUSD(output.prmaDistribution.gnpcLevelAAllocationUSD), '30.00%', 'GNPC Exploration & Cash-Call Account'],
    ['Petroleum Holding Fund (PHF)', formatExactUSD(output.prmaDistribution.petroleumHoldingFundUSD), '70.00%', 'Bank of Ghana Transit Account'],
    ['  - Annual Budget Funding Amount (ABFA)', formatExactUSD(output.prmaDistribution.annualBudgetFundingAmountUSD), '70% of PHF Net', 'Consolidated Fund (Infrastructure)'],
    ['  - Ghana Petroleum Funds (GPFs)', formatExactUSD(output.prmaDistribution.ghanaPetroleumFundsUSD), '30% of PHF Net', 'Sovereign Wealth Reserves'],
    ['    * Ghana Stabilization Fund (GSF)', formatExactUSD(output.prmaDistribution.ghanaStabilizationFundUSD), '70% of GPFs', 'Macroeconomic Shock Absorber'],
    ['    * Ghana Heritage Fund (GHF)', formatExactUSD(output.prmaDistribution.ghanaHeritageFundUSD), '30% of GPFs', 'Intergenerational Endowment'],
  ];

  const escapeCSV = (field: string | number) => {
    const str = String(field ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  return rows.map((row) => row.map(escapeCSV).join(',')).join('\n');
}

/**
 * Downloads the string content as a CSV file to the user's browser
 */
export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formats a clean executive briefing memorandum for copying to clipboard
 */
export function generateExecutiveBriefingText(output: FiscalReconciliationOutput, cargoRef: string): string {
  const { inputs } = output;
  return `MEMORANDUM | GNPC UPSTREAM FISCAL RECONCILIATION
TO: Chief Executive & Director of Finance, GNPC / Ministry of Energy
FROM: Petroleum Economics & Commercial Division
DATE: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
CONCESSION: ${inputs.concessionName}
LIFTING REFERENCE: ${cargoRef}
GOVERNING STATUTE: Petroleum (Exploration and Production) Act, 2016 (Act 919)

1. EXECUTIVE SUMMARY & REVENUE OUTTURN:
- Monthly Gross Production: ${formatExactBarrels(output.grossProductionBarrels)} bbls
- Achieved Crude Price: $${output.achievedPriceUSD.toFixed(2)}/bbl
- Total Concession Gross Revenue: ${formatExactUSD(output.totalGrossRevenueUSD)}

2. STATE TAKE ALLOCATION:
- Total Ghana Entitlement: ${formatExactBarrels(output.totalGhanaBarrels)} bbls (${output.standardParcelsGhana.toFixed(2)} standard cargo parcels)
- Total State Revenue: ${formatExactUSD(output.totalGhanaRevenueUSD)}
- Effective State Take: ${output.effectiveStateTakePercent.toFixed(2)}% of Gross Value
  * Royalty Barrels (Off-the-top): ${formatExactBarrels(output.stateRoyaltyBarrels)} bbls ($${(output.stateRoyaltyUSD / 1_000_000).toFixed(2)}M)
  * GNPC Profit Oil Equity (${(output.gnpcTotalEquityRate * 100).toFixed(1)}%): ${formatExactBarrels(output.gnpcProfitBarrels)} bbls ($${(output.gnpcProfitUSD / 1_000_000).toFixed(2)}M)

3. CONTRACTOR TAKE & COST RECOVERY:
- Contractor Total Entitlement: ${formatExactBarrels(output.contractorTotalBarrels)} bbls (${formatExactUSD(output.contractorGrossRevenueUSD)})
- Cost Oil Recovered: ${formatExactBarrels(output.costBarrelsClaimed)} bbls ($${(output.costUSDRecovered / 1_000_000).toFixed(2)}M)
- Cost Recovery Cap Status: ${output.isCostCapped ? `CEILING REACHED (70% cap enforced). Unrecovered Carry-Forward: ${formatExactUSD(output.unrecoveredCostUSD)} (${formatExactBarrels(output.unrecoveredCostBarrels)} bbls)` : 'Fully recovered (Costs below 70% contractual cap)'}
- Contractor Net Profit Share: ${formatExactBarrels(output.contractorProfitBarrels)} bbls ($${(output.contractorProfitUSD / 1_000_000).toFixed(2)}M)

4. PRMA ACT 815 PROJECTED DISTRIBUTION:
- GNPC Level A (Exploration & Financing): ${formatExactUSD(output.prmaDistribution.gnpcLevelAAllocationUSD)}
- Petroleum Holding Fund (PHF): ${formatExactUSD(output.prmaDistribution.petroleumHoldingFundUSD)}
  * Annual Budget Funding Amount (ABFA): ${formatExactUSD(output.prmaDistribution.annualBudgetFundingAmountUSD)}
  * Ghana Stabilization Fund (GSF): ${formatExactUSD(output.prmaDistribution.ghanaStabilizationFundUSD)}
  * Ghana Heritage Fund (GHF): ${formatExactUSD(output.prmaDistribution.ghanaHeritageFundUSD)}
`;
}
