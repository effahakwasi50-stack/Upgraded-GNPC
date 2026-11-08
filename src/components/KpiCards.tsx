import React from 'react';
import { FiscalReconciliationOutput } from '../utils/fiscalEngine';
import { formatCurrency, formatBarrels } from '../utils/exportUtils';
import {
  TrendingUp,
  Landmark,
  Layers,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Fuel,
  Activity,
  Flame,
  ShieldCheck,
} from 'lucide-react';

interface KpiCardsProps {
  reconciliation: FiscalReconciliationOutput;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ reconciliation }) => {
  const {
    totalGrossRevenueUSD,
    grossProductionBarrels,
    totalGhanaRevenueUSD,
    effectiveStateTakePercent,
    totalGhanaBarrels,
    stateRoyaltyBarrels,
    gnpcProfitBarrels,
    contractorGrossRevenueUSD,
    contractorNetTakeUSD,
    contractorTotalBarrels,
    costBarrelsClaimed,
    contractorProfitBarrels,
    isCostCapped,
    unrecoveredCostUSD,
    standardParcelsGhana,
    standardParcelsContractor,
  } = reconciliation;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Gross Concession Value (Crude Gold Header) */}
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-xl overflow-hidden shadow-lg shadow-amber-950/20 flex flex-col justify-between transition-all">
        {/* Top High-Vis Industrial Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-slate-950 px-3.5 py-2 flex items-center justify-between font-bold">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider">
            <Fuel className="w-4 h-4 text-slate-950" />
            <span>Gross Concession Value</span>
          </div>
          <span className="text-[10px] bg-slate-950 text-amber-400 px-2 py-0.5 rounded font-mono font-extrabold">
            Q_gross × P
          </span>
        </div>

        {/* Card Body */}
        <div className="p-4 bg-gradient-to-b from-amber-950/25 to-slate-900/90 flex-1 flex flex-col justify-between">
          <div>
            <div className="text-3xl font-black font-mono tracking-tight text-white mt-1">
              {formatCurrency(totalGrossRevenueUSD)}
            </div>

            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="font-bold text-amber-400 font-mono bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/50">
                {formatBarrels(grossProductionBarrels)}
              </span>
              <span className="text-slate-400">·</span>
              <span className="font-mono text-slate-200 font-semibold">${reconciliation.achievedPriceUSD.toFixed(2)}/bbl</span>
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-amber-500/30 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Total Monthly Barrels</span>
            <span className="text-amber-400 font-mono font-bold">100.00% Baseline</span>
          </div>
        </div>
      </div>

      {/* 2. Total Ghana State Take (Sovereign Emerald Header) */}
      <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-xl overflow-hidden shadow-lg shadow-emerald-950/20 flex flex-col justify-between transition-all">
        {/* Top High-Vis Industrial Banner */}
        <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500 text-slate-950 px-3.5 py-2 flex items-center justify-between font-bold">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider">
            <Landmark className="w-4 h-4 text-slate-950" />
            <span>Total Ghana State Take</span>
          </div>
          <span className="text-[10px] bg-slate-950 text-emerald-400 px-2 py-0.5 rounded font-mono font-extrabold">
            GoG + GNPC
          </span>
        </div>

        {/* Card Body */}
        <div className="p-4 bg-gradient-to-b from-emerald-950/25 to-slate-900/90 flex-1 flex flex-col justify-between">
          <div>
            <div className="text-3xl font-black font-mono tracking-tight text-emerald-300 mt-1">
              {formatCurrency(totalGhanaRevenueUSD)}
            </div>

            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="font-black text-slate-950 bg-emerald-400 px-2.5 py-0.5 rounded font-mono shadow-xs text-xs">
                {effectiveStateTakePercent.toFixed(2)}%
              </span>
              <span className="text-slate-200 font-semibold">Effective State Take</span>
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-emerald-500/30 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Royalty + Carried Profit</span>
            <span className="text-emerald-400 font-mono font-bold">
              {standardParcelsGhana.toFixed(2)} Cargoes (950k)
            </span>
          </div>
        </div>
      </div>

      {/* 3. State Physical Barrels Entitlement (Subsea Cyan Header) */}
      <div className="bg-slate-900 border-2 border-cyan-500/80 rounded-xl overflow-hidden shadow-lg shadow-cyan-950/20 flex flex-col justify-between transition-all">
        {/* Top High-Vis Industrial Banner */}
        <div className="bg-gradient-to-r from-cyan-500 via-cyan-600 to-blue-500 text-slate-950 px-3.5 py-2 flex items-center justify-between font-bold">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider">
            <Activity className="w-4 h-4 text-slate-950" />
            <span>State Physical Barrels</span>
          </div>
          <span className="text-[10px] bg-slate-950 text-cyan-400 px-2 py-0.5 rounded font-mono font-extrabold">
            Equity Liftings
          </span>
        </div>

        {/* Card Body */}
        <div className="p-4 bg-gradient-to-b from-cyan-950/25 to-slate-900/90 flex-1 flex flex-col justify-between">
          <div>
            <div className="text-3xl font-black font-mono tracking-tight text-cyan-300 mt-1">
              {formatBarrels(totalGhanaBarrels)}
            </div>

            <div className="mt-2 text-xs space-y-1 font-mono">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Royalty Oil:</span>
                <span className="font-bold text-cyan-400">{formatBarrels(stateRoyaltyBarrels)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">GNPC Profit Oil:</span>
                <span className="font-bold text-emerald-400">{formatBarrels(gnpcProfitBarrels)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-cyan-500/30 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Physical Volume Share</span>
            <span className="text-cyan-400 font-mono font-bold">
              {((totalGhanaBarrels / (grossProductionBarrels || 1)) * 100).toFixed(1)}% of Gross
            </span>
          </div>
        </div>
      </div>

      {/* 4. Contractor Take & Costs (Offshore Rig Orange Header) */}
      <div className="bg-slate-900 border-2 border-orange-500/80 rounded-xl overflow-hidden shadow-lg shadow-orange-950/20 flex flex-col justify-between transition-all">
        {/* Top High-Vis Industrial Banner */}
        <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-slate-950 px-3.5 py-2 flex items-center justify-between font-bold">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-slate-950" />
            <span>Contractor Take & Costs</span>
          </div>
          <span className="text-[10px] bg-slate-950 text-orange-400 px-2 py-0.5 rounded font-mono font-extrabold">
            Operator Group
          </span>
        </div>

        {/* Card Body */}
        <div className="p-4 bg-gradient-to-b from-orange-950/25 to-slate-900/90 flex-1 flex flex-col justify-between">
          <div>
            <div className="text-3xl font-black font-mono tracking-tight text-orange-300 mt-1">
              {formatCurrency(contractorGrossRevenueUSD)}
            </div>

            <div className="mt-2 text-xs space-y-1 font-mono">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Cost Oil Claimed:</span>
                <span className="font-bold text-cyan-400">{formatBarrels(costBarrelsClaimed)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Net Profit Share:</span>
                <span className="font-bold text-orange-400">{formatBarrels(contractorProfitBarrels)}</span>
              </div>
            </div>
          </div>

          {/* Cost Recovery Status */}
          <div className="mt-4 pt-2.5 border-t border-orange-500/30 flex items-center justify-between text-[11px]">
            {isCostCapped ? (
              <div className="flex items-center gap-1.5 text-amber-300" title="Monthly OPEX/CAPEX exceeded 70% of Net Production. Remainder carried forward.">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span className="font-bold truncate">Cap Hit: Carry-fwd {formatCurrency(unrecoveredCostUSD)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="font-bold">Cost Oil 100% Reimbursed</span>
              </div>
            )}
            <span className="text-slate-300 font-mono text-[10px] font-bold">
              {standardParcelsContractor.toFixed(2)} Cargoes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
