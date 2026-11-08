import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { FiscalInputs, calculatePriceSensitivity } from '../utils/fiscalEngine';
import { formatCurrency } from '../utils/exportUtils';
import { LineChart as LineChartIcon, TrendingUp, Info } from 'lucide-react';

Chart.register(...registerables);

interface PriceSensitivityChartProps {
  inputs: FiscalInputs;
}

export const PriceSensitivityChart: React.FC<PriceSensitivityChartProps> = ({ inputs }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Generate curve points from $45 to $125
    const curvePoints = calculatePriceSensitivity(inputs, 45, 125, 5);

    const labels = curvePoints.map((p) => `$${p.price.toFixed(0)}`);
    const stateRevenues = curvePoints.map((p) => p.stateRevenueUSD);
    const contractorRevenues = curvePoints.map((p) => p.contractorRevenueUSD);
    const stateTakePercents = curvePoints.map((p) => p.effectiveStateTakePercent);

    // Current price point index
    const currentPrice = inputs.achievedPriceUSD;
    const closestIdx = curvePoints.reduce(
      (best, p, idx) =>
        Math.abs(p.price - currentPrice) < Math.abs(curvePoints[best].price - currentPrice)
          ? idx
          : best,
      0
    );

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Total Ghana State Take ($ USD)',
            data: stateRevenues,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: '#10b981',
            pointRadius: (ctx) => (ctx.dataIndex === closestIdx ? 6 : 2),
            pointHoverRadius: 6,
          },
          {
            label: 'Contractor Gross Take ($ USD)',
            data: contractorRevenues,
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.08)',
            borderWidth: 2,
            borderDash: [5, 4],
            fill: false,
            tension: 0.3,
            pointBackgroundColor: '#f97316',
            pointRadius: (ctx) => (ctx.dataIndex === closestIdx ? 6 : 2),
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              color: '#94a3b8',
              font: {
                size: 11,
              },
              boxWidth: 12,
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(11, 16, 29, 0.95)',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: '#283a5e',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              title: (items) => `Crude Price: ${items[0].label}/bbl`,
              label: (context) => {
                const val = context.parsed.y ?? 0;
                const label = context.dataset.label || '';
                const idx = context.dataIndex;
                const pct = stateTakePercents[idx] ?? 0;
                if (context.datasetIndex === 0) {
                  return `${label}: ${formatCurrency(val)} (${pct.toFixed(1)}% State Take)`;
                }
                return `${label}: ${formatCurrency(val)}`;
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Achieved Crude Oil Benchmark ($/bbl)',
              color: '#94a3b8',
              font: {
                size: 11,
              },
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
            ticks: {
              color: '#94a3b8',
              font: {
                size: 11,
              },
            },
          },
          y: {
            title: {
              display: true,
              text: 'Monthly Realized Revenue ($ USD)',
              color: '#94a3b8',
              font: {
                size: 11,
              },
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.08)',
            },
            ticks: {
              color: '#94a3b8',
              font: {
                size: 11,
                family: 'monospace',
              },
              callback: (value) => '$' + (Number(value) / 1e6).toFixed(0) + 'M',
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
  }, [inputs]);

  return (
    <div className="bg-pe-card border border-pe-border rounded-xl p-5 shadow-sm space-y-4 transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-pe-border">
        <div>
          <div className="flex items-center gap-2">
            <LineChartIcon className="w-4 h-4 text-pe-crude" />
            <h3 className="font-semibold text-sm tracking-wide uppercase text-pe-title">
              Crude Price Sensitivity Profile ($45 – $125/bbl)
            </h3>
          </div>
          <p className="text-xs text-pe-muted mt-0.5">
            Realized Fiscal Revenue dynamics across global oil price cycles under Ghana Act 919
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-pe-body bg-pe-card-inner px-2.5 py-1 rounded border border-pe-border">
          <span className="w-2 h-2 rounded-full bg-pe-crude" />
          <span>Active Lifting Price:</span>
          <span className="font-mono font-bold text-pe-crude">${inputs.achievedPriceUSD.toFixed(2)}/bbl</span>
        </div>
      </div>

      <div className="h-64 w-full relative">
        <canvas ref={canvasRef} />
      </div>

      <div className="text-[11px] text-pe-muted bg-pe-card-inner p-3 rounded-lg border border-pe-border flex items-start gap-2">
        <Info className="w-4 h-4 text-pe-crude shrink-0 mt-0.5" />
        <div>
          <span className="text-pe-title font-medium">Petroleum Fiscal Dynamics Insight: </span>
          Because State Royalty is deducted strictly off the top, Ghana captures guaranteed baseline revenue regardless of price. At higher Brent price bands ($85+), cost recovery barrels required to pay down monthly OPEX drop sharply, expanding the Profit Oil pool and increasing GNPC equity revenue non-linearly.
        </div>
      </div>
    </div>
  );
};
