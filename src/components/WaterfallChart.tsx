import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { FiscalReconciliationOutput } from '../utils/fiscalEngine';
import { formatCurrency, formatBarrels, formatExactBarrels, formatExactUSD } from '../utils/exportUtils';
import { BarChart3, Layers, DollarSign, Fuel, Info } from 'lucide-react';

Chart.register(...registerables);

interface WaterfallChartProps {
  reconciliation: FiscalReconciliationOutput;
}

export const WaterfallChart: React.FC<WaterfallChartProps> = ({ reconciliation }) => {
  const [viewMode, setViewMode] = useState<'barrels' | 'usd'>('barrels');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  const {
    stateRoyaltyBarrels,
    stateRoyaltyUSD,
    costBarrelsClaimed,
    costUSDRecovered,
    gnpcProfitBarrels,
    gnpcProfitUSD,
    contractorProfitBarrels,
    contractorProfitUSD,
    grossProductionBarrels,
    totalGrossRevenueUSD,
    isCostCapped,
  } = reconciliation;

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const isBbl = viewMode === 'barrels';

    const labels = [
      '1. Gross Production',
      '2. State Royalty (Off-Top)',
      '3. Cost Recovery Oil',
      '4. GNPC Profit Oil',
      '5. Contractor Profit Oil',
    ];

    const dataValues = isBbl
      ? [
          grossProductionBarrels,
          stateRoyaltyBarrels,
          costBarrelsClaimed,
          gnpcProfitBarrels,
          contractorProfitBarrels,
        ]
      : [
          totalGrossRevenueUSD,
          stateRoyaltyUSD,
          costUSDRecovered,
          gnpcProfitUSD,
          contractorProfitUSD,
        ];

    // Petroleum Engineering Authentic Color Codes:
    // 1. Gross Production = Raw Sweet Crude Oil Gold
    // 2. State Royalty = Sovereign 24K Royalty Gold
    // 3. Cost Recovery = Subsea Flowline Cyan
    // 4. GNPC Profit = Sovereign Energy Emerald
    // 5. Contractor Profit = Deep Offshore Marine Blue
    const backgroundColors = [
      'rgba(245, 158, 11, 0.95)',  // Gross Production (Raw Crude Gold)
      'rgba(217, 119, 6, 0.95)',   // State Royalty (Sovereign Gold)
      'rgba(6, 182, 212, 0.95)',   // Cost Recovery (Subsea Cyan)
      'rgba(16, 185, 129, 0.95)',  // GNPC Profit (Energy Emerald)
      'rgba(59, 130, 246, 0.95)',  // Contractor Profit (Offshore Marine Blue)
    ];

    const borderColors = [
      'rgb(245, 158, 11)',
      'rgb(217, 119, 6)',
      'rgb(6, 182, 212)',
      'rgb(16, 185, 129)',
      'rgb(59, 130, 246)',
    ];

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: isBbl ? 'Volume (Barrels)' : 'Value (USD)',
            data: dataValues,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1.5,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(11, 16, 29, 0.95)',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: '#283a5e',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (context) => {
                const val = context.parsed.y ?? 0;
                if (isBbl) {
                  const shareOfGross = (val / (grossProductionBarrels || 1)) * 100;
                  return [
                    `Volume: ${formatExactBarrels(val)}`,
                    `Share: ${shareOfGross.toFixed(2)}% of Gross Production`,
                  ];
                }
                const shareOfRev = (val / (totalGrossRevenueUSD || 1)) * 100;
                return [
                  `Fiscal Value: ${formatExactUSD(val)}`,
                  `Share: ${shareOfRev.toFixed(2)}% of Gross Value`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#94a3b8',
              font: {
                size: 11,
              },
              maxRotation: 20,
              minRotation: 0,
            },
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.08)',
            },
            ticks: {
              color: '#94a3b8',
              font: {
                size: 11,
                family: 'monospace',
              },
              callback: (value) => {
                const n = Number(value);
                if (isBbl) {
                  return (n / 1e6).toFixed(1) + 'M bbl';
                }
                return '$' + (n / 1e6).toFixed(0) + 'M';
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [
    viewMode,
    grossProductionBarrels,
    stateRoyaltyBarrels,
    costBarrelsClaimed,
    gnpcProfitBarrels,
    contractorProfitBarrels,
    totalGrossRevenueUSD,
    stateRoyaltyUSD,
    costUSDRecovered,
    gnpcProfitUSD,
    contractorProfitUSD,
  ]);

  return (
    <div className="bg-pe-card border border-pe-border rounded-xl p-5 shadow-sm space-y-4 transition-colors duration-200">
      {/* Title & View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-pe-border">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-pe-crude" />
            <h3 className="font-semibold text-sm tracking-wide uppercase text-pe-title">
              Fiscal Waterfall & Production Entitlement Split
            </h3>
          </div>
          <p className="text-xs text-pe-muted mt-0.5">
            Sequential allocation from Gross Production ➔ Royalty ➔ Cost Ceiling ➔ Profit Oil Split
          </p>
        </div>

        {/* Units Toggle */}
        <div className="flex items-center gap-1 p-1 bg-pe-card-inner rounded-lg border border-pe-border self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('barrels')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'barrels'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-pe-muted hover:text-pe-title'
            }`}
          >
            <Fuel className="w-3.5 h-3.5" />
            <span>Barrels (bbls)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('usd')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'usd'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-pe-muted hover:text-pe-title'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Fiscal Value ($ USD)</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full relative">
        <canvas ref={canvasRef} />
      </div>

      {/* Legend & Breakdown Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-pe-border text-xs">
        <div className="bg-pe-card-inner p-2 rounded border border-pe-border">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" />
            <span className="truncate">Gross Production</span>
          </div>
          <div className="font-mono font-bold text-pe-title mt-1">
            {viewMode === 'barrels'
              ? formatBarrels(grossProductionBarrels)
              : formatCurrency(totalGrossRevenueUSD)}
          </div>
          <div className="text-[10px] text-pe-muted">100.00% Baseline</div>
        </div>

        <div className="bg-pe-card-inner p-2 rounded border border-pe-border">
          <div className="flex items-center gap-1.5 text-pe-crude">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span className="truncate">State Royalty</span>
          </div>
          <div className="font-mono font-bold text-pe-crude mt-1">
            {viewMode === 'barrels'
              ? formatBarrels(stateRoyaltyBarrels)
              : formatCurrency(stateRoyaltyUSD)}
          </div>
          <div className="text-[10px] text-pe-muted">
            {((stateRoyaltyBarrels / (grossProductionBarrels || 1)) * 100).toFixed(1)}% of Gross
          </div>
        </div>

        <div className="bg-pe-card-inner p-2 rounded border border-pe-border">
          <div className="flex items-center gap-1.5 text-pe-cyan">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
            <span className="truncate">Cost Oil Claimed</span>
          </div>
          <div className="font-mono font-bold text-pe-cyan mt-1">
            {viewMode === 'barrels'
              ? formatBarrels(costBarrelsClaimed)
              : formatCurrency(costUSDRecovered)}
          </div>
          <div className="text-[10px] text-pe-muted">
            {isCostCapped ? 'Capped at 70% Q_net' : '100% OPEX/CAPEX'}
          </div>
        </div>

        <div className="bg-pe-card-inner p-2 rounded border border-pe-border">
          <div className="flex items-center gap-1.5 text-pe-emerald">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className="truncate">GNPC Profit Oil</span>
          </div>
          <div className="font-mono font-bold text-pe-emerald mt-1">
            {viewMode === 'barrels'
              ? formatBarrels(gnpcProfitBarrels)
              : formatCurrency(gnpcProfitUSD)}
          </div>
          <div className="text-[10px] text-pe-muted">
            {reconciliation.inputs.gnpcCarriedInterestRate * 100}% Carried + Pay
          </div>
        </div>

        <div className="bg-pe-card-inner p-2 rounded border border-pe-border">
          <div className="flex items-center gap-1.5 text-blue-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
            <span className="truncate">Contractor Profit</span>
          </div>
          <div className="font-mono font-bold text-blue-400 mt-1">
            {viewMode === 'barrels'
              ? formatBarrels(contractorProfitBarrels)
              : formatCurrency(contractorProfitUSD)}
          </div>
          <div className="text-[10px] text-pe-muted">Remaining Profit Oil</div>
        </div>
      </div>
    </div>
  );
};
