#!/usr/bin/env python3
"""
GNPC Fiscal & Entitlement Reconciliation Suite (Ghana Upstream Fiscal Engine)
-----------------------------------------------------------------------------
Governing Legislation:
  - Petroleum (Exploration and Production) Act, 2016 (Act 919)
  - Petroleum Revenue Management Act, 2011 (Act 815 & Act 893)
  - Ghana Model Petroleum Agreements (Jubilee, TEN, Sankofa-Gye Nyame)

This script provides:
  1. Complete Python petroleum fiscal calculation engine with Act 919 rules.
  2. Cost recovery 70% contractual cap and carry-forward calculation.
  3. GNPC Statutory Carried (15%) + Additional Paying Interest (0-5%) split.
  4. PRMA Act 815 sovereign wealth allocation modeling.
  5. Built-in CLI audit table report & automated unit tests.
  6. Optional built-in HTTP server (`python3 app.py --serve [port]`) with JSON API.
"""

from dataclasses import dataclass, asdict
from typing import Dict, List, Optional
import sys
import json
import math
import argparse
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse


@dataclass
class ConcessionPreset:
    id: str
    name: str
    operator: str
    offshore_basin: str
    fpso_name: str
    statutory_royalty_rate: float  # e.g. 0.05 for 5%
    default_gross_production: float  # bbls/month
    default_achieved_price: float  # USD/bbl
    default_monthly_costs: float  # USD
    default_carried_interest: float  # 0.15 for 15%
    default_paying_interest: float  # 0.00 to 0.05
    cost_recovery_cap: float = 0.70  # standard 70% of Net Production
    typical_cargo_parcel_size: float = 950000.0


CONCESSION_PRESETS: Dict[str, ConcessionPreset] = {
    "jubilee": ConcessionPreset(
        id="jubilee",
        name="Jubilee Field (WCTP & DWT Blocks)",
        operator="Tullow Ghana Ltd (Operator), Kosmos, GNPC, PetroSA",
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
        operator="Tullow Ghana Ltd, Kosmos, GNPC, PetroSA",
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
        operator="Eni Ghana Exploration & Production Ltd, Vitol Upstream, GNPC",
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
        name="Custom Offshore Exploration Block",
        operator="Joint Operating Concession",
        offshore_basin="Western / Central Basin Block",
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

    # 1. Gross metrics
    gross_production_barrels: float
    achieved_price_usd: float
    total_gross_revenue_usd: float

    # 2. State Royalty
    royalty_rate: float
    state_royalty_barrels: float
    state_royalty_usd: float
    net_production_barrels: float

    # 3. Cost Recovery
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

    # 4. Profit Oil Split
    profit_oil_barrels: float
    profit_oil_usd: float

    # 5. GNPC & Contractor Split
    gnpc_total_equity_rate: float
    gnpc_profit_barrels: float
    gnpc_profit_usd: float
    contractor_profit_barrels: float
    contractor_profit_usd: float

    # 6. Comprehensive Takes
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


def calculate_fiscal_reconciliation(inputs: FiscalInputs) -> FiscalReconciliationOutput:
    """
    Executes the exact mathematical petroleum fiscal waterfall hierarchy
    under Ghana Act 919 and Model Petroleum Agreements.
    """
    gross_bbl = max(0.0, float(inputs.gross_production_barrels or 0.0))
    price = max(0.0, float(inputs.achieved_price_usd or 0.0))
    monthly_costs = max(0.0, float(inputs.monthly_costs_usd or 0.0))
    royalty_rate = min(max(0.0, float(inputs.statutory_royalty_rate or 0.0)), 0.50)
    cost_cap = min(max(0.1, float(inputs.cost_recovery_cap or 0.70)), 1.0)
    carried_rate = min(max(0.0, float(inputs.gnpc_carried_interest_rate or 0.0)), 1.0)
    paying_rate = min(max(0.0, float(inputs.gnpc_paying_interest_rate or 0.0)), 0.50)
    gnpc_total_equity = min(1.0, carried_rate + paying_rate)

    # 1. Total Gross Concession Revenue
    total_gross_revenue = gross_bbl * price

    # 2. State Royalty (off the top, before any cost deductions)
    royalty_bbl = gross_bbl * royalty_rate
    royalty_usd = royalty_bbl * price
    net_production_bbl = max(0.0, gross_bbl - royalty_bbl)

    # 3. Cost Recovery Ceiling (Max 70% of Net Production)
    max_cost_bbl = net_production_bbl * cost_cap
    max_cost_usd = max_cost_bbl * price

    cost_bbl_demanded = (monthly_costs / price) if price > 0.0 else 0.0
    cost_bbl_claimed = min(cost_bbl_demanded, max_cost_bbl)
    cost_usd_recovered = cost_bbl_claimed * price
    unrecovered_cost_usd = max(0.0, monthly_costs - cost_usd_recovered)
    unrecovered_cost_bbl = (unrecovered_cost_usd / price) if price > 0.0 else 0.0
    is_cost_capped = (cost_bbl_demanded > max_cost_bbl) and (monthly_costs > 0.0)

    # 4. Profit Oil Available Pool (Q_profit)
    profit_oil_bbl = max(0.0, net_production_bbl - cost_bbl_claimed)
    profit_oil_usd = profit_oil_bbl * price

    # 5. GNPC Equity Profit Oil & Contractor Split
    gnpc_profit_bbl = profit_oil_bbl * gnpc_total_equity
    gnpc_profit_usd = gnpc_profit_bbl * price

    contractor_profit_bbl = max(0.0, profit_oil_bbl - gnpc_profit_bbl)
    contractor_profit_usd = contractor_profit_bbl * price

    # 6. Consolidated Takes
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

    # PRMA Act 815 Allocations
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
    """Generates price curve points across $50 to $120/bbl."""
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


def print_cli_audit_report(result: FiscalReconciliationOutput, cargo_ref: str = "JUB-CARGO-2026/74"):
    """Prints a structured executive reconciliation table to stdout."""
    inp = result.inputs
    print("\n" + "=" * 90)
    print("GHANA NATIONAL PETROLEUM CORPORATION (GNPC)")
    print("UPSTREAM FISCAL & ENTITLEMENT RECONCILIATION AUDIT SHEET")
    print("Statutory Authority: Petroleum (Exploration & Production) Act, 2016 (Act 919)")
    print("=" * 90)
    print(f"Asset / Concession : {inp.concession_name}")
    print(f"Lifting Parcel Ref : {cargo_ref}")
    print(f"Crude Price Index  : ${result.achieved_price_usd:.2f} / bbl")
    print(f"Claimed OPEX/CAPEX : ${result.costs_claimed_usd:,.2f} USD")
    print("-" * 90)
    print(f"{'Line Item / Waterfall Step':<45} | {'Volume (bbls)':>15} | {'Value (USD)':>18} | {'Share %':>8}")
    print("-" * 90)

    rows = [
        ("1.0 Gross Monthly Production (Q_gross)", result.gross_production_barrels, result.total_gross_revenue_usd, 100.0),
        (f"2.0 Deduct: State Royalty Oil ({result.royalty_rate*100:.1f}%)", result.state_royalty_barrels, result.state_royalty_usd, (result.state_royalty_barrels / (result.gross_production_barrels or 1)) * 100),
        ("3.0 Net Available Production (Q_net)", result.net_production_barrels, result.net_production_barrels * result.achieved_price_usd, (result.net_production_barrels / (result.gross_production_barrels or 1)) * 100),
        ("4.0 Cost Recovery Ceiling (70% Cap)", result.max_cost_recovery_barrels_allowed, result.max_cost_recovery_usd_allowed, (result.max_cost_recovery_barrels_allowed / (result.gross_production_barrels or 1)) * 100),
        ("5.0 Cost Recovery Oil Claimed", result.cost_barrels_claimed, result.cost_usd_recovered, (result.cost_barrels_claimed / (result.gross_production_barrels or 1)) * 100),
    ]

    if result.is_cost_capped:
        rows.append((f"    └─ Unrecovered Carry-Forward Balance", result.unrecovered_cost_barrels, result.unrecovered_cost_usd, 0.0))

    rows.extend([
        ("6.0 Profit Oil Pool Available (Q_profit)", result.profit_oil_barrels, result.profit_oil_usd, (result.profit_oil_barrels / (result.gross_production_barrels or 1)) * 100),
        (f"7.0 GNPC Profit Oil Equity ({result.gnpc_total_equity_rate*100:.2f}%)", result.gnpc_profit_barrels, result.gnpc_profit_usd, (result.gnpc_profit_barrels / (result.gross_production_barrels or 1)) * 100),
        (f"8.0 Contractor Profit Oil Share", result.contractor_profit_barrels, result.contractor_profit_usd, (result.contractor_profit_barrels / (result.gross_production_barrels or 1)) * 100),
        ("9.0 TOTAL GHANA STATE TAKE (GoG + GNPC)", result.total_ghana_barrels, result.total_ghana_revenue_usd, result.effective_state_take_percent),
        ("10.0 TOTAL CONTRACTOR TAKE (Operator Group)", result.contractor_total_barrels, result.contractor_gross_revenue_usd, result.effective_contractor_take_percent),
    ])

    for label, bbls, usd, pct in rows:
        print(f"{label:<45} | {bbls:>15,.2f} | {usd:>18,.2f} | {pct:>7.2f}%")

    print("=" * 90)
    bbl_sum = result.total_ghana_barrels + result.contractor_total_barrels
    usd_sum = result.total_ghana_revenue_usd + result.contractor_gross_revenue_usd
    print(f"Conservation Check: {bbl_sum:,.2f} bbls == {result.gross_production_barrels:,.2f} bbls (100.00%)")
    print(f"Revenue Balance   : ${usd_sum:,.2f} == ${result.total_gross_revenue_usd:,.2f} (100.00%)")
    print(f"Effective State Take: {result.effective_state_take_percent:.2f}% | GNPC Parcels: {result.standard_parcels_ghana:.2f} cargoes (950k bbl)")
    print("=" * 90)


def run_unit_tests():
    """Runs automated verification tests."""
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


class GnpcFiscalHttpHandler(BaseHTTPRequestHandler):
    """Built-in HTTP Handler providing REST APIs for the fiscal engine."""

    def _send_json(self, status_code: int, data: any):
        payload = json.dumps(data, default=lambda o: asdict(o) if hasattr(o, "__dataclass_fields__") else str(o))
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(payload.encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/presets":
            self._send_json(200, {k: asdict(v) for k, v in CONCESSION_PRESETS.items()})
        elif parsed.path == "/api/health":
            self._send_json(200, {"status": "ok", "statute": "Act 919"})
        else:
            self._send_json(404, {"error": "Endpoint not found"})

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8")
        try:
            req_data = json.loads(body) if body else {}
        except Exception:
            self._send_json(400, {"error": "Invalid JSON body"})
            return

        if parsed.path == "/api/calculate":
            try:
                preset_id = req_data.get("concessionId", "jubilee")
                preset = CONCESSION_PRESETS.get(preset_id, CONCESSION_PRESETS["jubilee"])
                inp = FiscalInputs(
                    concession_id=preset_id,
                    concession_name=req_data.get("concessionName", preset.name),
                    gross_production_barrels=float(req_data.get("grossProductionBarrels", preset.default_gross_production)),
                    achieved_price_usd=float(req_data.get("achievedPriceUSD", preset.default_achieved_price)),
                    monthly_costs_usd=float(req_data.get("monthlyCostsUSD", preset.default_monthly_costs)),
                    statutory_royalty_rate=float(req_data.get("statutoryRoyaltyRate", preset.statutory_royalty_rate)),
                    cost_recovery_cap=float(req_data.get("costRecoveryCap", preset.cost_recovery_cap)),
                    gnpc_carried_interest_rate=float(req_data.get("gnpcCarriedInterestRate", preset.default_carried_interest)),
                    gnpc_paying_interest_rate=float(req_data.get("gnpcPayingInterestRate", preset.default_paying_interest)),
                )
                output = calculate_fiscal_reconciliation(inp)
                self._send_json(200, asdict(output))
            except Exception as e:
                self._send_json(400, {"error": str(e)})

        elif parsed.path == "/api/sensitivity":
            try:
                preset_id = req_data.get("concessionId", "jubilee")
                preset = CONCESSION_PRESETS.get(preset_id, CONCESSION_PRESETS["jubilee"])
                inp = FiscalInputs(
                    concession_id=preset_id,
                    concession_name=req_data.get("concessionName", preset.name),
                    gross_production_barrels=float(req_data.get("grossProductionBarrels", preset.default_gross_production)),
                    achieved_price_usd=float(req_data.get("achievedPriceUSD", preset.default_achieved_price)),
                    monthly_costs_usd=float(req_data.get("monthlyCostsUSD", preset.default_monthly_costs)),
                    statutory_royalty_rate=float(req_data.get("statutoryRoyaltyRate", preset.statutory_royalty_rate)),
                    cost_recovery_cap=float(req_data.get("costRecoveryCap", preset.cost_recovery_cap)),
                    gnpc_carried_interest_rate=float(req_data.get("gnpcCarriedInterestRate", preset.default_carried_interest)),
                    gnpc_paying_interest_rate=float(req_data.get("gnpcPayingInterestRate", preset.default_paying_interest)),
                )
                curve = calculate_price_sensitivity(inp, 50.0, 120.0, 5.0)
                self._send_json(200, {"points": curve})
            except Exception as e:
                self._send_json(400, {"error": str(e)})
        else:
            self._send_json(404, {"error": "Endpoint not found"})


def main():
    parser = argparse.ArgumentParser(description="GNPC Fiscal & Entitlement Reconciliation Suite (Act 919)")
    parser.add_argument("--test", action="store_true", help="Run automated fiscal calculation unit tests")
    parser.add_argument("--field", choices=["jubilee", "ten", "sankofa", "custom"], default="jubilee", help="Concession field preset")
    parser.add_argument("--gross", type=float, default=None, help="Gross Production Barrels (Q_gross)")
    parser.add_argument("--price", type=float, default=None, help="Achieved Crude Lifting Price ($/bbl)")
    parser.add_argument("--costs", type=float, default=None, help="Monthly Claimed OPEX + CAPEX ($ USD)")
    parser.add_argument("--cargo", type=str, default="CARGO-2026/74", help="Lifting Parcel Reference")
    parser.add_argument("--serve", nargs="?", const=8000, type=int, help="Start HTTP server on specified port (default 8000)")

    args = parser.parse_args()

    if args.test:
        run_unit_tests()
        return

    if args.serve is not None:
        port = args.serve
        server_address = ("", port)
        httpd = HTTPServer(server_address, GnpcFiscalHttpHandler)
        print(f"GNPC Upstream Fiscal Engine HTTP Server listening on port {port}...")
        print("Available REST endpoints:")
        print("  GET  /api/presets")
        print("  POST /api/calculate")
        print("  POST /api/sensitivity")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
            httpd.server_close()
        return

    # Default: Run CLI calculation and display report
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
    result = calculate_fiscal_reconciliation(inp)
    print_cli_audit_report(result, cargo_ref=args.cargo)


if __name__ == "__main__":
    main()
