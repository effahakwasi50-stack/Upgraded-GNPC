import React, { useState } from 'react';
import { ConcessionPreset } from '../utils/fiscalEngine';
import { PetroleumThemeId, PETROLEUM_THEMES } from '../utils/themeTypes';
import {
  FileSpreadsheet,
  Copy,
  Check,
  Compass,
  Ship,
  Sparkles,
  Code,
  Palette,
  Fuel,
  ChevronDown,
} from 'lucide-react';

interface HeaderProps {
  concession: ConcessionPreset;
  cargoRef: string;
  onCargoRefChange: (val: string) => void;
  onExportCSV: () => void;
  onCopyBriefing: () => void;
  copiedBriefing: boolean;
  onOpenComparator: () => void;
  onDownloadPython: () => void;
  activeTheme: PetroleumThemeId;
  onThemeChange: (themeId: PetroleumThemeId) => void;
}

export const Header: React.FC<HeaderProps> = ({
  concession,
  cargoRef,
  onCargoRefChange,
  onExportCSV,
  onCopyBriefing,
  copiedBriefing,
  onOpenComparator,
  onDownloadPython,
  activeTheme,
  onThemeChange,
}) => {
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const currentThemeObj = PETROLEUM_THEMES[activeTheme] || PETROLEUM_THEMES.petrel;

  return (
    <header className="border-b border-pe-border bg-pe-header backdrop-blur text-pe-title sticky top-0 z-40 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Brand & Petroleum Suite Subtitle */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 via-amber-600 to-emerald-700 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-pe-card rounded-[7px] flex items-center justify-center">
                <Fuel className="w-5 h-5 text-pe-crude" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-pe-crude text-slate-950 font-black text-[11px] px-2 py-0.5 rounded tracking-wider shadow-sm">
                  GNPC
                </span>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-pe-title">
                  GNPC Upstream Fiscal Reconciliation Suite
                </h1>
                <span className="text-[11px] font-mono text-pe-emerald bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
                  Act 919 & Model PA
                </span>
              </div>
              <p className="text-xs text-pe-muted mt-0.5">
                Upstream Petroleum Fiscal Engine · Concession Royalty, Cost Oil Ceiling & Profit Oil Reconciliation
              </p>
            </div>
          </div>

          {/* Controls: Asset info, Lifting Ref & Actions */}
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
            {/* FPSO Facility */}
            <div className="flex items-center gap-2 bg-pe-card-inner border border-pe-border rounded-lg px-2.5 py-1.5 text-xs">
              <Ship className="w-3.5 h-3.5 text-pe-cyan shrink-0" />
              <div className="text-left">
                <div className="text-[10px] text-pe-muted uppercase tracking-wider font-semibold">Offshore Facility</div>
                <div className="text-pe-title font-medium truncate max-w-[155px]">{concession.fpsoName}</div>
              </div>
            </div>

            {/* Lifting Cargo Ref */}
            <div className="flex items-center gap-2 bg-pe-card-inner border border-pe-border rounded-lg px-2.5 py-1.5 text-xs">
              <Compass className="w-3.5 h-3.5 text-pe-crude shrink-0" />
              <div>
                <label htmlFor="cargo-ref-input" className="text-[10px] text-pe-muted uppercase tracking-wider font-semibold block">
                  Lifting Parcel Ref
                </label>
                <input
                  id="cargo-ref-input"
                  type="text"
                  value={cargoRef}
                  onChange={(e) => onCargoRefChange(e.target.value)}
                  className="bg-transparent text-pe-title font-mono font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded px-1 -mx-1 text-xs w-28"
                  placeholder="e.g. JUB-2026/04"
                />
              </div>
            </div>

            {/* Petroleum Engineering Theme Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-pe-card-inner hover:bg-pe-card border border-pe-border text-pe-title shadow-sm transition-colors"
                title="Switch authentic Petroleum Engineering color scheme"
              >
                <Palette className="w-3.5 h-3.5 text-pe-crude" />
                <span className="hidden sm:inline font-medium">{currentThemeObj.badge}</span>
                <div className="flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shadow-xs"
                    style={{ backgroundColor: currentThemeObj.previewColors.crude }}
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shadow-xs"
                    style={{ backgroundColor: currentThemeObj.previewColors.subsea }}
                  />
                </div>
                <ChevronDown className="w-3 h-3 text-pe-muted" />
              </button>

              {themeDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 rounded-xl bg-pe-card border border-pe-border shadow-xl p-2 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setThemeDropdownOpen(false)}
                >
                  <div className="px-2.5 py-1.5 text-[10px] font-semibold text-pe-muted uppercase tracking-wider border-b border-pe-border">
                    Petroleum Engineering Color Themes
                  </div>
                  {Object.values(PETROLEUM_THEMES).map((th) => {
                    const isCurrent = th.id === activeTheme;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => onThemeChange(th.id)}
                        className={`w-full text-left p-2 rounded-lg flex items-start gap-2.5 transition-all ${
                          isCurrent
                            ? 'bg-pe-card-inner border border-pe-crude text-pe-title ring-1 ring-amber-500/30'
                            : 'hover:bg-pe-card-inner text-pe-body'
                        }`}
                      >
                        <div className="flex flex-col gap-1 pt-0.5 shrink-0">
                          <span
                            className="w-3 h-3 rounded-full border border-black/20"
                            style={{ backgroundColor: th.previewColors.crude }}
                          />
                          <span
                            className="w-3 h-3 rounded-full border border-black/20"
                            style={{ backgroundColor: th.previewColors.subsea }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-pe-title">{th.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-pe-border rounded text-pe-muted font-mono">
                              {th.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-pe-muted mt-0.5 leading-snug truncate">
                            {th.tagline}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Scenarios Comparison Modal trigger */}
            <button
              type="button"
              onClick={onOpenComparator}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-pe-card-inner hover:bg-pe-card border border-pe-border text-pe-body transition-colors"
              title="Compare base, bull, bear and high-cost scenarios"
            >
              <Sparkles className="w-3.5 h-3.5 text-pe-crude" />
              <span className="hidden md:inline">Scenarios</span>
            </button>

            {/* Copy Executive Briefing Memo */}
            <button
              type="button"
              onClick={onCopyBriefing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-pe-card-inner hover:bg-pe-card border border-pe-border text-pe-body transition-colors"
              title="Copy structured executive memorandum for Ministry of Finance / GNPC Board"
            >
              {copiedBriefing ? (
                <>
                  <Check className="w-3.5 h-3.5 text-pe-emerald" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-pe-muted" />
                  <span className="hidden md:inline">Memo</span>
                </>
              )}
            </button>

            {/* Download app.py */}
            <button
              type="button"
              onClick={onDownloadPython}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-colors"
              title="Download app.py standalone Python fiscal calculation engine"
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
              <span>app.py</span>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={onExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
              title="Download complete line-by-line reconciliation audit workbook as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
