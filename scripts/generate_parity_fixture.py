"""Generates the ground truth for the JS-aggregator parity test: runs real SQL
directly against fact_sales (bypassing monthly.json entirely) for 24 sampled
filter combinations, so site/src/lib/aggregate.ts's in-browser JS aggregation
over monthly.json can be checked against an independent SQL computation
(same idea as PREDICTIVE's ONNX-vs-sklearn parity test and QUERYMIND's
Pyodide-vs-backend parity test). Run after dbt run/test.
"""
from __future__ import annotations

import itertools
import json
import random
from pathlib import Path

import duckdb

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "db" / "signalroom.duckdb"
OUT = ROOT / "site" / "src" / "lib" / "__fixtures__"

REGIONS = ["Northeast", "Southeast", "Midwest", "Southwest", "West"]
CATEGORIES = ["Apparel", "Footwear", "Accessories", "Home"]
CHANNELS = ["online", "in_store"]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect(str(DB), read_only=True)
    rng = random.Random(7)

    all_combos = []
    for n_regions in (0, 1, 2, 5):
        for n_cats in (0, 1, 2, 4):
            for n_channels in (0, 1, 2):
                all_combos.append((n_regions, n_cats, n_channels))
    sampled = rng.sample(all_combos, min(24, len(all_combos)))

    cases = []
    for n_regions, n_cats, n_channels in sampled:
        regions = rng.sample(REGIONS, n_regions) if n_regions else []
        cats = rng.sample(CATEGORIES, n_cats) if n_cats else []
        chans = rng.sample(CHANNELS, n_channels) if n_channels else []

        where = []
        params = []
        if regions:
            where.append(f"d.region_name in ({','.join(['?'] * len(regions))})")
            params += regions
        if cats:
            where.append(f"p.category in ({','.join(['?'] * len(cats))})")
            params += cats
        if chans:
            where.append(f"f.channel in ({','.join(['?'] * len(chans))})")
            params += chans
        where_sql = f"where {' and '.join(where)}" if where else ""

        # Additive measures: sliced by region/category/channel, matching monthly.json.
        sql = f"""
            select
                sum(f.net_revenue) as net_revenue,
                sum(f.gross_revenue) as gross_revenue,
                sum(f.discount_amount) as discount_amount,
                sum(f.cogs) as cogs,
                sum(case when f.status = 'completed' then f.quantity else 0 end) as units
            from fact_sales f
            join dim_product p on f.product_id = p.product_id
            left join dim_customer d on f.customer_id = d.customer_id
            {where_sql}
        """
        net_revenue, gross_revenue, discount_amount, cogs, units = con.execute(sql, params).fetchone()
        margin = net_revenue - cogs

        # Order-level measures: region/channel ONLY (never category -- see
        # docs/metrics.md on why a per-category order count isn't well-defined).
        orders_where = []
        orders_params = []
        if regions:
            orders_where.append(f"d.region_name in ({','.join(['?'] * len(regions))})")
            orders_params += regions
        if chans:
            orders_where.append(f"f.channel in ({','.join(['?'] * len(chans))})")
            orders_params += chans
        orders_where_sql = f"where {' and '.join(orders_where)}" if orders_where else ""
        orders_sql = f"""
            select
                count(distinct case when f.status = 'completed' then f.order_id end) as completed_orders,
                sum(case when f.status = 'completed' then f.net_revenue else 0 end) as completed_net_revenue
            from fact_sales f
            left join dim_customer d on f.customer_id = d.customer_id
            {orders_where_sql}
        """
        completed_orders, completed_net_revenue = con.execute(orders_sql, orders_params).fetchone()

        cases.append({
            "filters": {"regions": regions, "categories": cats, "channels": chans},
            "expected": {
                "net_revenue": net_revenue, "gross_revenue": gross_revenue,
                "discount_amount": discount_amount, "cogs": cogs, "margin": margin,
                "margin_pct": (margin / net_revenue) if net_revenue else None,
                "units": units, "completed_orders": completed_orders,
                "aov": (completed_net_revenue / completed_orders) if completed_orders else None,
            },
        })

    (OUT / "parity_cases.json").write_text(json.dumps(cases, indent=2))
    print(f"wrote {len(cases)} parity cases")


if __name__ == "__main__":
    main()
