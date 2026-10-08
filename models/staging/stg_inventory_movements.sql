select movement_id, store_id, product_id, cast(movement_date as date) as movement_date,
    cast(quantity_delta as integer) as quantity_delta, reason
from {{ ref('inventory_movements') }}
