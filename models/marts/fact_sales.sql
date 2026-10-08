-- Grain: one row per order_item. Revenue/margin rules (see docs/metrics.md):
--   gross_revenue = quantity * list_price (pre-discount reference price)
--   discount_amount = quantity * (list_price - unit_price), floored at 0
--   net_revenue = +quantity*unit_price if completed, -quantity*unit_price if returned, 0 if cancelled
--   cogs mirrors net_revenue's sign so margin = net_revenue - cogs nets cleanly to zero on a full return
with items as (
    select
        oi.order_item_id,
        oi.order_id,
        oi.product_id,
        oi.quantity,
        oi.unit_price,
        oi.unit_cost,
        o.customer_id,
        o.store_id,
        o.order_date,
        o.channel,
        o.promo_code,
        o.status
    from {{ ref('stg_order_items') }} oi
    join {{ ref('stg_orders') }} o on oi.order_id = o.order_id
)
select
    i.order_item_id,
    i.order_id,
    i.product_id,
    i.customer_id,
    i.store_id,
    i.order_date,
    i.channel,
    i.promo_code,
    i.status,
    i.quantity,
    i.unit_price,
    i.unit_cost,
    p.list_price,
    i.quantity * p.list_price as gross_revenue,
    greatest(i.quantity * (p.list_price - i.unit_price), 0) as discount_amount,
    case
        when i.status = 'completed' then i.quantity * i.unit_price
        when i.status = 'returned' then -1 * i.quantity * i.unit_price
        else 0
    end as net_revenue,
    case
        when i.status = 'completed' then i.quantity * i.unit_cost
        when i.status = 'returned' then -1 * i.quantity * i.unit_cost
        else 0
    end as cogs
from items i
join {{ ref('dim_product') }} p on i.product_id = p.product_id
