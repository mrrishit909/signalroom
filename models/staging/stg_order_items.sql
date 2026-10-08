select
    order_item_id,
    order_id,
    product_id,
    cast(quantity as integer) as quantity,
    cast(unit_price as double) as unit_price,
    cast(unit_cost as double) as unit_cost
from {{ ref('order_items') }}
