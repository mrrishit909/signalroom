select
    movement_id,
    store_id,
    product_id,
    movement_date,
    quantity_delta,
    reason
from {{ ref('stg_inventory_movements') }}
