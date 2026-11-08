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
      {/* 1. Total Gross Revenue (Crude Oil Gold Theme) */}
      <div className="bg-pe-card border border-pe-border border-t-2 border-t-amber-500 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between transition-colors duration-200">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div>
          <div className="flex items-center justify-between text-xs text-pe-muted mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-pe-crude flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5" />
              <span>Gross Concession Value</span>
            </span>
            <span className="font-mono text-[10px] text-pe-muted bg-pe-card-inner px-1.5 py-0.5 rounded border border-pe-border">
              Q_gross × P
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-pe-title mt-0.5">
            {formatCurrency(totalGrossRevenueUSD)}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-pe-body">
            <span className="font-semibold text-pe-crude font-mono">{formatBarrels(grossProductionBarrels)}</span>
            <span className="text-pe-muted">·</span>
            <span className="font-mono text-pe-muted">${reconciliation.achievedPriceUSD.toFixed(2)}/bbl</span>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-pe-border flex items-center justify-between text-[11px] text-pe-muted">
          <span>Metered Fiscal Outturn</span>
          <span className="text-pe-crude font-mono font-medium">100% Gross Volume</span>
        </div>
      </div>

      {/* 2. Total State Take (Sovereign Energy Emerald Theme) */}
      <div className="bg-pe-card border border-pe-border border-t-2 border-t-emerald-500 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between transition-colors duration-200">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div>
          <div className="flex items-center justify-between text-xs text-pe-muted mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-pe-emerald flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5" />
              <span>Total Ghana State Take</span>
            </span>
            <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-800/60">
              GoG + GNPC
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-pe-emerald mt-0.5">
            {formatCurrency(totalGhanaRevenueUSD)}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-pe-body">
            <span className="font-bold text-pe-emerald font-mono text-sm">
              {effectiveStateTakePercent.toFixed(2)}%
            </span>
            <span className="text-pe-muted">Effective State Take</span>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-pe-border flex items-center justify-between text-[11px] text-pe-muted">
          <span>Royalty + Carried Profit</span>
          <span className="text-pe-emerald font-mono font-semibold">
            {standardParcelsGhana.toFixed(2)} Cargoes (950k)
          </span>
        </div>
      </div>

      {/* 3. GNPC Physical Entitlement (Subsea Flowline Cyan Theme) */}
      <div className="bg-pe-card border border-pe-border border-t-2 border-t-cyan-500 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between transition-colors duration-200">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div>
          <div className="flex items-center justify-between text-xs text-pe-muted mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-pe-cyan flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>State Physical Entitlement</span>
            </span>
            <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-800/60">
              Physical Oil
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-pe-cyan mt-0.5">
            {formatBarrels(totalGhanaBarrels)}
          </div>
          <div className="mt-1.5 text-xs text-pe-muted space-y-0.5 font-mono">
            <div className="flex justify-between">
              <span>Royalty Oil:</span>
              <span className="text-pe-body">{formatBarrels(stateRoyaltyBarrels)}</span>
            </div>
            <div className="flex justify-between">
              <span>GNPC Profit Oil:</span>
              <span className="text-pe-body">{formatBarrels(gnpcProfitBarrels)}</span>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-pe-border flex items-center justify-between text-[11px] text-pe-muted">
          <span>Physical Equity Volume</span>
          <span className="text-pe-cyan font-mono font-semibold">
            {((totalGhanaBarrels / (grossProductionBarrels || 1)) * 100).toFixed(1)}% of Gross
          </span>
        </div>
      </div>

      {/* 4. Contractor Net Take & Costs (Offshore Rig Orange Theme) */}
      <div className="bg-pe-card border border-pe-border border-t-2 border-t-orange-500 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between transition-colors duration-200">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
        <div>
          <div className="flex items-center justify-between text-xs text-pe-muted mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-pe-orange flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Contractor Take & Costs</span>
            </span>
            <span className="font-mono text-[10px] text-orange-400 bg-orange-950/50 px-1.5 py-0.5 rounded border border-orange-800/60">
              Operator Group
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-pe-orange mt-0.5">
            {formatCurrency(contractorGrossRevenueUSD)}
          </div>
          <div className="mt-1.5 text-xs text-pe-muted space-y-0.5 font-mono">
            <div className="flex justify-between">
              <span>Cost Oil Claimed:</span>
              <span className="text-pe-body">{formatBarrels(costBarrelsClaimed)}</span>
            </div>
            <div className="flex justify-between">
              <span>Net Profit Share:</span>
              <span className="text-pe-body">{formatBarrels(contractorProfitBarrels)}</span>
            </div>
          </div>
        </div>

        {/* Cost Recovery Alert / Indicator */}
        <div className="mt-3 pt-2.5 border-t border-pe-border flex items-center justify-between text-[11px]">
          {isCostCapped ? (
            <div className="flex items-center gap-1.5 text-amber-400" title="Monthly OPEX/CAPEX claimed exceeded 70% of Net Production. Remainder carried forward.">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="font-semibold truncate">Cap Hit: Carry-fwd {formatCurrency(unrecoveredCostUSD)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Cost Oil 100% Reimbursed</span>
            </div>
          )}
          <span className="text-pe-muted font-mono text-[10px]">
            {standardParcelsContractor.toFixed(2)}c
          </span>
        </div>
      </div>
    </div>
  );
};
