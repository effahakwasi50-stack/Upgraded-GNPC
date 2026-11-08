export type PetroleumThemeId = 'petrel' | 'rig-highvis' | 'woodmac' | 'gnpc-heritage';

export interface PetroleumTheme {
  id: PetroleumThemeId;
  name: string;
  badge: string;
  tagline: string;
  previewColors: {
    canvas: string;
    crude: string;
    subsea: string;
    emerald: string;
    orange: string;
  };
}

export const PETROLEUM_THEMES: Record<PetroleumThemeId, PetroleumTheme> = {
  petrel: {
    id: 'petrel',
    name: 'Offshore Deepwater',
    badge: 'SLB Petrel Dark',
    tagline: 'Standard Deepwater Navy, Crude Gold & Subsea Flowline Cyan',
    previewColors: {
      canvas: '#060a12',
      crude: '#f59e0b',
      subsea: '#06b6d4',
      emerald: '#10b981',
      orange: '#f97316',
    },
  },
  'rig-highvis': {
    id: 'rig-highvis',
    name: 'Rig Floor High-Vis',
    badge: 'Drilling Ops',
    tagline: 'High-contrast Titanium, Derrick Safety Orange & Light Crude',
    previewColors: {
      canvas: '#070b0f',
      crude: '#fbbf24',
      subsea: '#38bdf8',
      emerald: '#00e676',
      orange: '#ff6600',
    },
  },
  woodmac: {
    id: 'woodmac',
    name: 'WoodMac Executive',
    badge: 'Upstream Economics',
    tagline: 'Crisp Technical Canvas, Amber Hydrocarbons & Steel Slate',
    previewColors: {
      canvas: '#f3f6fa',
      crude: '#b45309',
      subsea: '#0284c7',
      emerald: '#047857',
      orange: '#c2410c',
    },
  },
  'gnpc-heritage': {
    id: 'gnpc-heritage',
    name: 'GNPC Sovereign',
    badge: 'Ghana Petroleum',
    tagline: 'Rich Petroleum Black, Sovereign Kente Gold & Energy Jade',
    previewColors: {
      canvas: '#070a08',
      crude: '#eab308',
      subsea: '#22d3ee',
      emerald: '#22c55e',
      orange: '#ef4444',
    },
  },
};
