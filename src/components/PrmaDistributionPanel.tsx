import React from 'react';
import { FiscalReconciliationOutput } from '../utils/fiscalEngine';
import { formatCurrency, formatExactUSD } from '../utils/exportUtils';
import { Landmark, ArrowRight, ShieldCheck, Wallet, PieChart, Sparkles } from 'lucide-react';

interface PrmaDistributionPanelProps {
  reconciliation: FiscalReconciliationOutput;
}

export const PrmaDistributionPanel: React.FC<PrmaDistributionPanelProps> = ({
  reconciliation,
}) => {
  const { totalGhanaRevenueUSD, prmaDistribution } = reconciliation;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm text-slate-100 space-y-0">
      {/* Header */}
      <div className="p-5 pb-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white tracking-wide uppercase">
              Petroleum Revenue Management Act (PRMA Act 815) Distribution Preview
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Sovereign statutory allocation of Ghana State Take ({formatCurrency(totalGhanaRevenueUSD)})
          </p>
        </div>
        <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded self-start sm:self-auto">
          Act 815 & Act 893 Schedule
        </span>
      </div>

      {/* Distribution Flow Cards */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. GNPC Level A (Amber Gold) */}
        <div className="bg-slate-950 rounded-xl border border-amber-500/50 overflow-hidden flex flex-col justify-between shadow-md">
          <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 px-3 py-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" />
              <span>1. GNPC Level A</span>
            </span>
            <span className="bg-slate-950 text-amber-400 px-1.5 py-0.2 rounded text-[10px] font-mono">
              30%
            </span>
          </div>
          <div className="p-3.5 flex-1 flex flex-col justify-between">
            <div>
              <div className="text-2xl font-black font-mono text-amber-400">
                {formatCurrency(prmaDistribution.gnpcLevelAAllocationUSD)}
              </div>
              <div className="text-[11px] text-slate-300 font-medium mt-1">
                Direct NOC Operational Funding
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-800/80 leading-relaxed">
              Retained by GNPC to fund joint venture exploration cash calls and field development CAPEX.
            </p>
          </div>
        </div>

        {/* 2. ABFA (Sovereign Emerald) */}
        <div className="bg-slate-950 rounded-xl border border-emerald-500/50 overflow-hidden flex flex-col justify-between shadow-md">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 px-3 py-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5" />
              <span>2. Annual Budget (ABFA)</span>
            </span>
            <span className="bg-slate-950 text-emerald-400 px-1.5 py-0.2 rounded text-[10px] font-mono">
              49%
            </span>
          </div>
          <div className="p-3.5 flex-1 flex flex-col justify-between">
            <div>
              <div className="text-2xl font-black font-mono text-emerald-400">
                {formatCurrency(prmaDistribution.annualBudgetFundingAmountUSD)}
              </div>
              <div className="text-[11px] text-slate-300 font-medium mt-1">
                Consolidated National Treasury
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-800/80 leading-relaxed">
              Transferred to National Treasury to finance roads, healthcare, agriculture, and public education.
            </p>
          </div>
        </div>

        {/* 3. Ghana Stabilization Fund (Subsea Cyan) */}
        <div className="bg-slate-950 rounded-xl border border-cyan-500/50 overflow-hidden flex flex-col justify-between shadow-md">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 px-3 py-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>3. Stabilization Fund</span>
            </span>
            <span className="bg-slate-950 text-cyan-400 px-1.5 py-0.2 rounded text-[10px] font-mono">
              14.7%
            </span>
          </div>
          <div className="p-3.5 flex-1 flex flex-col justify-between">
            <div>
              <div className="text-2xl font-black font-mono text-cyan-300">
                {formatCurrency(prmaDistribution.ghanaStabilizationFundUSD)}
              </div>
              <div className="text-[11px] text-slate-300 font-medium mt-1">
                Commodity Price Shock Buffer
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-800/80 leading-relaxed">
              Macroeconomic buffer insulating the national budget against severe crude oil price collapses.
            </p>
          </div>
        </div>

        {/* 4. Ghana Heritage Fund (Royal Purple) */}
        <div className="bg-slate-950 rounded-xl border border-purple-500/50 overflow-hidden flex flex-col justify-between shadow-md">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-slate-950 px-3 py-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5" />
              <span>4. Heritage Fund</span>
            </span>
            <span className="bg-slate-950 text-purple-300 px-1.5 py-0.2 rounded text-[10px] font-mono">
              6.3%
            </span>
          </div>
          <div className="p-3.5 flex-1 flex flex-col justify-between">
            <div>
              <div className="text-2xl font-black font-mono text-purple-300">
                {formatCurrency(prmaDistribution.ghanaHeritageFundUSD)}
              </div>
              <div className="text-[11px] text-slate-300 font-medium mt-1">
                Intergenerational Endowment
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-800/80 leading-relaxed">
              Sovereign wealth endowment invested globally for future generations when hydrocarbon reserves deplete.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
