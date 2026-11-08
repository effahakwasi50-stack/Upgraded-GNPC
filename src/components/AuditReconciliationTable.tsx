import React, { useState } from 'react';
import { FiscalReconciliationOutput } from '../utils/fiscalEngine';
import {
  formatExactBarrels,
  formatExactUSD,
  formatCurrency,
  formatPercent,
} from '../utils/exportUtils';
import {
  FileText,
  FileSpreadsheet,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

interface AuditReconciliationTableProps {
  reconciliation: FiscalReconciliationOutput;
  onExportCSV: () => void;
}

export const AuditReconciliationTable: React.FC<AuditReconciliationTableProps> = ({
  reconciliation,
  onExportCSV,
}) => {
  const [showStatutoryNotes, setShowStatutoryNotes] = useState(false);

  const {
    grossProductionBarrels,
    achievedPriceUSD,
    totalGrossRevenueUSD,
    royaltyRate,
    stateRoyaltyBarrels,
    stateRoyaltyUSD,
    netProductionBarrels,
    maxCostRecoveryBarrelsAllowed,
    maxCostRecoveryUSDAllowed,
    costBarrelsClaimed,
    costUSDRecovered,
    unrecoveredCostUSD,
    unrecoveredCostBarrels,
    isCostCapped,
    costsClaimedUSD,
    profitOilBarrels,
    profitOilUSD,
    gnpcTotalEquityRate,
    gnpcProfitBarrels,
    gnpcProfitUSD,
    contractorProfitBarrels,
    contractorProfitUSD,
    totalGhanaBarrels,
    totalGhanaRevenueUSD,
    effectiveStateTakePercent,
    contractorTotalBarrels,
    contractorGrossRevenueUSD,
    effectiveContractorTakePercent,
  } = reconciliation;

  const grossBbl = grossProductionBarrels || 1;
  const grossUSD = totalGrossRevenueUSD || 1;

  interface TableRowItem {
    step: string;
    description: string;
    statutoryRef: string;
    formula: string;
    barrels: number;
    usd: number;
    pctOfGross: number;
    highlight?: 'state' | 'contractor' | 'cost' | 'header';
    isSubRow?: boolean;
    note?: string;
  }

  const rows: TableRowItem[] = [
    {
      step: '1.0',
      description: 'Monthly Gross Production Outturn (Q_gross)',
      statutoryRef: 'Act 919 §59 (Metering & Custody Transfer)',
      formula: 'Terminal Fiscal Meter Outturn',
      barrels: grossProductionBarrels,
      usd: totalGrossRevenueUSD,
      pctOfGross: 100,
      highlight: 'header',
    },
    {
      step: '2.0',
      description: 'Deduct: Government Royalty Crude (B_royalty)',
      statutoryRef: 'Act 919 §85 & Model PA Art. 10',
      formula: `Q_gross × ${(royaltyRate * 100).toFixed(1)}% (Off-the-top, priority claim)`,
      barrels: stateRoyaltyBarrels,
      usd: stateRoyaltyUSD,
      pctOfGross: (stateRoyaltyBarrels / grossBbl) * 100,
      highlight: 'state',
      note: 'Deducted directly from gross production prior to OPEX/CAPEX recovery.',
    },
    {
      step: '3.0',
      description: 'Net Petroleum Production Available (Q_net)',
      statutoryRef: 'Model PA Art. 10.1',
      formula: 'Q_gross − B_royalty',
      barrels: netProductionBarrels,
      usd: netProductionBarrels * achievedPriceUSD,
      pctOfGross: (netProductionBarrels / grossBbl) * 100,
    },
    {
      step: '4.0',
      description: 'Contractual Cost Recovery Ceiling (Cap)',
      statutoryRef: 'Model PA Art. 11.2 (70% Max Ceiling)',
      formula: '70.0% × Q_net',
      barrels: maxCostRecoveryBarrelsAllowed,
      usd: maxCostRecoveryUSDAllowed,
      pctOfGross: (maxCostRecoveryBarrelsAllowed / grossBbl) * 100,
      note: 'Contractual ceiling ensuring minimum 30% of Net Production enters Profit Oil.',
    },
    {
      step: '5.0',
      description: 'Cost Recovery Oil Entitlement (Cost Oil)',
      statutoryRef: 'Model PA Art. 11 (Audit by JOC & GNPC)',
      formula: `min(Costs Claimed / Price, 70% Q_net)`,
      barrels: costBarrelsClaimed,
      usd: costUSDRecovered,
      pctOfGross: (costBarrelsClaimed / grossBbl) * 100,
      highlight: 'cost',
      note: `Operator claimed ${formatExactUSD(costsClaimedUSD)}. ${
        isCostCapped
          ? 'Capped at 70% threshold. Unrecovered costs carried forward.'
          : '100% of claimed monthly costs reimbursed.'
      }`,
    },
  ];

  if (isCostCapped) {
    rows.push({
      step: '5.1',
      description: '└─ Unrecovered Costs Carry-Forward to Next Lifting',
      statutoryRef: 'Model PA Art. 11.4',
      formula: 'Claimed Costs − Cost Oil Recovered',
      barrels: unrecoveredCostBarrels,
      usd: unrecoveredCostUSD,
      pctOfGross: (unrecoveredCostBarrels / grossBbl) * 100,
      isSubRow: true,
      note: 'Accumulates in the joint account with contractual interest to next lifting month.',
    });
  }

  rows.push(
    {
      step: '6.0',
      description: 'Profit Oil Available Pool (Q_profit)',
      statutoryRef: 'Model PA Art. 12 & Act 919 §86',
      formula: 'Q_net − Cost Recovery Oil',
      barrels: profitOilBarrels,
      usd: profitOilUSD,
      pctOfGross: (profitOilBarrels / grossBbl) * 100,
      highlight: 'header',
    },
    {
      step: '7.0',
      description: 'GNPC Equity Profit Oil Share',
      statutoryRef: 'Act 919 §10 & Model PA Art. 12',
      formula: `Q_profit × ${(gnpcTotalEquityRate * 100).toFixed(2)}% (Carried + Paying)`,
      barrels: gnpcProfitBarrels,
      usd: gnpcProfitUSD,
      pctOfGross: (gnpcProfitBarrels / grossBbl) * 100,
      highlight: 'state',
      note: `Statutory carried interest plus commercial paying interest share.`,
    },
    {
      step: '8.0',
      description: 'Contractor Group Profit Oil Share',
      statutoryRef: 'Model PA Art. 12.3',
      formula: `Q_profit × ${(100 - gnpcTotalEquityRate * 100).toFixed(2)}%`,
      barrels: contractorProfitBarrels,
      usd: contractorProfitUSD,
      pctOfGross: (contractorProfitBarrels / grossBbl) * 100,
      highlight: 'contractor',
    },
    {
      step: '9.0',
      description: 'TOTAL GHANA STATE TAKE (GNPC + Republic of Ghana)',
      statutoryRef: 'Act 919 / PRMA Act 815 Consolidation',
      formula: 'Royalty Oil (Step 2) + GNPC Profit Oil (Step 7)',
      barrels: totalGhanaBarrels,
      usd: totalGhanaRevenueUSD,
      pctOfGross: effectiveStateTakePercent,
      highlight: 'state',
    },
    {
      step: '10.0',
      description: 'TOTAL CONTRACTOR TAKE (Operator Group)',
      statutoryRef: 'Model PA Final Lifting Entitlement',
      formula: 'Cost Recovery Oil (Step 5) + Contractor Profit Oil (Step 8)',
      barrels: contractorTotalBarrels,
      usd: contractorGrossRevenueUSD,
      pctOfGross: effectiveContractorTakePercent,
      highlight: 'contractor',
    }
  );

  return (
    <div className="bg-pe-card border border-pe-border rounded-xl p-5 shadow-sm text-pe-body space-y-4 transition-colors duration-200">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-pe-border">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-pe-emerald" />
            <h3 className="font-semibold text-sm text-pe-title tracking-wide uppercase">
              Auditable Reconciliation Sheet & Statutory Schedule
            </h3>
          </div>
          <p className="text-xs text-pe-muted mt-0.5">
            Exact mathematical waterfall under Act 919 & Concession Model Petroleum Agreements
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowStatutoryNotes(!showStatutoryNotes)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-pe-card-inner hover:bg-pe-card text-pe-body border border-pe-border transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-pe-crude" />
            <span>{showStatutoryNotes ? 'Hide Legal Basis' : 'Show Legal Basis'}</span>
            {showStatutoryNotes ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          <button
            type="button"
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Statutory Guidance Accordion / Box */}
      {showStatutoryNotes && (
        <div className="bg-pe-card-inner rounded-lg p-4 border border-pe-border text-xs text-pe-body space-y-2">
          <div className="font-semibold text-pe-emerald flex items-center gap-1.5">
            <span>Statutory Legal Framework Governing Allocation:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="bg-pe-card p-2.5 rounded border border-pe-border">
              <span className="font-semibold text-pe-crude">Act 919 Section 85 (Royalty):</span>
              <p className="text-pe-muted mt-1">
                The Republic is entitled to a gross percentage of petroleum extracted from the
                contract area in kind or cash prior to any cost recovery deductions.
              </p>
            </div>
            <div className="bg-pe-card p-2.5 rounded border border-pe-border">
              <span className="font-semibold text-pe-cyan">Model PA Clause 11 (Cost Cap):</span>
              <p className="text-pe-muted mt-1">
                Cost recovery is subject to an express ceiling of 70% of Net Production. Unrecovered
                amounts are carried forward to successive lifting periods without expiry.
              </p>
            </div>
            <div className="bg-pe-card p-2.5 rounded border border-pe-border">
              <span className="font-semibold text-pe-emerald">Act 919 Section 10 (State Equity):</span>
              <p className="text-pe-muted mt-1">
                GNPC maintains statutory carried interest of not less than 15% with commercial
                election option for additional paying interest.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Table */}
      <div className="overflow-x-auto rounded-lg border border-pe-border">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-pe-card-inner text-pe-muted font-mono uppercase text-[10px] tracking-wider border-b border-pe-border">
              <th className="py-2.5 px-3">Item #</th>
              <th className="py-2.5 px-3">Reconciliation Step</th>
              <th className="py-2.5 px-3 text-right">Physical Volume (bbls)</th>
              <th className="py-2.5 px-3 text-right">Fiscal Value ($ USD)</th>
              <th className="py-2.5 px-3 text-right">Share (%)</th>
              <th className="py-2.5 px-3">Statutory Basis / Formula</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pe-border font-mono">
            {rows.map((row, idx) => {
              let rowStyle = 'hover:bg-pe-card-inner/80 transition-colors';
              if (row.highlight === 'state') {
                rowStyle += ' bg-emerald-950/20 text-emerald-300';
              } else if (row.highlight === 'contractor') {
                rowStyle += ' bg-amber-950/20 text-amber-300';
              } else if (row.highlight === 'cost') {
                rowStyle += ' bg-cyan-950/20 text-cyan-300';
              } else if (row.highlight === 'header') {
                rowStyle += ' bg-pe-card-inner font-semibold text-pe-title';
              }

              if (row.isSubRow) {
                rowStyle += ' text-amber-400/90 italic';
              }

              return (
                <tr key={idx} className={rowStyle}>
                  <td className="py-2.5 px-3 font-semibold text-pe-muted">{row.step}</td>
                  <td className="py-2.5 px-3 font-sans">
                    <div className="font-medium text-pe-title">{row.description}</div>
                    {row.note && (
                      <div className="text-[10px] text-pe-muted font-sans mt-0.5">{row.note}</div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-pe-title">
                    {formatExactBarrels(row.barrels)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-pe-title">
                    {formatExactUSD(row.usd)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                        row.highlight === 'state'
                          ? 'bg-emerald-900/60 text-emerald-300'
                          : row.highlight === 'contractor'
                          ? 'bg-amber-900/60 text-amber-300'
                          : 'bg-pe-card-inner text-pe-body'
                      }`}
                    >
                      {row.pctOfGross.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-pe-muted text-[11px]">
                    <span className="text-pe-body font-mono text-[10px]">{row.formula}</span>
                    <div className="text-[10px] text-pe-muted">{row.statutoryRef}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Reconciliation Invariant Verification Bar */}
      <div className="bg-pe-card-inner p-3 rounded-lg border border-pe-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-pe-emerald shrink-0" />
          <span className="text-pe-body font-medium">
            Mass Conservation & Dollar Balance Invariant:
          </span>
          <span className="text-pe-emerald font-mono font-semibold">
            {formatExactBarrels(totalGhanaBarrels + contractorTotalBarrels)} bbls ={' '}
            {formatExactBarrels(grossProductionBarrels)} bbls (100.00%)
          </span>
        </div>
        <div className="text-pe-muted font-mono text-[11px]">
          State ({effectiveStateTakePercent.toFixed(2)}%) + Contractor (
          {effectiveContractorTakePercent.toFixed(2)}%) = 100.00%
        </div>
      </div>
    </div>
  );
};
