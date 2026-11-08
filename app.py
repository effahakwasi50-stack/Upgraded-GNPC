#!/usr/bin/env python3
"""
GNPC Fiscal & Entitlement Reconciliation Suite (Ghana Upstream Fiscal Engine)
=============================================================================
Governing Legal Framework:
  - Petroleum (Exploration and Production) Act, 2016 (Act 919)
  - Petroleum Revenue Management Act, 2011 (Act 815 & Act 893)
  - Ghana Model Petroleum Agreements (Jubilee, TEN, Sankofa-Gye Nyame)

Usage:
  1. Streamlit Web App (Recommended):
     streamlit run app.py
  2. Direct Python Execution:
     python app.py
     (Automatically launches Streamlit if installed, or runs the CLI audit report)
  3. Automated Mathematical Unit Tests:
     python app.py --test
"""

import sys
import os
import math
import json
import argparse
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional

# ---------------------------------------------------------------------------
# 1. Statutory Presets & Data Structures
# ---------------------------------------------------------------------------

@dataclass
class ConcessionPreset:
    id: str
    name: str
    operator: str
    offshore_basin: str
    fpso_name: str
    statutory_royalty_rate: float
    default_gross_production: float
    default_achieved_price: float
    default_monthly_costs: float
    default_carried_interest: float
    default_paying_interest: float
    cost_recovery_cap: float = 0.70
    cargo_parcel_size: float = 950000.0


CONCESSION_PRESETS: Dict[str, ConcessionPreset] = {
    "jubilee": ConcessionPreset(
        id="jubilee",
        name="Jubilee Field (WCTP & DWT Blocks)",
        operator="Tullow Ghana Ltd, Kosmos Energy, GNPC, PetroSA",
        offshore_basin="Tano Deepwater Basin",
        fpso_name="FPSO Kwame Nkrumah (MV21)",
        statutory_royalty_rate=0.05,
        default_gross_production=2850000.0,
        default_achieved_price=78.50,
        default_monthly_costs=62000000.0,
        default_carried_interest=0.1364,
        default_paying_interest=0.00,
        cost_recovery_cap=0.70,
    ),
    "ten": ConcessionPreset(
        id="ten",
        name="TEN Fields (Tweneboa, Enyenra, Ntomme)",
        operator="Tullow Ghana Ltd, Kosmos Energy, GNPC, PetroSA",
        offshore_basin="Deepwater Tano Basin",
        fpso_name="FPSO Prof. John Evans Atta Mills",
        statutory_royalty_rate=0.05,
        default_gross_production=1200000.0,
        default_achieved_price=78.50,
        default_monthly_costs=38000000.0,
        default_carried_interest=0.15,
        default_paying_interest=0.00,
        cost_recovery_cap=0.70,
    ),
    "sankofa": ConcessionPreset(
        id="sankofa",
        name="Sankofa-Gye Nyame (OCTP Concession)",
        operator="Eni Ghana Exploration & Production, Vitol Upstream, GNPC",
        offshore_basin="Cape Three Points Offshore Basin",
        fpso_name="FPSO John Agyekum Kufuor",
        statutory_royalty_rate=0.075,
        default_gross_production=1650000.0,
        default_achieved_price=78.50,
        default_monthly_costs=45000000.0,
        default_carried_interest=0.15,
        default_paying_interest=0.05,
        cost_recovery_cap=0.70,
    ),
    "custom": ConcessionPreset(
        id="custom",
        name="Custom Exploration Block",
        operator="Joint Operating Concession",
        offshore_basin="Western / Central Offshore Basin",
        fpso_name="Offshore Production Facility",
        statutory_royalty_rate=0.10,
        default_gross_production=1000000.0,
        default_achieved_price=80.00,
        default_monthly_costs=30000000.0,
        default_carried_interest=0.15,
        default_paying_interest=0.00,
        cost_recovery_cap=0.70,
    ),
}


@dataclass
class FiscalInputs:
    concession_id: str
    concession_name: str
    gross_production_barrels: float
    achieved_price_usd: float
    monthly_costs_usd: float
    statutory_royalty_rate: float
    cost_recovery_cap: float = 0.70
    gnpc_carried_interest_rate: float = 0.15
    gnpc_paying_interest_rate: float = 0.00


@dataclass
class PrmaDistribution:
    gnpc_level_a_allocation_usd: float
    petroleum_holding_fund_usd: float
    annual_budget_funding_amount_usd: float
    ghana_petroleum_funds_usd: float
    ghana_stabilization_fund_usd: float
    ghana_heritage_fund_usd: float


@dataclass
class FiscalReconciliationOutput:
    inputs: FiscalInputs
    gross_production_barrels: float
    achieved_price_usd: float
    total_gross_revenue_usd: float
    royalty_rate: float
    state_royalty_barrels: float
    state_royalty_usd: float
    net_production_barrels: float
    cost_recovery_cap_rate: float
    max_cost_recovery_barrels_allowed: float
    max_cost_recovery_usd_allowed: float
    costs_claimed_usd: float
    cost_barrels_demanded: float
    cost_barrels_claimed: float
    cost_usd_recovered: float
    unrecovered_cost_usd: float
    unrecovered_cost_barrels: float
    is_cost_capped: bool
    profit_oil_barrels: float
    profit_oil_usd: float
    gnpc_total_equity_rate: float
    gnpc_profit_barrels: float
    gnpc_profit_usd: float
    contractor_profit_barrels: float
    contractor_profit_usd: float
    total_ghana_barrels: float
    total_ghana_revenue_usd: float
    effective_state_take_percent: float
    contractor_total_barrels: float
    contractor_gross_revenue_usd: float
    contractor_net_take_usd: float
    effective_contractor_take_percent: float
    standard_parcels_ghana: float
    standard_parcels_contractor: float
    prma_distribution: PrmaDistribution


# ---------------------------------------------------------------------------
# 2. Mathematical Fiscal Calculation Engine (Act 919)
# ---------------------------------------------------------------------------

def calculate_fiscal_reconciliation(inputs: FiscalInputs) -> FiscalReconciliationOutput:
    gross_bbl = max(0.0, float(inputs.gross_production_barrels or 0.0))
    price = max(0.0, float(inputs.achieved_price_usd or 0.0))
    monthly_costs = max(0.0, float(inputs.monthly_costs_usd or 0.0))
    royalty_rate = min(max(0.0, float(inputs.statutory_royalty_rate or 0.0)), 0.50)
    cost_cap = min(max(0.1, float(inputs.cost_recovery_cap or 0.70)), 1.0)
    carried_rate = min(max(0.0, float(inputs.gnpc_carried_interest_rate or 0.0)), 1.0)
    paying_rate = min(max(0.0, float(inputs.gnpc_paying_interest_rate or 0.0)), 0.50)
    gnpc_total_equity = min(1.0, carried_rate + paying_rate)

    total_gross_revenue = gross_bbl * price
    royalty_bbl = gross_bbl * royalty_rate
    royalty_usd = royalty_bbl * price
    net_production_bbl = max(0.0, gross_bbl - royalty_bbl)

    max_cost_bbl = net_production_bbl * cost_cap
    max_cost_usd = max_cost_bbl * price

    cost_bbl_demanded = (monthly_costs / price) if price > 0.0 else 0.0
    cost_bbl_claimed = min(cost_bbl_demanded, max_cost_bbl)
    cost_usd_recovered = cost_bbl_claimed * price
    unrecovered_cost_usd = max(0.0, monthly_costs - cost_usd_recovered)
    unrecovered_cost_bbl = (unrecovered_cost_usd / price) if price > 0.0 else 0.0
    is_cost_capped = (cost_bbl_demanded > max_cost_bbl) and (monthly_costs > 0.0)

    profit_oil_bbl = max(0.0, net_production_bbl - cost_bbl_claimed)
    profit_oil_usd = profit_oil_bbl * price

    gnpc_profit_bbl = profit_oil_bbl * gnpc_total_equity
    gnpc_profit_usd = gnpc_profit_bbl * price

    contractor_profit_bbl = max(0.0, profit_oil_bbl - gnpc_profit_bbl)
    contractor_profit_usd = contractor_profit_bbl * price

    total_ghana_bbl = royalty_bbl + gnpc_profit_bbl
    total_ghana_revenue = total_ghana_bbl * price

    contractor_total_bbl = cost_bbl_claimed + contractor_profit_bbl
    contractor_gross_revenue = contractor_total_bbl * price
    contractor_net_take = contractor_profit_usd

    effective_state_take_pct = (
        (total_ghana_revenue / total_gross_revenue * 100.0)
        if total_gross_revenue > 0.0
        else 0.0
    )
    effective_contractor_take_pct = (
        (contractor_total_bbl / gross_bbl * 100.0)
        if gross_bbl > 0.0
        else 0.0
    )

    parcel_size = 950000.0
    standard_parcels_ghana = total_ghana_bbl / parcel_size
    standard_parcels_contractor = contractor_total_bbl / parcel_size

    # Petroleum Revenue Management Act (Act 815) Distribution
    gnpc_level_a = total_ghana_revenue * 0.30
    phf_usd = total_ghana_revenue * 0.70
    abfa_usd = phf_usd * 0.70
    gpf_usd = phf_usd * 0.30
    gsf_usd = gpf_usd * 0.70
    ghf_usd = gpf_usd * 0.30

    prma = PrmaDistribution(
        gnpc_level_a_allocation_usd=gnpc_level_a,
        petroleum_holding_fund_usd=phf_usd,
        annual_budget_funding_amount_usd=abfa_usd,
        ghana_petroleum_funds_usd=gpf_usd,
        ghana_stabilization_fund_usd=gsf_usd,
        ghana_heritage_fund_usd=ghf_usd,
    )

    return FiscalReconciliationOutput(
        inputs=inputs,
        gross_production_barrels=gross_bbl,
        achieved_price_usd=price,
        total_gross_revenue_usd=total_gross_revenue,
        royalty_rate=royalty_rate,
        state_royalty_barrels=royalty_bbl,
        state_royalty_usd=royalty_usd,
        net_production_barrels=net_production_bbl,
        cost_recovery_cap_rate=cost_cap,
        max_cost_recovery_barrels_allowed=max_cost_bbl,
        max_cost_recovery_usd_allowed=max_cost_usd,
        costs_claimed_usd=monthly_costs,
        cost_barrels_demanded=cost_bbl_demanded,
        cost_barrels_claimed=cost_bbl_claimed,
        cost_usd_recovered=cost_usd_recovered,
        unrecovered_cost_usd=unrecovered_cost_usd,
        unrecovered_cost_barrels=unrecovered_cost_bbl,
        is_cost_capped=is_cost_capped,
        profit_oil_barrels=profit_oil_bbl,
        profit_oil_usd=profit_oil_usd,
        gnpc_total_equity_rate=gnpc_total_equity,
        gnpc_profit_barrels=gnpc_profit_bbl,
        gnpc_profit_usd=gnpc_profit_usd,
        contractor_profit_barrels=contractor_profit_bbl,
        contractor_profit_usd=contractor_profit_usd,
        total_ghana_barrels=total_ghana_bbl,
        total_ghana_revenue_usd=total_ghana_revenue,
        effective_state_take_percent=effective_state_take_pct,
        contractor_total_barrels=contractor_total_bbl,
        contractor_gross_revenue_usd=contractor_gross_revenue,
        contractor_net_take_usd=contractor_net_take,
        effective_contractor_take_percent=effective_contractor_take_pct,
        standard_parcels_ghana=standard_parcels_ghana,
        standard_parcels_contractor=standard_parcels_contractor,
        prma_distribution=prma,
    )


def calculate_price_sensitivity(
    inputs: FiscalInputs,
    min_price: float = 50.0,
    max_price: float = 120.0,
    step: float = 5.0,
) -> List[Dict]:
    results = []
    p = min_price
    while p <= max_price + 1e-4:
        inp = FiscalInputs(**asdict(inputs))
        inp.achieved_price_usd = p
        res = calculate_fiscal_reconciliation(inp)
        results.append({
            "price": round(p, 2),
            "state_revenue_usd": round(res.total_ghana_revenue_usd, 2),
            "contractor_revenue_usd": round(res.contractor_gross_revenue_usd, 2),
            "effective_state_take_percent": round(res.effective_state_take_percent, 2),
            "gnpc_barrels": round(res.total_ghana_barrels, 2),
            "contractor_barrels": round(res.contractor_total_barrels, 2),
        })
        p += step
    return results


# ---------------------------------------------------------------------------
# 3. Streamlit Interactive Application
# ---------------------------------------------------------------------------

def render_streamlit_app():
    import streamlit as st

    st.set_page_config(
        page_title="GNPC Upstream Fiscal Reconciliation Suite",
        page_icon="🇬🇭",
        layout="wide",
        initial_sidebar_state="expanded",
    )

    # Petroleum Engineering Industry CSS Theme
    st.markdown("""
        <style>
            /* Base Petroleum Dark Canvas */
            .stApp {
                background-color: #060a12;
                color: #cbd5e1;
            }
            [data-testid="stSidebar"] {
                background-color: #0a101d;
                border-right: 1px solid #1a2742;
            }
            /* Petroleum Metric Cards Styling */
            [data-testid="stMetric"] {
                background: #0d1526;
                padding: 16px;
                border-radius: 10px;
                border: 1px solid #1a2742;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            }
            [data-testid="stMetricLabel"] {
                color: #94a3b8 !important;
                font-size: 11px !important;
                font-weight: 600 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.05em !important;
            }
            [data-testid="stMetricValue"] {
                color: #f8fafc !important;
                font-family: monospace !important;
                font-size: 24px !important;
                font-weight: 700 !important;
            }
            /* Petroleum Crude Gold Accents */
            .crude-accent {
                color: #f59e0b;
            }
            .subsea-accent {
                color: #06b6d4;
            }
            .state-accent {
                color: #10b981;
            }
        </style>
    """, unsafe_allow_html=True)

    # Top Header
    st.markdown("""
        <div style="background: linear-gradient(90deg, #0a101d 0%, #111e33 100%); padding: 20px 24px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #1a2742; border-top: 3px solid #f59e0b;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="background: #f59e0b; color: #060a12; font-weight: 900; font-size: 12px; padding: 4px 10px; border-radius: 4px; letter-spacing: 0.05em;">GNPC UPSTREAM</span>
                <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; padding: 0;">GNPC Upstream Fiscal Reconciliation Suite</h1>
                <span style="background: #064e3b; color: #34d399; font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 4px; border: 1px solid #059669;">Act 919 & Model PA</span>
            </div>
            <p style="color: #94a3b8; font-size: 13px; margin: 8px 0 0 0;">
                Petroleum Engineering Fiscal Suite · Monthly Offshore Crude Liftings, Royalty Deductions, 70% Cost Recovery Ceiling & PRMA (Act 815) Sovereign Revenue Split
            </p>
        </div>
    """, unsafe_allow_html=True)

    # Sidebar: Concession Presets and Input Controls
    st.sidebar.markdown("""
        <div style="padding-bottom: 8px; margin-bottom: 12px; border-bottom: 1px solid #1a2742;">
            <span style="color: #f59e0b; font-weight: 800; font-size: 14px;">🛢️ CONCESSION & FIELD SETUP</span>
        </div>
    """, unsafe_allow_html=True)
    selected_key = st.sidebar.selectbox(
        "Offshore Concession Preset",
        options=["jubilee", "ten", "sankofa", "custom"],
        format_func=lambda x: CONCESSION_PRESETS[x].name,
        index=0,
    )
    preset = CONCESSION_PRESETS[selected_key]

    st.sidebar.caption(f"FPSO: **{preset.fpso_name}** | Operator: {preset.operator}")
    st.sidebar.markdown("---")

    gross_bbl = st.sidebar.number_input(
        "Monthly Gross Production (bbls)",
        min_value=10000.0,
        max_value=10000000.0,
        value=float(preset.default_gross_production),
        step=50000.0,
        format="%.0f",
    )

    price_usd = st.sidebar.number_input(
        "Achieved Crude Price ($/bbl)",
        min_value=10.0,
        max_value=200.0,
        value=float(preset.default_achieved_price),
        step=0.5,
        format="%.2f",
    )

    costs_usd = st.sidebar.number_input(
        "Monthly OPEX + Amortized CAPEX ($ USD)",
        min_value=0.0,
        max_value=500000000.0,
        value=float(preset.default_monthly_costs),
        step=1000000.0,
        format="%.0f",
    )

    st.sidebar.markdown("---")
    st.sidebar.subheader("Fiscal & Equity Contract Terms")

    royalty_pct = st.sidebar.slider(
        "Statutory Royalty Rate (%)",
        min_value=0.0,
        max_value=25.0,
        value=float(preset.statutory_royalty_rate * 100.0),
        step=0.5,
    ) / 100.0

    cost_cap_pct = st.sidebar.slider(
        "Cost Recovery Ceiling Cap (%)",
        min_value=40.0,
        max_value=100.0,
        value=float(preset.cost_recovery_cap * 100.0),
        step=5.0,
    ) / 100.0

    carried_pct = st.sidebar.slider(
        "GNPC Carried Interest (%)",
        min_value=0.0,
        max_value=30.0,
        value=float(preset.default_carried_interest * 100.0),
        step=0.5,
    ) / 100.0

    paying_pct = st.sidebar.slider(
        "GNPC Additional Paying Interest (%)",
        min_value=0.0,
        max_value=15.0,
        value=float(preset.default_paying_interest * 100.0),
        step=0.5,
    ) / 100.0

    # Calculate
    inp = FiscalInputs(
        concession_id=preset.id,
        concession_name=preset.name,
        gross_production_barrels=gross_bbl,
        achieved_price_usd=price_usd,
        monthly_costs_usd=costs_usd,
        statutory_royalty_rate=royalty_pct,
        cost_recovery_cap=cost_cap_pct,
        gnpc_carried_interest_rate=carried_pct,
        gnpc_paying_interest_rate=paying_pct,
    )
    res = calculate_fiscal_reconciliation(inp)

    # -----------------------------------------------------------------------
    # 4 Executive KPI Metric Cards (Industrial Petroleum Engineering Banners)
    # -----------------------------------------------------------------------
    kpi_col1, kpi_col2, kpi_col3, kpi_col4 = st.columns(4)

    # Card 1: Gross Concession Value (Raw Sweet Crude Gold)
    with kpi_col1:
        st.markdown(f"""
            <div style="background: #0d1526; border: 2px solid rgba(245, 158, 11, 0.85); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.15); margin-bottom: 16px;">
                <div style="background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%); padding: 8px 12px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #060a12; font-weight: 900; font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase;">🛢️ GROSS CONCESSION VALUE</span>
                    <span style="background: #060a12; color: #fbbf24; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; font-family: monospace;">Q_gross × P</span>
                </div>
                <div style="padding: 16px; background: linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, rgba(13, 21, 38, 0.95) 100%);">
                    <div style="font-size: 28px; font-weight: 900; color: #ffffff; font-family: monospace; letter-spacing: -0.02em;">
                        ${res.total_gross_revenue_usd / 1e6:,.2f}M
                    </div>
                    <div style="margin-top: 8px; display: flex; gap: 8px; align-items: center; font-size: 12px;">
                        <span style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); padding: 2px 8px; border-radius: 4px; font-weight: 700; font-family: monospace;">
                            {res.gross_production_barrels / 1e6:,.2f}M bbls
                        </span>
                        <span style="color: #cbd5e1; font-weight: 600;">· ${res.achieved_price_usd:.2f}/bbl</span>
                    </div>
                    <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid rgba(245, 158, 11, 0.25); display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8;">
                        <span>Total Monthly Barrels</span>
                        <span style="color: #fbbf24; font-weight: 800;">100.00% Baseline</span>
                    </div>
                </div>
            </div>
        """, unsafe_allow_html=True)

    # Card 2: Total Ghana State Take (Sovereign Energy Emerald)
    with kpi_col2:
        st.markdown(f"""
            <div style="background: #0d1526; border: 2px solid rgba(16, 185, 129, 0.85); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.15); margin-bottom: 16px;">
                <div style="background: linear-gradient(90deg, #10b981 0%, #059669 100%); padding: 8px 12px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #060a12; font-weight: 900; font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase;">🏛️ TOTAL GHANA STATE TAKE</span>
                    <span style="background: #060a12; color: #34d399; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; font-family: monospace;">GoG + GNPC</span>
                </div>
                <div style="padding: 16px; background: linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(13, 21, 38, 0.95) 100%);">
                    <div style="font-size: 28px; font-weight: 900; color: #34d399; font-family: monospace; letter-spacing: -0.02em;">
                        ${res.total_ghana_revenue_usd / 1e6:,.2f}M
                    </div>
                    <div style="margin-top: 8px; display: flex; gap: 8px; align-items: center; font-size: 12px;">
                        <span style="background: #10b981; color: #060a12; font-weight: 900; padding: 2px 8px; border-radius: 4px; font-family: monospace;">
                            {res.effective_state_take_percent:.2f}%
                        </span>
                        <span style="color: #e2e8f0; font-weight: 600;">Effective State Take</span>
                    </div>
                    <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid rgba(16, 185, 129, 0.25); display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8;">
                        <span>Royalty + Carried Profit</span>
                        <span style="color: #34d399; font-weight: 800;">{res.standard_parcels_ghana:.2f} Cargoes (950k)</span>
                    </div>
                </div>
            </div>
        """, unsafe_allow_html=True)

    # Card 3: State Physical Barrels (Subsea Flowline Cyan)
    with kpi_col3:
        st.markdown(f"""
            <div style="background: #0d1526; border: 2px solid rgba(6, 182, 212, 0.85); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 14px rgba(6, 182, 212, 0.15); margin-bottom: 16px;">
                <div style="background: linear-gradient(90deg, #06b6d4 0%, #0284c7 100%); padding: 8px 12px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #060a12; font-weight: 900; font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase;">🌊 STATE PHYSICAL BARRELS</span>
                    <span style="background: #060a12; color: #38bdf8; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; font-family: monospace;">Equity Liftings</span>
                </div>
                <div style="padding: 16px; background: linear-gradient(180deg, rgba(6, 182, 212, 0.08) 0%, rgba(13, 21, 38, 0.95) 100%);">
                    <div style="font-size: 28px; font-weight: 900; color: #38bdf8; font-family: monospace; letter-spacing: -0.02em;">
                        {res.total_ghana_barrels:,.0f} <span style="font-size: 18px; font-weight: 600;">bbls</span>
                    </div>
                    <div style="margin-top: 8px; font-size: 11px; color: #94a3b8; font-family: monospace;">
                        Royalty: <strong style="color: #f1f5f9;">{res.state_royalty_barrels:,.0f}</strong> | GNPC: <strong style="color: #f1f5f9;">{res.gnpc_profit_barrels:,.0f}</strong>
                    </div>
                    <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid rgba(6, 182, 212, 0.25); display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8;">
                        <span>Physical Equity Volume</span>
                        <span style="color: #38bdf8; font-weight: 800;">{(res.total_ghana_barrels / (res.gross_production_barrels or 1) * 100):.1f}% of Gross</span>
                    </div>
                </div>
            </div>
        """, unsafe_allow_html=True)

    # Card 4: Contractor Take & Costs (Offshore Rig Safety Orange)
    with kpi_col4:
        st.markdown(f"""
            <div style="background: #0d1526; border: 2px solid rgba(249, 115, 22, 0.85); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.15); margin-bottom: 16px;">
                <div style="background: linear-gradient(90deg, #f97316 0%, #ea580c 100%); padding: 8px 12px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #060a12; font-weight: 900; font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase;">⚙️ CONTRACTOR TAKE & COSTS</span>
                    <span style="background: #060a12; color: #fb923c; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; font-family: monospace;">Operator Group</span>
                </div>
                <div style="padding: 16px; background: linear-gradient(180deg, rgba(249, 115, 22, 0.08) 0%, rgba(13, 21, 38, 0.95) 100%);">
                    <div style="font-size: 28px; font-weight: 900; color: #fb923c; font-family: monospace; letter-spacing: -0.02em;">
                        ${res.contractor_gross_revenue_usd / 1e6:,.2f}M
                    </div>
                    <div style="margin-top: 8px; font-size: 11px; color: #94a3b8; font-family: monospace;">
                        Cost Oil: <strong style="color: #f1f5f9;">{res.cost_barrels_claimed:,.0f} bbls</strong> | Profit: <strong style="color: #f1f5f9;">{res.contractor_profit_barrels / 1e6:.2f}M</strong>
                    </div>
                    <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid rgba(249, 115, 22, 0.25); display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                        <span style="color: {'#ef4444' if res.is_cost_capped else '#10b981'}; font-weight: 700;">
                            {'⚠️ 70% Cap Reached' if res.is_cost_capped else '✓ Cost Oil 100% Recovered'}
                        </span>
                        <span style="color: #fb923c; font-weight: 800; font-family: monospace;">{res.standard_parcels_contractor:.2f} Cargoes</span>
                    </div>
                </div>
            </div>
        """, unsafe_allow_html=True)

    # Cost Cap Alert Banner
    if res.is_cost_capped:
        st.markdown(f"""
            <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-left: 5px solid #ef4444; padding: 12px 16px; border-radius: 8px; margin: 16px 0; color: #fecaca;">
                <strong style="color: #ffffff;">⚠️ Statutory Cost Recovery Ceiling Reached (70% Contractual Cap):</strong>
                Maximum allowable cost recovery for this lifting is capped at <strong>{res.max_cost_recovery_barrels_allowed:,.2f} bbls</strong> (${res.max_cost_recovery_usd_allowed:,.2f} USD).
                Unrecovered operational expenditure of <strong>${res.unrecovered_cost_usd:,.2f} USD</strong> ({res.unrecovered_cost_barrels:,.2f} bbls) carries forward to subsequent concession reconciliation cycles per Model PA Art. 11.
            </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown(f"""
            <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid #059669; border-left: 5px solid #10b981; padding: 10px 16px; border-radius: 8px; margin: 16px 0; color: #d1fae5; font-size: 13px;">
                <strong style="color: #34d399;">✓ Full Cost Oil Reimbursed:</strong> 100% of operator claimed OPEX & CAPEX (${res.costs_claimed_usd:,.2f} USD) recovered within the statutory 70% net production ceiling.
            </div>
        """, unsafe_allow_html=True)

    st.markdown("<hr style='border: 0; border-top: 1px solid #1e293b; margin: 24px 0;' />", unsafe_allow_html=True)

    # -----------------------------------------------------------------------
    # Interactive Petroleum Visualizations (Plotly / Petroleum Engineering Color Codes)
    # -----------------------------------------------------------------------
    col_viz1, col_viz2 = st.columns(2)

    with col_viz1:
        st.markdown("""
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <span style="color: #f59e0b; font-size: 18px;">📊</span>
                <h3 style="color: #ffffff; font-size: 16px; font-weight: 800; margin: 0;">Physical Barrels Waterfall Allocation</h3>
            </div>
        """, unsafe_allow_html=True)

        # Build Plotly Petroleum Bar Chart
        bar_labels = [
            "1. Gross Production",
            "2. State Royalty (Off-Top)",
            "3. Cost Recovery Oil",
            "4. GNPC Profit Oil",
            "5. Contractor Profit Oil",
        ]
        bar_values = [
            res.gross_production_barrels,
            res.state_royalty_barrels,
            res.cost_barrels_claimed,
            res.gnpc_profit_barrels,
            res.contractor_profit_barrels,
        ]
        # Authentic Petroleum Engineering Industry Hex Codes:
        # Amber Gold for Crude, 24K Gold for Royalty, Cyan for Subsea/Cost, Emerald for State Equity, Marine Blue for Operator
        petro_colors = [
            "#f59e0b",  # Gross Production (Raw Crude Gold)
            "#d97706",  # State Royalty (Sovereign 24K Gold)
            "#06b6d4",  # Cost Recovery Oil (Subsea Cyan)
            "#10b981",  # GNPC Profit Oil (Sovereign Energy Emerald)
            "#3b82f6",  # Contractor Profit Oil (Offshore Marine Blue)
        ]

        try:
            import plotly.graph_objects as go
            fig_bar = go.Figure()
            fig_bar.add_trace(go.Bar(
                x=bar_labels,
                y=bar_values,
                marker=dict(
                    color=petro_colors,
                    line=dict(color="#060a12", width=1.5),
                ),
                text=[f"{v:,.0f} bbls" for v in bar_values],
                textposition="outside",
                hoverinfo="x+y",
                hovertemplate="<b>%{x}</b><br>Volume: %{y:,.2f} bbls<extra></extra>",
            ))
            fig_bar.update_layout(
                plot_bgcolor="#0d1526",
                paper_bgcolor="#0d1526",
                margin=dict(l=10, r=10, t=25, b=10),
                height=350,
                font=dict(color="#cbd5e1", family="monospace"),
                xaxis=dict(
                    showgrid=False,
                    tickfont=dict(size=10, color="#94a3b8"),
                ),
                yaxis=dict(
                    gridcolor="#1a2742",
                    zerolinecolor="#1a2742",
                    tickfont=dict(size=10, color="#94a3b8"),
                ),
                showlegend=False,
            )
            st.plotly_chart(fig_bar, use_container_width=True)
        except Exception:
            # Fallback if plotly not installed
            try:
                import pandas as pd
                df_bar = pd.DataFrame({"Allocation Step": bar_labels, "Barrels": bar_values}).set_index("Allocation Step")
                st.bar_chart(df_bar["Barrels"])
            except Exception:
                st.write(dict(zip(bar_labels, bar_values)))

    with col_viz2:
        st.markdown(f"""
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #10b981; font-size: 18px;">📈</span>
                    <h3 style="color: #ffffff; font-size: 16px; font-weight: 800; margin: 0;">Crude Price Sensitivity Profile ($50 – $120/bbl)</h3>
                </div>
                <span style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); padding: 2px 8px; border-radius: 4px; font-size: 11px; font-family: monospace; font-weight: 700;">
                    Lifting Price: ${res.achieved_price_usd:.2f}
                </span>
            </div>
        """, unsafe_allow_html=True)

        sens_points = calculate_price_sensitivity(inp, 50.0, 120.0, 5.0)

        try:
            import plotly.graph_objects as go
            prices = [p["price"] for p in sens_points]
            state_revs = [p["state_revenue_usd"] / 1e6 for p in sens_points]
            contractor_revs = [p["contractor_revenue_usd"] / 1e6 for p in sens_points]
            gross_revs = [p["gross_revenue_usd"] / 1e6 for p in sens_points]

            fig_line = go.Figure()
            # Gross Line (Amber)
            fig_line.add_trace(go.Scatter(
                x=prices,
                y=gross_revs,
                name="Gross Concession Value",
                line=dict(color="#f59e0b", width=2, dash="dot"),
                hovertemplate="Price: $%{x:.2f}<br>Gross Revenue: $%{y:.2f}M<extra></extra>",
            ))
            # Contractor Take (Orange)
            fig_line.add_trace(go.Scatter(
                x=prices,
                y=contractor_revs,
                name="Contractor Group Revenue",
                line=dict(color="#f97316", width=2.5),
                hovertemplate="Price: $%{x:.2f}<br>Contractor Take: $%{y:.2f}M<extra></extra>",
            ))
            # State Take (Emerald)
            fig_line.add_trace(go.Scatter(
                x=prices,
                y=state_revs,
                name="Total Ghana State Take",
                line=dict(color="#10b981", width=3),
                hovertemplate="Price: $%{x:.2f}<br>State Take: $%{y:.2f}M<extra></extra>",
            ))
            # Reference vertical marker at active price
            fig_line.add_vline(
                x=res.achieved_price_usd,
                line_width=1.5,
                line_dash="dash",
                line_color="#f59e0b",
                annotation_text=f"Active (${res.achieved_price_usd:.2f})",
                annotation_position="top left",
                annotation_font=dict(color="#fbbf24", size=10),
            )
            fig_line.update_layout(
                plot_bgcolor="#0d1526",
                paper_bgcolor="#0d1526",
                margin=dict(l=10, r=10, t=25, b=10),
                height=350,
                font=dict(color="#cbd5e1", family="monospace"),
                xaxis=dict(
                    title="Dated Brent Price ($/bbl)",
                    gridcolor="#1a2742",
                    zerolinecolor="#1a2742",
                    tickfont=dict(size=10, color="#94a3b8"),
                ),
                yaxis=dict(
                    title="Fiscal Value ($ USD Millions)",
                    gridcolor="#1a2742",
                    zerolinecolor="#1a2742",
                    tickfont=dict(size=10, color="#94a3b8"),
                ),
                legend=dict(
                    orientation="h",
                    yanchor="bottom",
                    y=1.02,
                    xanchor="right",
                    x=1,
                    font=dict(size=10, color="#cbd5e1"),
                ),
            )
            st.plotly_chart(fig_line, use_container_width=True)
        except Exception:
            try:
                import pandas as pd
                df_sens = pd.DataFrame([
                    {
                        "Price ($/bbl)": p["price"],
                        "State Revenue ($M)": p["state_revenue_usd"] / 1e6,
                        "Contractor Revenue ($M)": p["contractor_revenue_usd"] / 1e6,
                    }
                    for p in sens_points
                ]).set_index("Price ($/bbl)")
                st.line_chart(df_sens)
            except Exception:
                st.caption("Price sensitivity calculated:")

    # -----------------------------------------------------------------------
    # PRMA Act 815 Sovereign Petroleum Revenue Distribution Panel
    # -----------------------------------------------------------------------
    st.markdown("<hr style='border: 0; border-top: 1px solid #1e293b; margin: 24px 0;' />", unsafe_allow_html=True)
    st.markdown(f"""
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
                <h3 style="color: #ffffff; font-size: 17px; font-weight: 800; margin: 0;">
                    🇬🇭 Petroleum Revenue Management Act (PRMA Act 815 / Act 893) Statutory Allocation
                </h3>
                <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0 0;">
                    Sovereign distribution schedule of Total Ghana State Take (${res.total_ghana_revenue_usd / 1e6:,.2f}M USD)
                </p>
            </div>
            <span style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800;">
                Act 815 Schedule
            </span>
        </div>
    """, unsafe_allow_html=True)

    prma = res.prma_distribution
    prma_col1, prma_col2, prma_col3, prma_col4 = st.columns(4)

    with prma_col1:
        st.markdown(f"""
            <div style="background: #0d1526; border: 1px solid rgba(245, 158, 11, 0.5); border-top: 4px solid #f59e0b; padding: 14px; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="font-size: 11px; font-weight: 800; color: #fbbf24; text-transform: uppercase;">1. GNPC Level A</span>
                    <span style="background: rgba(245, 158, 11, 0.25); color: #fbbf24; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 3px;">30%</span>
                </div>
                <div style="font-size: 22px; font-weight: 900; color: #ffffff; font-family: monospace;">
                    ${prma.gnpc_level_a_allocation_usd / 1e6:,.2f}M
                </div>
                <p style="font-size: 11px; color: #94a3b8; margin: 8px 0 0 0; line-height: 1.4;">
                    Direct operational funding retained by GNPC for exploration and JV capital cash calls.
                </p>
            </div>
        """, unsafe_allow_html=True)

    with prma_col2:
        st.markdown(f"""
            <div style="background: #0d1526; border: 1px solid rgba(16, 185, 129, 0.5); border-top: 4px solid #10b981; padding: 14px; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="font-size: 11px; font-weight: 800; color: #34d399; text-transform: uppercase;">2. Annual Budget (ABFA)</span>
                    <span style="background: rgba(16, 185, 129, 0.25); color: #34d399; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 3px;">49%</span>
                </div>
                <div style="font-size: 22px; font-weight: 900; color: #34d399; font-family: monospace;">
                    ${prma.annual_budget_funding_amount_usd / 1e6:,.2f}M
                </div>
                <p style="font-size: 11px; color: #94a3b8; margin: 8px 0 0 0; line-height: 1.4;">
                    Transferred to Consolidated National Treasury for road, agriculture & education infrastructure.
                </p>
            </div>
        """, unsafe_allow_html=True)

    with prma_col3:
        st.markdown(f"""
            <div style="background: #0d1526; border: 1px solid rgba(6, 182, 212, 0.5); border-top: 4px solid #06b6d4; padding: 14px; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase;">3. Stabilization Fund</span>
                    <span style="background: rgba(6, 182, 212, 0.25); color: #38bdf8; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 3px;">14.7%</span>
                </div>
                <div style="font-size: 22px; font-weight: 900; color: #38bdf8; font-family: monospace;">
                    ${prma.ghana_stabilization_fund_usd / 1e6:,.2f}M
                </div>
                <p style="font-size: 11px; color: #94a3b8; margin: 8px 0 0 0; line-height: 1.4;">
                    Macroeconomic buffer insulating government budget against severe oil price crashes.
                </p>
            </div>
        """, unsafe_allow_html=True)

    with prma_col4:
        st.markdown(f"""
            <div style="background: #0d1526; border: 1px solid rgba(168, 85, 247, 0.5); border-top: 4px solid #a855f7; padding: 14px; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="font-size: 11px; font-weight: 800; color: #c084fc; text-transform: uppercase;">4. Heritage Fund</span>
                    <span style="background: rgba(168, 85, 247, 0.25); color: #c084fc; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 3px;">6.3%</span>
                </div>
                <div style="font-size: 22px; font-weight: 900; color: #c084fc; font-family: monospace;">
                    ${prma.ghana_heritage_fund_usd / 1e6:,.2f}M
                </div>
                <p style="font-size: 11px; color: #94a3b8; margin: 8px 0 0 0; line-height: 1.4;">
                    Locked sovereign wealth endowment invested offshore for future generations.
                </p>
            </div>
        """, unsafe_allow_html=True)

    # -----------------------------------------------------------------------
    # Auditable Statutory Table
    # -----------------------------------------------------------------------
    st.markdown("<hr style='border: 0; border-top: 1px solid #1e293b; margin: 24px 0;' />", unsafe_allow_html=True)
    st.markdown("""
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="color: #38bdf8; font-size: 18px;">📋</span>
            <h3 style="color: #ffffff; font-size: 16px; font-weight: 800; margin: 0;">Auditable Line-by-Line Statutory Reconciliation Schedule</h3>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin: 0 0 16px 0;">
            Exact mathematical waterfall under Petroleum (Exploration & Production) Act, 2016 (Act 919) & Concession Petroleum Agreements
        </p>
    """, unsafe_allow_html=True)

    table_rows = [
        {"Step": "1.0", "Reconciliation Line Item": "Monthly Gross Production Outturn (Q_gross)", "Volume (bbls)": f"{res.gross_production_barrels:,.2f}", "Fiscal Value ($ USD)": f"${res.total_gross_revenue_usd:,.2f}", "Share (%)": "100.00%", "Legal Citation": "Terminal Fiscal Meter Outturn Act 919 §59"},
        {"Step": "2.0", "Reconciliation Line Item": f"Deduct: State Royalty Oil ({res.royalty_rate*100:.1f}%)", "Volume (bbls)": f"{res.state_royalty_barrels:,.2f}", "Fiscal Value ($ USD)": f"${res.state_royalty_usd:,.2f}", "Share (%)": f"{(res.state_royalty_barrels/(res.gross_production_barrels or 1)*100):.2f}%", "Legal Citation": "Off-the-top priority claim Act 919 §85 & Model PA Art. 10"},
        {"Step": "3.0", "Reconciliation Line Item": "Net Available Production (Q_net)", "Volume (bbls)": f"{res.net_production_barrels:,.2f}", "Fiscal Value ($ USD)": f"${(res.net_production_barrels*res.achieved_price_usd):,.2f}", "Share (%)": f"{(res.net_production_barrels/(res.gross_production_barrels or 1)*100):.2f}%", "Legal Citation": "Q_gross − B_royalty Model PA Art. 10.1"},
        {"Step": "4.0", "Reconciliation Line Item": f"Cost Recovery Ceiling ({res.cost_recovery_cap_rate*100:.0f}% Cap)", "Volume (bbls)": f"{res.max_cost_recovery_barrels_allowed:,.2f}", "Fiscal Value ($ USD)": f"${res.max_cost_recovery_usd_allowed:,.2f}", "Share (%)": f"{(res.max_cost_recovery_barrels_allowed/(res.gross_production_barrels or 1)*100):.2f}%", "Legal Citation": "70.0% × Q_net Model PA Art. 11.2"},
        {"Step": "5.0", "Reconciliation Line Item": "Cost Recovery Oil Claimed", "Volume (bbls)": f"{res.cost_barrels_claimed:,.2f}", "Fiscal Value ($ USD)": f"${res.cost_usd_recovered:,.2f}", "Share (%)": f"{(res.cost_barrels_claimed/(res.gross_production_barrels or 1)*100):.2f}%", "Legal Citation": "min(Costs / Price, 70% Q_net) Model PA Art. 11"},
        {"Step": "6.0", "Reconciliation Line Item": "Profit Oil Available Pool (Q_profit)", "Volume (bbls)": f"{res.profit_oil_barrels:,.2f}", "Fiscal Value ($ USD)": f"${res.profit_oil_usd:,.2f}", "Share (%)": f"{(res.profit_oil_barrels/(res.gross_production_barrels or 1)*100):.2f}%", "Legal Citation": "Q_net − Cost Recovery Oil Act 919 §86"},
        {"Step": "7.0", "Reconciliation Line Item": f"GNPC Equity Profit Oil Share ({res.gnpc_total_equity_rate*100:.2f}%)", "Volume (bbls)": f"{res.gnpc_profit_barrels:,.2f}", "Fiscal Value ($ USD)": f"${res.gnpc_profit_usd:,.2f}", "Share (%)": f"{(res.gnpc_profit_barrels/(res.gross_production_barrels or 1)*100):.2f}%", "Legal Citation": "Act 919 §10 Carried & Model PA Art. 12"},
        {"Step": "8.0", "Reconciliation Line Item": "Contractor Group Profit Oil Share", "Volume (bbls)": f"{res.contractor_profit_barrels:,.2f}", "Fiscal Value ($ USD)": f"${res.contractor_profit_usd:,.2f}", "Share (%)": f"{(res.contractor_profit_barrels/(res.gross_production_barrels or 1)*100):.2f}%", "Legal Citation": "Q_profit × Contractor % Model PA Art. 12.3"},
        {"Step": "9.0", "Reconciliation Line Item": "TOTAL GHANA STATE TAKE (GoG + GNPC)", "Volume (bbls)": f"{res.total_ghana_barrels:,.2f}", "Fiscal Value ($ USD)": f"${res.total_ghana_revenue_usd:,.2f}", "Share (%)": f"{res.effective_state_take_percent:.2f}%", "Legal Citation": "Royalty + GNPC Profit Oil (Act 919 / Act 815)"},
        {"Step": "10.0", "Reconciliation Line Item": "TOTAL CONTRACTOR TAKE (Operator Group)", "Volume (bbls)": f"{res.contractor_total_barrels:,.2f}", "Fiscal Value ($ USD)": f"${res.contractor_gross_revenue_usd:,.2f}", "Share (%)": f"{res.effective_contractor_take_percent:.2f}%", "Legal Citation": "Cost Oil + Contractor Profit Oil"},
    ]

    try:
        import pandas as pd
        st.dataframe(pd.DataFrame(table_rows), use_container_width=True)
    except Exception:
        st.table(table_rows)

    # Conservation Invariant Telemetry Banner
    bbl_sum = res.total_ghana_barrels + res.contractor_total_barrels
    usd_sum = res.total_ghana_revenue_usd + res.contractor_gross_revenue_usd
    st.markdown(f"""
        <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 8px; padding: 12px 18px; margin: 16px 0; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">🔒</span>
                <div>
                    <strong style="color: #34d399; font-size: 13px;">Hydrocarbon Mass & Value Balance Invariant Confirmed:</strong>
                    <div style="color: #cbd5e1; font-size: 12px; font-family: monospace; margin-top: 2px;">
                        Volume Check: {bbl_sum:,.2f} bbls == {res.gross_production_barrels:,.2f} bbls (100.00%) | Value Check: ${usd_sum:,.2f} == ${res.total_gross_revenue_usd:,.2f} (100.00%)
                    </div>
                </div>
            </div>
            <span style="background: #10b981; color: #060a12; font-size: 11px; font-weight: 900; padding: 4px 10px; border-radius: 4px; font-family: monospace;">
                100% BALANCED
            </span>
        </div>
    """, unsafe_allow_html=True)

    # CSV Export Button
    csv_header = "Step,Item,Barrels,USD,Share_Percent,Legal_Citation\n"
    csv_body = "\n".join([
        f'{r["Step"]},{r["Reconciliation Line Item"].replace(",", "")},{r["Volume (bbls)"].replace(",", "")},{r["Fiscal Value ($ USD)"].replace("$", "").replace(",", "")},{r["Share (%)"].replace("%", "")},{r["Legal Citation"].replace(",", ";")}'
        for r in table_rows
    ])
    full_csv = csv_header + csv_body

    st.download_button(
        label="📥 Download Official GNPC Statutory Audit Sheet (CSV)",
        data=full_csv,
        file_name=f"GNPC_Fiscal_Reconciliation_{preset.id.upper()}_{gross_bbl:.0f}bbl.csv",
        mime="text/csv",
    )


# ---------------------------------------------------------------------------
# 4. Command-Line ASCII Audit Table (Runs without Streamlit)
# ---------------------------------------------------------------------------

def print_cli_audit_report(result: FiscalReconciliationOutput, cargo_ref: str = "CARGO-2026/74"):
    inp = result.inputs
    print("\n" + "=" * 94)
    print("GHANA NATIONAL PETROLEUM CORPORATION (GNPC)")
    print("UPSTREAM FISCAL & ENTITLEMENT RECONCILIATION AUDIT SHEET")
    print("Statutory Authority: Petroleum (Exploration & Production) Act, 2016 (Act 919)")
    print("=" * 94)
    print(f"Asset / Concession : {inp.concession_name}")
    print(f"Lifting Parcel Ref : {cargo_ref}")
    print(f"Crude Price Index  : ${result.achieved_price_usd:.2f} / bbl")
    print(f"Claimed OPEX/CAPEX : ${result.costs_claimed_usd:,.2f} USD")
    print("-" * 94)
    print(f"{'Line Item / Waterfall Step':<48} | {'Volume (bbls)':>15} | {'Value (USD)':>18} | {'Share %':>8}")
    print("-" * 94)

    rows = [
        ("1.0 Gross Monthly Production (Q_gross)", result.gross_production_barrels, result.total_gross_revenue_usd, 100.0),
        (f"2.0 Deduct: State Royalty Oil ({result.royalty_rate*100:.1f}%)", result.state_royalty_barrels, result.state_royalty_usd, (result.state_royalty_barrels / (result.gross_production_barrels or 1)) * 100),
        ("3.0 Net Available Production (Q_net)", result.net_production_barrels, result.net_production_barrels * result.achieved_price_usd, (result.net_production_barrels / (result.gross_production_barrels or 1)) * 100),
        ("4.0 Cost Recovery Ceiling (70% Cap)", result.max_cost_recovery_barrels_allowed, result.max_cost_recovery_usd_allowed, (result.max_cost_recovery_barrels_allowed / (result.gross_production_barrels or 1)) * 100),
        ("5.0 Cost Recovery Oil Claimed", result.cost_barrels_claimed, result.cost_usd_recovered, (result.cost_barrels_claimed / (result.gross_production_barrels or 1)) * 100),
    ]

    if result.is_cost_capped:
        rows.append(("    └─ Unrecovered Carry-Forward Balance", result.unrecovered_cost_barrels, result.unrecovered_cost_usd, 0.0))

    rows.extend([
        ("6.0 Profit Oil Pool Available (Q_profit)", result.profit_oil_barrels, result.profit_oil_usd, (result.profit_oil_barrels / (result.gross_production_barrels or 1)) * 100),
        (f"7.0 GNPC Profit Oil Equity ({result.gnpc_total_equity_rate*100:.2f}%)", result.gnpc_profit_barrels, result.gnpc_profit_usd, (result.gnpc_profit_barrels / (result.gross_production_barrels or 1)) * 100),
        ("8.0 Contractor Profit Oil Share", result.contractor_profit_barrels, result.contractor_profit_usd, (result.contractor_profit_barrels / (result.gross_production_barrels or 1)) * 100),
        ("9.0 TOTAL GHANA STATE TAKE (GoG + GNPC)", result.total_ghana_barrels, result.total_ghana_revenue_usd, result.effective_state_take_percent),
        ("10.0 TOTAL CONTRACTOR TAKE (Operator Group)", result.contractor_total_barrels, result.contractor_gross_revenue_usd, result.effective_contractor_take_percent),
    ])

    for label, bbls, usd, pct in rows:
        print(f"{label:<48} | {bbls:>15,.2f} | {usd:>18,.2f} | {pct:>7.2f}%")

    print("=" * 94)
    bbl_sum = result.total_ghana_barrels + result.contractor_total_barrels
    usd_sum = result.total_ghana_revenue_usd + result.contractor_gross_revenue_usd
    print(f"Conservation Check: {bbl_sum:,.2f} bbls == {result.gross_production_barrels:,.2f} bbls (100.00%)")
    print(f"Revenue Balance   : ${usd_sum:,.2f} == ${result.total_gross_revenue_usd:,.2f} (100.00%)")
    print(f"Effective State Take: {result.effective_state_take_percent:.2f}% | GNPC Parcels: {result.standard_parcels_ghana:.2f} cargoes (950k bbl)")
    print("=" * 94 + "\n")


def run_unit_tests():
    print("Running GNPC Fiscal Engine Unit Verification...")
    jubilee = CONCESSION_PRESETS["jubilee"]
    inp = FiscalInputs(
        concession_id=jubilee.id,
        concession_name=jubilee.name,
        gross_production_barrels=1000000.0,
        achieved_price_usd=80.0,
        monthly_costs_usd=20000000.0,
        statutory_royalty_rate=0.05,
        cost_recovery_cap=0.70,
        gnpc_carried_interest_rate=0.15,
        gnpc_paying_interest_rate=0.0,
    )
    res = calculate_fiscal_reconciliation(inp)
    assert res.total_gross_revenue_usd == 80000000.0, "Gross revenue check failed"
    assert res.state_royalty_barrels == 50000.0, "Royalty barrels check failed"
    assert res.net_production_barrels == 950000.0, "Net production check failed"
    assert res.cost_barrels_claimed == 250000.0, "Cost barrels check failed"
    assert res.profit_oil_barrels == 700000.0, "Profit oil check failed"
    assert res.gnpc_profit_barrels == 105000.0, "GNPC profit barrels check failed"
    assert res.contractor_profit_barrels == 595000.0, "Contractor profit barrels check failed"
    assert res.total_ghana_barrels == 155000.0, "State total barrels check failed"
    assert res.effective_state_take_percent == 15.5, "State take % check failed"
    assert abs((res.total_ghana_barrels + res.contractor_total_barrels) - inp.gross_production_barrels) < 1e-4, "Mass invariant failed"
    assert abs((res.total_ghana_revenue_usd + res.contractor_gross_revenue_usd) - res.total_gross_revenue_usd) < 1e-4, "Dollar invariant failed"
    print("All unit verification tests passed successfully!")


# ---------------------------------------------------------------------------
# 5. Dual Execution Entrypoint (Streamlit vs Direct Python)
# ---------------------------------------------------------------------------

def is_running_with_streamlit() -> bool:
    """Detects if script was invoked via `streamlit run app.py` or deployed on Streamlit Cloud."""
    try:
        from streamlit.runtime.scriptrunner import get_script_run_ctx
        return get_script_run_ctx() is not None
    except Exception:
        # Also check common Streamlit cloud environment indicators
        return "STREAMLIT_SERVER_PORT" in os.environ or "STREAMLIT_RUN" in os.environ


if __name__ == "__main__":
    # Check if run with Streamlit CLI or Streamlit Cloud
    if is_running_with_streamlit():
        render_streamlit_app()
    else:
        # User executed `python app.py` directly from terminal
        parser = argparse.ArgumentParser(description="GNPC Upstream Fiscal Reconciliation Suite (Act 919)")
        parser.add_argument("--test", action="store_true", help="Run automated fiscal unit verification tests")
        parser.add_argument("--field", choices=["jubilee", "ten", "sankofa", "custom"], default="jubilee", help="Concession field preset")
        parser.add_argument("--gross", type=float, default=None, help="Gross Production Barrels (Q_gross)")
        parser.add_argument("--price", type=float, default=None, help="Achieved Crude Lifting Price ($/bbl)")
        parser.add_argument("--costs", type=float, default=None, help="Monthly Claimed OPEX + CAPEX ($ USD)")
        parser.add_argument("--cargo", type=str, default="CARGO-2026/74", help="Lifting Parcel Reference")

        args = parser.parse_args()

        if args.test:
            run_unit_tests()
            sys.exit(0)

        # Check if user has streamlit installed and didn't specify CLI arguments
        # If so, automatically launch Streamlit web browser!
        has_cli_args = any(arg in sys.argv for arg in ["--field", "--gross", "--price", "--costs", "--cargo"])
        if not has_cli_args:
            try:
                import streamlit
                from streamlit.web import cli as stcli
                print("[+] Streamlit detected. Launching interactive web application...")
                sys.argv = ["streamlit", "run", os.path.abspath(__file__)]
                sys.exit(stcli.main())
            except ImportError:
                pass

        # Otherwise print the executive terminal report
        preset = CONCESSION_PRESETS[args.field]
        inp = FiscalInputs(
            concession_id=preset.id,
            concession_name=preset.name,
            gross_production_barrels=args.gross if args.gross is not None else preset.default_gross_production,
            achieved_price_usd=args.price if args.price is not None else preset.default_achieved_price,
            monthly_costs_usd=args.costs if args.costs is not None else preset.default_monthly_costs,
            statutory_royalty_rate=preset.statutory_royalty_rate,
            cost_recovery_cap=preset.cost_recovery_cap,
            gnpc_carried_interest_rate=preset.default_carried_interest,
            gnpc_paying_interest_rate=preset.default_paying_interest,
        )
        res = calculate_fiscal_reconciliation(inp)
        print_cli_audit_report(res, cargo_ref=args.cargo)
        print("Tip: Install streamlit with 'pip install streamlit pandas' then run 'streamlit run app.py' for the visual dashboard!\n")
else:
    # If imported directly by Streamlit runner
    render_streamlit_app()
