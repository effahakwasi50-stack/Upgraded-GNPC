/**
 * GNPC Upstream Fiscal & Entitlement Reconciliation Suite
 * Compliant with Ghana Petroleum (Exploration and Production) Act, 2016 (Act 919)
 * and Concession Model Petroleum Agreements.
 */

import React, { useState, useMemo } from 'react';
import {
  calculateFiscalReconciliation,
  CONCESSION_PRESETS,
  FiscalInputs,
} from './utils/fiscalEngine';
import {
  generateAuditCSV,
  downloadCSV,
  generateExecutiveBriefingText,
} from './utils/exportUtils';
import { APP_PY_CODE, downloadAppPy } from './utils/pythonCode';
import { PetroleumThemeId, PETROLEUM_THEMES } from './utils/themeTypes';
import { Header } from './components/Header';
import { ParameterPanel } from './components/ParameterPanel';
import { KpiCards } from './components/KpiCards';
import { WaterfallChart } from './components/WaterfallChart';
import { PriceSensitivityChart } from './components/PriceSensitivityChart';
import { AuditReconciliationTable } from './components/AuditReconciliationTable';
import { PrmaDistributionPanel } from './components/PrmaDistributionPanel';
import { ScenarioComparatorModal } from './components/ScenarioComparatorModal';
import { Code, Download, Copy, Check, Terminal, Palette, Flame, Fuel } from 'lucide-react';

export default function App() {
  const initialPreset = CONCESSION_PRESETS.jubilee;

  const [inputs, setInputs] = useState<FiscalInputs>({
    concessionId: initialPreset.id,
    concessionName: initialPreset.name,
    grossProductionBarrels: initialPreset.defaultGrossProduction,
    achievedPriceUSD: initialPreset.defaultAchievedPrice,
    monthlyCostsUSD: initialPreset.defaultMonthlyCosts,
    statutoryRoyaltyRate: initialPreset.statutoryRoyaltyRate,
    costRecoveryCap: initialPreset.costRecoveryCap,
    gnpcCarriedInterestRate: initialPreset.defaultCarriedInterest,
    gnpcPayingInterestRate: initialPreset.defaultPayingInterest,
  });

  const [cargoRef, setCargoRef] = useState<string>('JUB-LIFTING-2026/74');
  const [copiedBriefing, setCopiedBriefing] = useState<boolean>(false);
  const [copiedPython, setCopiedPython] = useState<boolean>(false);
  const [isComparatorOpen, setIsComparatorOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'reconciliation' | 'charts' | 'prma' | 'python' | 'all'>('all');
  const [activeTheme, setActiveTheme] = useState<PetroleumThemeId>('petrel');

  // Compute fiscal waterfall in real-time
  const reconciliation = useMemo(() => {
    return calculateFiscalReconciliation(inputs);
  }, [inputs]);

  const currentPreset = CONCESSION_PRESETS[inputs.concessionId] || CONCESSION_PRESETS.custom;

  const handleResetConcession = () => {
    const preset = CONCESSION_PRESETS[inputs.concessionId] || CONCESSION_PRESETS.jubilee;
    setInputs({
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

  const handleExportCSV = () => {
    const csvContent = generateAuditCSV(reconciliation, cargoRef);
    const filename = `GNPC_Reconciliation_${inputs.concessionId.toUpperCase()}_${cargoRef.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
    downloadCSV(csvContent, filename);
  };

  const handleCopyBriefing = async () => {
    const text = generateExecutiveBriefingText(reconciliation, cargoRef);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedBriefing(true);
      setTimeout(() => setCopiedBriefing(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedBriefing(true);
      setTimeout(() => setCopiedBriefing(false), 2500);
    }
  };

  const handleCopyPython = async () => {
    try {
      await navigator.clipboard.writeText(APP_PY_CODE);
      setCopiedPython(true);
      setTimeout(() => setCopiedPython(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = APP_PY_CODE;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedPython(true);
      setTimeout(() => setCopiedPython(false), 2500);
    }
  };

  return (
    <div
      data-theme={activeTheme}
      className="min-h-screen bg-pe-canvas text-pe-body flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 transition-colors duration-200"
    >
      {/* Executive Header */}
      <Header
        concession={currentPreset}
        cargoRef={cargoRef}
        onCargoRefChange={setCargoRef}
        onExportCSV={handleExportCSV}
        onCopyBriefing={handleCopyBriefing}
        copiedBriefing={copiedBriefing}
        onOpenComparator={() => setIsComparatorOpen(true)}
        onDownloadPython={downloadAppPy}
        activeTheme={activeTheme}
        onThemeChange={setActiveTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Active Theme Banner Strip */}
        <div className="flex items-center justify-between bg-pe-card border border-pe-border rounded-xl px-4 py-2.5 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <Fuel className="w-4 h-4 text-pe-crude" />
            <span className="font-semibold text-pe-title">Active Theme:</span>
            <span className="text-pe-crude font-medium">{PETROLEUM_THEMES[activeTheme].name}</span>
            <span className="text-pe-muted hidden sm:inline">({PETROLEUM_THEMES[activeTheme].tagline})</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-pe-muted hidden md:inline">Quick Theme:</span>
            <div className="flex items-center gap-1">
              {Object.values(PETROLEUM_THEMES).map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setActiveTheme(th.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    activeTheme === th.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-pe-card-inner text-pe-muted hover:text-pe-title border border-pe-border'
                  }`}
                >
                  {th.badge}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KPI Cards Row */}
        <section aria-label="Executive KPI Metrics">
          <KpiCards reconciliation={reconciliation} />
        </section>

        {/* View Selection Tabs */}
        <div className="flex items-center justify-between border-b border-pe-border pb-2">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-pe-card text-pe-crude font-semibold border border-pe-border'
                  : 'text-pe-muted hover:text-pe-title'
              }`}
            >
              Executive Suite (Full View)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reconciliation')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'reconciliation'
                  ? 'bg-pe-card text-pe-crude font-semibold border border-pe-border'
                  : 'text-pe-muted hover:text-pe-title'
              }`}
            >
              Statutory Audit Sheet
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('charts')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'charts'
                  ? 'bg-pe-card text-pe-crude font-semibold border border-pe-border'
                  : 'text-pe-muted hover:text-pe-title'
              }`}
            >
              Hydrocarbon Charts
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('prma')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'prma'
                  ? 'bg-pe-card text-pe-crude font-semibold border border-pe-border'
                  : 'text-pe-muted hover:text-pe-title'
              }`}
            >
              PRMA Act 815 Distribution
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('python')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'python'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800 font-semibold'
                  : 'text-pe-muted hover:text-amber-300'
              }`}
            >
              <Code className="w-3.5 h-3.5 text-amber-400" />
              <span>Python Script (app.py)</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-pe-muted">
            <span>Concession:</span>
            <span className="font-semibold text-pe-title">{inputs.concessionName.split(' ')[0]}</span>
            <span>·</span>
            <span className="font-mono text-pe-emerald">
              State Take: {reconciliation.effectiveStateTakePercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Core Layout: Parameters Sidebar + Analytical Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Parameter & Concession Controls */}
          <aside className="lg:col-span-4 space-y-6">
            <ParameterPanel
              inputs={inputs}
              onChange={setInputs}
              onResetConcession={handleResetConcession}
            />

            {/* Regulatory Guidance Notes */}
            <div className="bg-pe-card border border-pe-border rounded-xl p-4 text-xs text-pe-muted space-y-2">
              <div className="font-semibold text-pe-title uppercase tracking-wider text-[10px]">
                Statutory Regulatory Notes
              </div>
              <p className="leading-relaxed">
                Reconciliation calculations are conducted in compliance with Section 85 (State Royalties)
                and Section 10 (State Equity Participation) of the Petroleum (Exploration and Production) Act,
                2016 (Act 919) alongside respective Model Petroleum Agreements.
              </p>
              <div className="pt-2 border-t border-pe-border text-[11px] text-pe-muted flex items-center justify-between">
                <span>Joint Operations Committee</span>
                <span className="font-mono text-pe-emerald">Verified Math</span>
              </div>
            </div>
          </aside>

          {/* Right Column: Visualizations & Audit Table */}
          <div className="lg:col-span-8 space-y-6">
            {/* Visualizations Section */}
            {(activeTab === 'all' || activeTab === 'charts') && (
              <div className="space-y-6">
                {/* Chart 1: Waterfall / Stacked Bar */}
                <WaterfallChart reconciliation={reconciliation} />

                {/* Chart 2: Price Sensitivity Curve */}
                <PriceSensitivityChart inputs={inputs} />
              </div>
            )}

            {/* PRMA Sovereign Wealth Distribution */}
            {(activeTab === 'all' || activeTab === 'prma') && (
              <PrmaDistributionPanel reconciliation={reconciliation} />
            )}

            {/* Audit & Reconciliation Table */}
            {(activeTab === 'all' || activeTab === 'reconciliation') && (
              <AuditReconciliationTable
                reconciliation={reconciliation}
                onExportCSV={handleExportCSV}
              />
            )}

            {/* Python Engine (app.py) Viewer & GitHub Guide */}
            {activeTab === 'python' && (
              <div className="bg-pe-card border border-pe-border rounded-xl p-5 shadow-sm text-pe-body space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-pe-border">
                  <div>
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-pe-crude" />
                      <h3 className="font-semibold text-sm text-pe-title tracking-wide uppercase">
                        app.py &mdash; Standalone Ghana Upstream Fiscal Engine
                      </h3>
                    </div>
                    <p className="text-xs text-pe-muted mt-0.5">
                      Self-contained Python script implementing Act 919 waterfall, Streamlit UI, CLI report, and unit tests
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={handleCopyPython}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-pe-card-inner hover:bg-pe-card border border-pe-border text-pe-body transition-colors"
                      title="Copy full Python source code to clipboard"
                    >
                      {copiedPython ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-pe-emerald" />
                          <span>Copied Python!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-pe-muted" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={downloadAppPy}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-colors"
                      title="Download app.py file to your computer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download app.py</span>
                    </button>
                  </div>
                </div>

                {/* GitHub Upload Guide Box */}
                <div className="bg-pe-card-inner rounded-lg p-3.5 border border-amber-900/40 text-xs text-pe-body space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-pe-crude">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>How to Add app.py to Your GitHub Repository:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-pe-muted text-[11px] leading-relaxed">
                    <li>
                      Click <strong className="text-amber-400">Download app.py</strong> above to save the file.
                    </li>
                    <li>
                      Open your repository on GitHub (<code className="text-pe-title bg-pe-card px-1 py-0.5 rounded">effahakwasi50-stack</code>).
                    </li>
                    <li>
                      Click <strong className="text-pe-title">Add file</strong> &rarr; <strong className="text-pe-title">Create new file</strong> and name it <code className="text-pe-crude font-bold">app.py</code>.
                    </li>
                    <li>
                      Paste the code and click <strong className="text-pe-title">Commit changes</strong>.
                    </li>
                  </ol>
                </div>

                {/* Code Block Container */}
                <div className="relative rounded-lg overflow-hidden border border-pe-border bg-pe-card-inner">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-pe-card border-b border-pe-border text-[11px] font-mono text-pe-muted">
                    <span>app.py &middot; Python 3 &middot; Act 919 Upstream Engine</span>
                    <span>Runs via `streamlit run app.py` or `python app.py`</span>
                  </div>
                  <pre className="p-4 text-xs font-mono text-pe-body overflow-x-auto max-h-[500px] leading-relaxed">
                    <code>{APP_PY_CODE}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Multi-Scenario Comparator Modal */}
      <ScenarioComparatorModal
        isOpen={isComparatorOpen}
        onClose={() => setIsComparatorOpen(false)}
        currentInputs={inputs}
        onApplyScenario={(newInputs) => setInputs(newInputs)}
      />

      {/* Footer */}
      <footer className="border-t border-pe-border bg-pe-header text-pe-muted text-xs py-5 mt-12 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-pe-title">GNPC Petroleum Economics</span>
            <span>·</span>
            <span>Ghana Upstream Fiscal Engine</span>
          </div>
          <div className="text-[11px] text-pe-muted font-mono">
            Compliant with Act 919 & Petroleum Revenue Management Act (Act 815 / Act 893)
          </div>
        </div>
      </footer>
    </div>
  );
}
