-- Reconciliation gate (spec criterion 02): fact_sales must carry exactly one row per
-- raw order_item (no join fan-out) and its net_revenue must equal the same business
-- rule computed directly from the raw seeds, independent of any mart logic.
-- dbt test convention: a singular test PASSES when it returns zero rows.
with raw_recomputed as (
    select
        oi.order_item_id,
        case
            when o.status = 'completed' then oi.quantity * oi.unit_price
            when o.status = 'returned' then -1 * oi.quantity * oi.unit_price
            else 0
        end as expected_net_revenue
    from {{ ref('order_items') }} oi
    join {{ ref('orders') }} o on oi.order_id = o.order_id
),
mart as (
    select order_item_id, net_revenue from {{ ref('fact_sales') }}
)
select
    coalesce(r.order_item_id, m.order_item_id) as order_item_id,
    r.expected_net_revenue,
    m.net_revenue
from raw_recomputed r
full outer join mart m on r.order_item_id = m.order_item_id
where r.order_item_id is null
   or m.order_item_id is null
   or abs(r.expected_net_revenue - m.net_revenue) > 0.001
