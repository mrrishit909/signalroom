"""Generates 24 months of coherent synthetic retail data (not real transactions):
customers, products, stores, regions, orders, order_items, inventory_movements.
Seasonality (Nov/Dec holiday spike), promo periods (discount + volume lift), and a
return/cancel rate are modeled explicitly so the dimensional model has real
reconciliation edges to test against (gross vs net revenue, COGS, margin).

Deterministic (seed=20260101) so re-running reproduces byte-identical output.
Run: python3 data/generate_seed_data.py (writes data/raw/*.csv)
"""
from __future__ import annotations

import csv
import datetime as dt
import random
from pathlib import Path

SEED = 20260101
START = dt.date(2024, 11, 1)
MONTHS = 24
OUT = Path(__file__).resolve().parent / "raw"

rng = random.Random(SEED)

REGIONS = [
    ("R1", "Northeast"), ("R2", "Southeast"), ("R3", "Midwest"),
    ("R4", "Southwest"), ("R5", "West"),
]

STORES = [
    ("S1", "Boston Flagship", "R1"), ("S2", "NYC Union Sq", "R1"),
    ("S3", "Atlanta Midtown", "R2"), ("S4", "Miami Design District", "R2"),
    ("S5", "Chicago Loop", "R3"), ("S6", "Minneapolis Uptown", "R3"),
    ("S7", "Austin Domain", "R4"), ("S8", "Phoenix Scottsdale", "R4"),
    ("S9", "LA Fairfax", "R5"), ("S10", "Seattle Capitol Hill", "R5"),
]
ONLINE_STORE = ("S0", "Online", None)

CATEGORIES = {
    "Apparel": ["Jackets", "Denim", "Knitwear", "Basics"],
    "Footwear": ["Sneakers", "Boots", "Sandals"],
    "Accessories": ["Bags", "Belts", "Hats", "Jewelry"],
    "Home": ["Candles", "Textiles", "Decor"],
}

CHANNELS = ["online", "in_store"]

PROMO_WINDOWS = [
    (dt.date(2024, 11, 24), dt.date(2024, 11, 29), "BLACKFRI24", 0.25),
    (dt.date(2024, 12, 18), dt.date(2024, 12, 24), "HOLIDAY24", 0.15),
    (dt.date(2025, 7, 1), dt.date(2025, 7, 7), "SUMMER25", 0.20),
    (dt.date(2025, 11, 24), dt.date(2025, 11, 29), "BLACKFRI25", 0.25),
    (dt.date(2025, 12, 18), dt.date(2025, 12, 24), "HOLIDAY25", 0.15),
]


def month_seasonality(d: dt.date) -> float:
    # Nov/Dec holiday spike, light summer lift, Jan/Feb trough.
    factor = {11: 1.6, 12: 1.9, 7: 1.15, 8: 1.1, 1: 0.75, 2: 0.8}.get(d.month, 1.0)
    weekday_factor = 1.25 if d.weekday() >= 5 else 1.0
    return factor * weekday_factor


def active_promo(d: dt.date):
    for start, end, code, pct in PROMO_WINDOWS:
        if start <= d <= end:
            return code, pct
    return None, 0.0


def build_products(per_subcategory=8):
    rows = []
    pid = 1
    for cat, subs in CATEGORIES.items():
        for sub in subs:
            for _ in range(per_subcategory):
                cost = round(rng.uniform(8, 60), 2)
                margin_mult = rng.uniform(2.1, 3.4)
                price = round(cost * margin_mult, 2)
                rows.append({
                    "product_id": f"P{pid}",
                    "product_name": f"{sub} {pid}",
                    "category": cat,
                    "subcategory": sub,
                    "unit_cost": cost,
                    "list_price": price,
                })
                pid += 1
    return rows


def build_customers(n=2400):
    rows = []
    for i in range(1, n + 1):
        signup = START + dt.timedelta(days=rng.randint(0, 28 * MONTHS))
        region = rng.choice(REGIONS)[0]
        rows.append({"customer_id": f"C{i}", "signup_date": signup.isoformat(), "region_id": region})
    return rows


def daterange(start: dt.date, days: int):
    for i in range(days):
        yield start + dt.timedelta(days=i)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    products = build_products()
    customers = build_customers()
    stores = [{"store_id": s[0], "store_name": s[1], "region_id": s[2]} for s in STORES] + \
             [{"store_id": ONLINE_STORE[0], "store_name": ONLINE_STORE[1], "region_id": None}]
    regions = [{"region_id": r[0], "region_name": r[1]} for r in REGIONS]

    orders, order_items, inventory = [], [], []
    oid, oiid, movid = 1, 1, 1
    customer_ids = [c["customer_id"] for c in customers]
    product_ids = [p["product_id"] for p in products]
    store_ids_physical = [s[0] for s in STORES]

    total_days = 28 * MONTHS
    for day in daterange(START, total_days):
        base_orders = 55
        n_orders_today = max(3, int(rng.gauss(base_orders * month_seasonality(day), base_orders * 0.15)))
        promo_code, promo_pct = active_promo(day)
        if promo_code:
            n_orders_today = int(n_orders_today * 1.8)

        for _ in range(n_orders_today):
            channel = rng.choices(CHANNELS, weights=[0.62, 0.38])[0]
            store_id = ONLINE_STORE[0] if channel == "online" else rng.choice(store_ids_physical)
            customer_id = rng.choice(customer_ids)
            status = rng.choices(["completed", "returned", "cancelled"], weights=[0.88, 0.09, 0.03])[0]
            order_id = f"O{oid}"
            orders.append({
                "order_id": order_id,
                "customer_id": customer_id,
                "store_id": store_id,
                "order_date": day.isoformat(),
                "channel": channel,
                "promo_code": promo_code or "",
                "status": status,
            })
            n_items = rng.choices([1, 2, 3, 4], weights=[0.5, 0.3, 0.15, 0.05])[0]
            for _ in range(n_items):
                product_id = rng.choice(product_ids)
                product = next(p for p in products if p["product_id"] == product_id)
                qty = rng.choices([1, 2, 3], weights=[0.75, 0.2, 0.05])[0]
                discount_pct = promo_pct if promo_code else 0.0
                unit_price = round(product["list_price"] * (1 - discount_pct), 2)
                order_items.append({
                    "order_item_id": f"OI{oiid}",
                    "order_id": order_id,
                    "product_id": product_id,
                    "quantity": qty,
                    "unit_price": unit_price,
                    "unit_cost": product["unit_cost"],
                })
                oiid += 1
                if channel != "online" or True:
                    inventory.append({
                        "movement_id": f"M{movid}",
                        "store_id": store_id,
                        "product_id": product_id,
                        "movement_date": day.isoformat(),
                        "quantity_delta": -qty if status != "cancelled" else 0,
                        "reason": "sale" if status == "completed" else ("return" if status == "returned" else "cancelled_no_op"),
                    })
                    movid += 1
            oid += 1

        if day.day in (1, 15):
            for store_id in store_ids_physical + [ONLINE_STORE[0]]:
                for _ in range(8):
                    product_id = rng.choice(product_ids)
                    inventory.append({
                        "movement_id": f"M{movid}",
                        "store_id": store_id,
                        "product_id": product_id,
                        "movement_date": day.isoformat(),
                        "quantity_delta": rng.randint(20, 80),
                        "reason": "restock",
                    })
                    movid += 1

    def write_csv(name, rows, fieldnames):
        with open(OUT / name, "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=fieldnames)
            w.writeheader()
            w.writerows(rows)
        print(f"{name}: {len(rows)} rows")

    write_csv("regions.csv", regions, ["region_id", "region_name"])
    write_csv("stores.csv", stores, ["store_id", "store_name", "region_id"])
    write_csv("products.csv", products, ["product_id", "product_name", "category", "subcategory", "unit_cost", "list_price"])
    write_csv("customers.csv", customers, ["customer_id", "signup_date", "region_id"])
    write_csv("orders.csv", orders, ["order_id", "customer_id", "store_id", "order_date", "channel", "promo_code", "status"])
    write_csv("order_items.csv", order_items, ["order_item_id", "order_id", "product_id", "quantity", "unit_price", "unit_cost"])
    write_csv("inventory_movements.csv", inventory, ["movement_id", "store_id", "product_id", "movement_date", "quantity_delta", "reason"])


if __name__ == "__main__":
    main()
