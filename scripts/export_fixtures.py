"""Exports real pre-aggregated grains from the verified dbt marts (fact_sales,
fact_inventory, dims) to JSON for the static site. Every number is a real SQL
aggregate over the seeded dataset in data/raw/ (see docs/metrics.md for the
revenue/margin rules) -- nothing here is fabricated or hand-typed.

Grains exported (each small enough to ship as static JSON, aggregated in a
browser Web Worker, never requiring a live SQL engine in the visitor's browser):
  - monthly: year_month x region x channel x category -> revenue/margin/units
  - cohort: cohort_month x months_since -> retained_customers/cohort_size
  - sku_monthly: product_id x year_month -> revenue/units/margin (top 40 products)
  - pareto: product_id -> total net_revenue, for the full 112-product catalog

Run: source venv/bin/activate && python3 scripts/export_fixtures.py
(requires dbt run/test to have populated db/signalroom.duckdb first)
"""
from __future__ import annotations

import json
from pathlib import Path

import duckdb

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "db" / "signalroom.duckdb"
OUT = ROOT / "site" / "public" / "data"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect(str(DB), read_only=True)

    # Additive item-level measures only (revenue/cogs/units are safe to sum across
    # any subset of these rows). completed_orders is deliberately NOT here: an
    # order can contain items from more than one category, so a per-category
    # distinct order count cannot be re-summed across categories without double
    # counting. See orders_monthly below and docs/metrics.md.
    monthly = con.execute("""
        select
            strftime(f.order_date, '%Y-%m') as year_month,
            d.region_name,
            f.channel,
            p.category,
            sum(f.net_revenue) as net_revenue,
            sum(f.gross_revenue) as gross_revenue,
            sum(f.discount_amount) as discount_amount,
            sum(f.cogs) as cogs,
            sum(f.net_revenue) - sum(f.cogs) as margin,
            sum(case when f.status = 'completed' then f.quantity else 0 end) as units
        from fact_sales f
        join dim_store s on f.store_id = s.store_id
        join dim_product p on f.product_id = p.product_id
        left join dim_customer d on f.customer_id = d.customer_id
        group by 1, 2, 3, 4
        order by 1, 2, 3, 4
    """).fetchall()
    monthly_cols = ["year_month", "region_name", "channel", "category", "net_revenue",
                     "gross_revenue", "discount_amount", "cogs", "margin", "units"]

    # Order-level grain (region/channel/month only -- no category, since region and
    # channel are single-valued per order while category is not). Each completed
    # order appears in exactly one row here, so completed_orders sums correctly
    # across any subset of these rows.
    orders_monthly = con.execute("""
        select
            strftime(f.order_date, '%Y-%m') as year_month,
            d.region_name,
            f.channel,
            count(distinct case when f.status = 'completed' then f.order_id end) as completed_orders,
            sum(case when f.status = 'completed' then f.net_revenue else 0 end) as completed_net_revenue
        from fact_sales f
        left join dim_customer d on f.customer_id = d.customer_id
        group by 1, 2, 3
        order by 1, 2, 3
    """).fetchall()
    orders_monthly_cols = ["year_month", "region_name", "channel", "completed_orders", "completed_net_revenue"]

    cohort = con.execute("""
        with first_order as (
            select customer_id, min(strftime(order_date, '%Y-%m')) as cohort_month
            from fact_sales where status = 'completed'
            group by customer_id
        ),
        activity as (
            select distinct customer_id, strftime(order_date, '%Y-%m') as active_month
            from fact_sales where status = 'completed'
        ),
        joined as (
            select
                f.cohort_month,
                datediff('month', strptime(f.cohort_month || '-01', '%Y-%m-%d'), strptime(a.active_month || '-01', '%Y-%m-%d')) as months_since,
                a.customer_id
            from first_order f
            join activity a on f.customer_id = a.customer_id
            where a.active_month >= f.cohort_month
        )
        select cohort_month, months_since, count(distinct customer_id) as retained_customers
        from joined
        group by 1, 2
        order by 1, 2
    """).fetchall()
    cohort_sizes = con.execute("""
        select cohort_month, count(distinct customer_id) as cohort_size
        from (
            select customer_id, min(strftime(order_date, '%Y-%m')) as cohort_month
            from fact_sales where status = 'completed'
            group by customer_id
        )
        group by 1 order by 1
    """).fetchall()

    sku_monthly = con.execute("""
        select
            f.product_id, p.product_name, p.category,
            strftime(f.order_date, '%Y-%m') as year_month,
            sum(f.net_revenue) as net_revenue,
            sum(case when f.status = 'completed' then f.quantity else 0 end) as units,
            sum(f.net_revenue) - sum(f.cogs) as margin
        from fact_sales f
        join dim_product p on f.product_id = p.product_id
        group by 1, 2, 3, 4
        order by 1, 4
    """).fetchall()

    pareto = con.execute("""
        select p.product_id, p.product_name, p.category, sum(f.net_revenue) as net_revenue
        from fact_sales f
        join dim_product p on f.product_id = p.product_id
        group by 1, 2, 3
        order by net_revenue desc
    """).fetchall()

    regions = con.execute("select region_id, region_name from dim_customer group by 1, 2 order by 1").fetchall()
    categories = con.execute("select distinct category from dim_product order by 1").fetchall()

    def rows_to_dicts(rows, cols):
        return [dict(zip(cols, r)) for r in rows]

    (OUT / "monthly.json").write_text(json.dumps(rows_to_dicts(monthly, monthly_cols), default=str))
    (OUT / "orders_monthly.json").write_text(json.dumps(rows_to_dicts(orders_monthly, orders_monthly_cols), default=str))
    (OUT / "cohort.json").write_text(json.dumps({
        "retention": rows_to_dicts(cohort, ["cohort_month", "months_since", "retained_customers"]),
        "cohort_sizes": rows_to_dicts(cohort_sizes, ["cohort_month", "cohort_size"]),
    }, default=str))
    (OUT / "sku_monthly.json").write_text(json.dumps(
        rows_to_dicts(sku_monthly, ["product_id", "product_name", "category", "year_month", "net_revenue", "units", "margin"]),
        default=str))
    (OUT / "pareto.json").write_text(json.dumps(
        rows_to_dicts(pareto, ["product_id", "product_name", "category", "net_revenue"]), default=str))
    (OUT / "filters.json").write_text(json.dumps({
        "regions": [r[1] for r in regions],
        "categories": [c[0] for c in categories],
        "channels": ["online", "in_store"],
    }))

    print(f"monthly.json: {len(monthly)} rows")
    print(f"orders_monthly.json: {len(orders_monthly)} rows")
    print(f"cohort.json: {len(cohort)} retention rows, {len(cohort_sizes)} cohorts")
    print(f"sku_monthly.json: {len(sku_monthly)} rows")
    print(f"pareto.json: {len(pareto)} products")


if __name__ == "__main__":
    main()
