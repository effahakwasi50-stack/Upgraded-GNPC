import React from 'react';
import { CONCESSION_PRESETS, FiscalInputs } from '../utils/fiscalEngine';
import {
  RotateCcw,
  Sliders,
  DollarSign,
  Fuel,
  ShieldCheck,
  Scale,
  Percent,
  Layers,
  Droplet,
  Compass,
} from 'lucide-react';

interface ParameterPanelProps {
  inputs: FiscalInputs;
  onChange: (inputs: FiscalInputs) => void;
  onResetConcession: () => void;
}

// Field Assay & Petroleum Engineering details
const FIELD_ASSAYS: Record<string, { api: string; sulphur: string; type: string; waterDepth: string }> = {
  jubilee: {
    api: '37.6° API',
    sulphur: '0.25% S',
    type: 'Light Sweet Crude (Jubilee Blend)',
    waterDepth: '1,100m – 1,400m Ultra-Deepwater',
  },
  ten: {
    api: '36.8° API',
    sulphur: '0.28% S',
    type: 'Light Sweet Blend (Enyenra / Tweneboa)',
    waterDepth: '1,000m – 2,000m Deepwater',
  },
  sankofa: {
    api: '38.2° API',
    sulphur: '0.20% S',
    type: 'Offshore Cape Three Points Sweet Crude',
    waterDepth: '600m – 1,000m Offshore',
  },
  custom: {
    api: '35.0° API',
    sulphur: '0.35% S',
    type: 'Exploration Concession Blend',
    waterDepth: 'Variable Offshore Basin',
  },
};

export const ParameterPanel: React.FC<ParameterPanelProps> = ({
  inputs,
  onChange,
  onResetConcession,
}) => {
  const currentPreset = CONCESSION_PRESETS[inputs.concessionId] || CONCESSION_PRESETS.custom;
  const currentAssay = FIELD_ASSAYS[inputs.concessionId] || FIELD_ASSAYS.custom;

  const handleSelectPreset = (presetId: string) => {
    const preset = CONCESSION_PRESETS[presetId];
    if (!preset) return;

    onChange({
      concessionId: preset.id,
      concessionName: preset.name,
      grossProductionBarrels: preset.defaultGrossProduction,
      achievedPriceUSD: preset.defaultAchievedPrice,
      monthlyCostsUSD: preset.defaultMonthlyCosts,
      statutoryRoyaltyRate: preset.statutoryRoyaltyRate,
      costRecoveryCap: preset.costRecoveryCap,
      gnpcCarriedInterestRate: preset.defaultCarriedInterest,
      gnpcPayingInterestRate: preset.defaultPayingInterest,
    });
  };

  const handlePriceBenchmark = (price: number) => {
    onChange({
      ...inputs,
      achievedPriceUSD: price,
    });
  };

  const isCustom = inputs.concessionId === 'custom';

  return (
    <div className="bg-pe-card border border-pe-border rounded-xl p-5 shadow-sm text-pe-body space-y-6 transition-colors duration-200">
      {/* Top Header & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-pe-border">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-pe-crude" />
          <h2 className="font-semibold text-sm tracking-wide uppercase text-pe-title">
            Fiscal & Lifting Parameters
          </h2>
        </div>
        <button
          type="button"
          onClick={onResetConcession}
          className="flex items-center gap-1.5 text-xs text-pe-muted hover:text-pe-crude transition-colors"
          title="Restore baseline parameters for this offshore concession"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Field Defaults</span>
        </button>
      </div>

      {/* Field Presets Selection */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-pe-title flex items-center justify-between">
          <span>Offshore Concession / Petroleum Agreement</span>
          <span className="text-[11px] text-pe-muted font-mono">Act 919 Schedule</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.values(CONCESSION_PRESETS).map((p) => {
            const isSelected = inputs.concessionId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p.id)}
                className={`flex flex-col text-left p-2.5 rounded-lg border text-xs transition-all ${
                  isSelected
                    ? 'bg-pe-card-inner border-pe-crude text-pe-title shadow-sm ring-1 ring-amber-500/40'
                    : 'bg-pe-card-inner/60 border-pe-border text-pe-muted hover:border-pe-light hover:text-pe-title'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold truncate text-pe-title">{p.id.toUpperCase()}</span>
                  <Droplet className={`w-3 h-3 ${isSelected ? 'text-pe-crude' : 'text-pe-muted'}`} />
                </div>
                <span className="text-[10px] text-pe-crude font-medium truncate mt-0.5">
                  {(p.statutoryRoyaltyRate * 100).toFixed(1)}% Royalty
                </span>
                <span className="text-[9px] text-pe-muted font-mono mt-1">
                  {p.fpsoName.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Technical Assay & Operator Card */}
        <div className="text-[11px] text-pe-muted bg-pe-card-inner p-3 rounded-lg border border-pe-border space-y-1.5 leading-relaxed">
          <div className="flex items-center justify-between">
            <span className="text-pe-title font-semibold">{currentPreset.name}</span>
            <span className="text-[10px] font-mono text-pe-crude bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
              {currentAssay.api}
            </span>
          </div>
          <div className="text-[10px] text-pe-muted flex items-center gap-2 flex-wrap">
            <span>{currentAssay.type}</span>
            <span>·</span>
            <span>{currentAssay.sulphur}</span>
            <span>·</span>
            <span>{currentAssay.waterDepth}</span>
          </div>
          <div className="pt-1 border-t border-pe-border/60 text-[10px] flex items-center justify-between">
            <span className="text-pe-muted">Operator: {currentPreset.operator}</span>
            <span className="text-pe-cyan font-mono font-medium">{currentPreset.fpsoName}</span>
          </div>
        </div>
      </div>

      {/* 1. Monthly Gross Production (Barrels) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="gross-production-num" className="text-xs font-medium text-pe-title flex items-center gap-1.5">
            <Fuel className="w-3.5 h-3.5 text-pe-crude" />
            <span>Monthly Gross Production (Q_gross)</span>
          </label>
          <div className="flex items-center gap-1">
            <input
              id="gross-production-num"
              type="number"
              min="0"
              max="10000000"
              step="10000"
              value={inputs.grossProductionBarrels}
              onChange={(e) =>
                onChange({
                  ...inputs,
                  grossProductionBarrels: Math.max(0, Number(e.target.value) || 0),
                })
              }
              className="w-28 text-right bg-pe-card-inner border border-pe-border rounded px-2 py-1 text-xs font-mono text-pe-crude focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <span className="text-[11px] text-pe-muted">bbls</span>
          </div>
        </div>
        <input
          type="range"
          min="100000"
          max="5000000"
          step="25000"
          value={inputs.grossProductionBarrels}
          onChange={(e) =>
            onChange({
              ...inputs,
              grossProductionBarrels: Number(e.target.value),
            })
          }
          className="w-full pe-slider-crude cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-pe-muted font-mono">
          <span>100k bbls</span>
          <span>1.5M</span>
          <span>3.0M</span>
          <span>5.0M bbls</span>
        </div>
      </div>

      {/* 2. Achieved Crude Price ($/bbl) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="achieved-price-num" className="text-xs font-medium text-pe-title flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-pe-crude" />
            <span>Dated Brent Achieved Price ($/bbl)</span>
          </label>
          <div className="flex items-center gap-1">
            <input
              id="achieved-price-num"
              type="number"
              min="10"
              max="200"
              step="0.5"
              value={inputs.achievedPriceUSD}
              onChange={(e) =>
                onChange({
                  ...inputs,
                  achievedPriceUSD: Math.max(0, Number(e.target.value) || 0),
                })
              }
              className="w-24 text-right bg-pe-card-inner border border-pe-border rounded px-2 py-1 text-xs font-mono text-pe-crude focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <span className="text-[11px] text-pe-muted">$/bbl</span>
          </div>
        </div>
        <input
          type="range"
          min="30"
          max="140"
          step="0.5"
          value={inputs.achievedPriceUSD}
          onChange={(e) =>
            onChange({
              ...inputs,
              achievedPriceUSD: Number(e.target.value),
            })
          }
          className="w-full pe-slider-crude cursor-pointer"
        />
        {/* Quick Crude Benchmarks */}
        <div className="flex items-center gap-1.5 pt-1">
          <span className="text-[10px] text-pe-muted mr-1">Benchmarks:</span>
          {[60, 70, 78.5, 85, 100].map((pr) => (
            <button
              key={pr}
              type="button"
              onClick={() => handlePriceBenchmark(pr)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                Math.abs(inputs.achievedPriceUSD - pr) < 0.1
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                  : 'bg-pe-card-inner border-pe-border text-pe-muted hover:text-pe-title'
              }`}
            >
              ${pr}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Monthly Operating & Capital Costs ($ USD) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="monthly-costs-num" className="text-xs font-medium text-pe-title flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-pe-cyan" />
            <span>Monthly OPEX + Amortized CAPEX</span>
          </label>
          <div className="flex items-center gap-1">
            <input
              id="monthly-costs-num"
              type="number"
              min="0"
              max="200000000"
              step="500000"
              value={inputs.monthlyCostsUSD}
              onChange={(e) =>
                onChange({
                  ...inputs,
                  monthlyCostsUSD: Math.max(0, Number(e.target.value) || 0),
                })
              }
              className="w-32 text-right bg-pe-card-inner border border-pe-border rounded px-2 py-1 text-xs font-mono text-pe-cyan focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <span className="text-[11px] text-pe-muted">USD</span>
          </div>
        </div>
        <input
          type="range"
          min="5000000"
          max="120000000"
          step="1000000"
          value={inputs.monthlyCostsUSD}
          onChange={(e) =>
            onChange({
              ...inputs,
              monthlyCostsUSD: Number(e.target.value),
            })
          }
          className="w-full pe-slider-cyan cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-pe-muted font-mono">
          <span>$5M</span>
          <span>$40M</span>
          <span>$80M</span>
          <span>$120M</span>
        </div>
      </div>

      {/* 4. Statutory Fiscal Rules (Royalty & Cost Recovery Cap) */}
      <div className="pt-2 border-t border-pe-border space-y-4">
        <div className="flex items-center justify-between text-xs font-semibold text-pe-title">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-pe-emerald" />
            <span>Statutory Fiscal Clauses (Act 919)</span>
          </span>
          <span className="text-[10px] font-mono text-pe-muted">
            {isCustom ? 'Editable' : 'Concession Locked'}
          </span>
        </div>

        {/* Royalty Rate */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-pe-muted">Gross State Royalty Rate</span>
            <span className="font-mono font-bold text-pe-crude">
              {(inputs.statutoryRoyaltyRate * 100).toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min="0.0"
            max="0.20"
            step="0.005"
            disabled={!isCustom}
            value={inputs.statutoryRoyaltyRate}
            onChange={(e) =>
              onChange({
                ...inputs,
                statutoryRoyaltyRate: Number(e.target.value),
              })
            }
            className={`w-full pe-slider-crude ${!isCustom ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          />
          <div className="text-[10px] text-pe-muted flex justify-between">
            <span>Deducted off top before OPEX</span>
            <span>Jubilee/TEN: 5.0% | Sankofa: 7.5%</span>
          </div>
        </div>

        {/* Cost Recovery Cap */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-pe-muted">Cost Recovery Ceiling Cap</span>
            <span className="font-mono font-bold text-pe-cyan">
              {(inputs.costRecoveryCap * 100).toFixed(0)}% of Q_net
            </span>
          </div>
          <input
            type="range"
            min="0.40"
            max="1.00"
            step="0.05"
            disabled={!isCustom}
            value={inputs.costRecoveryCap}
            onChange={(e) =>
              onChange({
                ...inputs,
                costRecoveryCap: Number(e.target.value),
              })
            }
            className={`w-full pe-slider-cyan ${!isCustom ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          />
          <div className="text-[10px] text-pe-muted">
            <span>Contractual cap ensures minimum 30% available Profit Oil pool</span>
          </div>
        </div>

        {/* GNPC Equity Participation */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-pe-card-inner p-2.5 rounded-lg border border-pe-border space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-pe-muted">GNPC Carried %</span>
              <span className="font-mono font-bold text-pe-emerald">
                {(inputs.gnpcCarriedInterestRate * 100).toFixed(2)}%
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.25"
              step="0.005"
              value={inputs.gnpcCarriedInterestRate}
              onChange={(e) =>
                onChange({
                  ...inputs,
                  gnpcCarriedInterestRate: Number(e.target.value),
                })
              }
              className="w-full pe-slider-emerald cursor-pointer"
            />
            <div className="text-[9px] text-pe-muted">Act 919 Sec. 10 statutory floor</div>
          </div>

          <div className="bg-pe-card-inner p-2.5 rounded-lg border border-pe-border space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-pe-muted">Paying Interest %</span>
              <span className="font-mono font-bold text-pe-emerald">
                {(inputs.gnpcPayingInterestRate * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.10"
              step="0.01"
              value={inputs.gnpcPayingInterestRate}
              onChange={(e) =>
                onChange({
                  ...inputs,
                  gnpcPayingInterestRate: Number(e.target.value),
                })
              }
              className="w-full pe-slider-emerald cursor-pointer"
            />
            <div className="text-[9px] text-pe-muted">Sankofa (5%), Jubilee (0%)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
