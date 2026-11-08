import React from 'react';
import {
  calculateFiscalReconciliation,
  FiscalInputs,
  FiscalReconciliationOutput,
} from '../utils/fiscalEngine';
import {
  formatCurrency,
  formatExactBarrels,
  formatBarrels,
} from '../utils/exportUtils';
import { X, Sparkles, Check, ArrowRight } from 'lucide-react';

interface ScenarioComparatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInputs: FiscalInputs;
  onApplyScenario: (inputs: FiscalInputs) => void;
}

export const ScenarioComparatorModal: React.FC<ScenarioComparatorModalProps> = ({
  isOpen,
  onClose,
  currentInputs,
  onApplyScenario,
}) => {
  if (!isOpen) return null;

  // Build scenarios:
  // 1. Current
  const currentOutput = calculateFiscalReconciliation(currentInputs);

  // 2. Bull Market ($105/bbl)
  const bullInputs: FiscalInputs = {
    ...currentInputs,
    achievedPriceUSD: 105,
  };
  const bullOutput = calculateFiscalReconciliation(bullInputs);

  // 3. Bear Market ($55/bbl)
  const bearInputs: FiscalInputs = {
    ...currentInputs,
    achievedPriceUSD: 55,
  };
  const bearOutput = calculateFiscalReconciliation(bearInputs);

  // 4. High Cost Inflation (+40% costs)
  const highCostInputs: FiscalInputs = {
    ...currentInputs,
    monthlyCostsUSD: currentInputs.monthlyCostsUSD * 1.4,
  };
  const highCostOutput = calculateFiscalReconciliation(highCostInputs);

  const scenarios: {
    id: string;
    title: string;
    subtitle: string;
    inputs: FiscalInputs;
    output: FiscalReconciliationOutput;
    badgeColor: string;
  }[] = [
    {
      id: 'current',
      title: 'Current Baseline',
      subtitle: `$${currentInputs.achievedPriceUSD.toFixed(2)}/bbl · Active OPEX`,
      inputs: currentInputs,
      output: currentOutput,
      badgeColor: 'bg-emerald-950 text-emerald-400 border-emerald-800',
    },
    {
      id: 'bull',
      title: 'Bull Price Case',
      subtitle: '$105.00/bbl Brent Rally',
      inputs: bullInputs,
      output: bullOutput,
      badgeColor: 'bg-cyan-950 text-cyan-400 border-cyan-800',
    },
    {
      id: 'bear',
      title: 'Bear Price Case',
      subtitle: '$55.00/bbl Downside Stress',
      inputs: bearInputs,
      output: bearOutput,
      badgeColor: 'bg-amber-950 text-amber-400 border-amber-800',
    },
    {
      id: 'highcost',
      title: 'Cost Surge (+40%)',
      subtitle: `$${(highCostInputs.monthlyCostsUSD / 1_000_000).toFixed(1)}M Claimed Costs`,
      inputs: highCostInputs,
      output: highCostOutput,
      badgeColor: 'bg-orange-950 text-orange-400 border-orange-800',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-pe-card border border-pe-border rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-pe-body p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-pe-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pe-card-inner border border-pe-crude flex items-center justify-center text-pe-crude">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-pe-title">
                Multi-Scenario Fiscal Stress Test
              </h2>
              <p className="text-xs text-pe-muted">
                Compare lifting economics across benchmark commodity cycles and cost inflation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-pe-muted hover:text-pe-title hover:bg-pe-card-inner transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {scenarios.map((sc) => {
            const isCurrent = sc.id === 'current';
            return (
              <div
                key={sc.id}
                className={`bg-pe-card-inner rounded-xl p-4 border flex flex-col justify-between ${
                  isCurrent ? 'border-pe-crude ring-1 ring-amber-500/30' : 'border-pe-border'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${sc.badgeColor}`}>
                      {sc.title}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold text-pe-emerald">Active</span>
                    )}
                  </div>
                  <div className="text-xs text-pe-muted mt-1">{sc.subtitle}</div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="text-[10px] text-pe-muted uppercase tracking-wider font-semibold">
                        State Take (USD)
                      </div>
                      <div className="text-lg font-bold font-mono text-pe-emerald">
                        {formatCurrency(sc.output.totalGhanaRevenueUSD)}
                      </div>
                      <div className="text-[11px] text-pe-muted font-mono">
                        {sc.output.effectiveStateTakePercent.toFixed(1)}% Effective Take
                      </div>
                    </div>

                    <div className="pt-2 border-t border-pe-border">
                      <div className="text-[10px] text-pe-muted uppercase tracking-wider font-semibold">
                        State Physical Volume
                      </div>
                      <div className="text-sm font-semibold font-mono text-pe-cyan">
                        {formatBarrels(sc.output.totalGhanaBarrels)}
                      </div>
                      <div className="text-[10px] text-pe-muted">
                        {sc.output.standardParcelsGhana.toFixed(2)} Cargoes (950k)
                      </div>
                    </div>

                    <div className="pt-2 border-t border-pe-border">
                      <div className="text-[10px] text-pe-muted uppercase tracking-wider font-semibold">
                        Contractor Take
                      </div>
                      <div className="text-sm font-semibold font-mono text-pe-orange">
                        {formatCurrency(sc.output.contractorGrossRevenueUSD)}
                      </div>
                      <div className="text-[10px] text-pe-muted">
                        {sc.output.isCostCapped ? (
                          <span className="text-amber-400 font-semibold">Cost Cap Hit</span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">Costs Reimbursed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-pe-border">
                  {isCurrent ? (
                    <div className="flex items-center justify-center gap-1.5 py-1.5 text-xs text-pe-emerald font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Current Active Baseline</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onApplyScenario(sc.inputs);
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg bg-pe-card hover:bg-pe-card-inner border border-pe-border text-pe-title hover:border-pe-crude transition-colors"
                    >
                      <span>Load Scenario</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
