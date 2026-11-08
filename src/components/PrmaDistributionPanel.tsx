import React from 'react';
import { FiscalReconciliationOutput } from '../utils/fiscalEngine';
import { formatCurrency, formatExactUSD } from '../utils/exportUtils';
import { Landmark, ArrowRight, ShieldCheck, Wallet, PieChart } from 'lucide-react';

interface PrmaDistributionPanelProps {
  reconciliation: FiscalReconciliationOutput;
}

export const PrmaDistributionPanel: React.FC<PrmaDistributionPanelProps> = ({
  reconciliation,
}) => {
  const { totalGhanaRevenueUSD, prmaDistribution } = reconciliation;

  return (
    <div className="bg-pe-card border border-pe-border rounded-xl p-5 shadow-sm text-pe-body space-y-4 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-pe-border">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-pe-emerald" />
            <h3 className="font-semibold text-sm text-pe-title tracking-wide uppercase">
              Petroleum Revenue Management Act (PRMA Act 815) Distribution Preview
            </h3>
          </div>
          <p className="text-xs text-pe-muted mt-0.5">
            Sovereign statutory allocation of Ghana State Take ({formatCurrency(totalGhanaRevenueUSD)})
          </p>
        </div>
        <span className="text-[11px] font-mono text-pe-emerald bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded self-start sm:self-auto">
          Act 815 & Act 893 Schedule
        </span>
      </div>

      {/* Distribution Flow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. GNPC Level A */}
        <div className="bg-pe-card-inner p-3.5 rounded-lg border border-pe-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-pe-muted mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-pe-crude">
                1. GNPC Equity Financing (Level A)
              </span>
              <Wallet className="w-3.5 h-3.5 text-pe-crude" />
            </div>
            <div className="text-lg font-bold font-mono text-pe-crude">
              {formatCurrency(prmaDistribution.gnpcLevelAAllocationUSD)}
            </div>
            <div className="text-[11px] text-pe-muted mt-1">
              30% of Gross State Receipts
            </div>
          </div>
          <p className="text-[10px] text-pe-muted mt-2 pt-2 border-t border-pe-border">
            Retained by GNPC to fund joint venture cash calls, development CAPEX, and exploration.
          </p>
        </div>

        {/* 2. ABFA */}
        <div className="bg-pe-card-inner p-3.5 rounded-lg border border-pe-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-pe-muted mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-pe-emerald">
                2. Annual Budget (ABFA)
              </span>
              <PieChart className="w-3.5 h-3.5 text-pe-emerald" />
            </div>
            <div className="text-lg font-bold font-mono text-pe-emerald">
              {formatCurrency(prmaDistribution.annualBudgetFundingAmountUSD)}
            </div>
            <div className="text-[11px] text-pe-muted mt-1">
              70% of Petroleum Holding Fund
            </div>
          </div>
          <p className="text-[10px] text-pe-muted mt-2 pt-2 border-t border-pe-border">
            Transferred to Consolidated Fund for national priority infrastructure (roads, agriculture, education).
          </p>
        </div>

        {/* 3. Ghana Stabilization Fund */}
        <div className="bg-pe-card-inner p-3.5 rounded-lg border border-pe-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-pe-muted mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-pe-cyan">
                3. Stabilization Fund (GSF)
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-pe-cyan" />
            </div>
            <div className="text-lg font-bold font-mono text-pe-cyan">
              {formatCurrency(prmaDistribution.ghanaStabilizationFundUSD)}
            </div>
            <div className="text-[11px] text-pe-muted mt-1">
              70% of Ghana Petroleum Funds
            </div>
          </div>
          <p className="text-[10px] text-pe-muted mt-2 pt-2 border-t border-pe-border">
            Buffer against commodity price collapse and public expenditure shortfalls.
          </p>
        </div>

        {/* 4. Ghana Heritage Fund */}
        <div className="bg-pe-card-inner p-3.5 rounded-lg border border-pe-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-pe-muted mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-purple-400">
                4. Heritage Fund (GHF)
              </span>
              <Landmark className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-lg font-bold font-mono text-purple-300">
              {formatCurrency(prmaDistribution.ghanaHeritageFundUSD)}
            </div>
            <div className="text-[11px] text-pe-muted mt-1">
              30% of Ghana Petroleum Funds
            </div>
          </div>
          <p className="text-[10px] text-pe-muted mt-2 pt-2 border-t border-pe-border">
            Locked sovereign endowment invested in offshore sovereign bonds for future generations.
          </p>
        </div>
      </div>
    </div>
  );
};
