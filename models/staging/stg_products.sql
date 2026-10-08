select product_id, product_name, category, subcategory,
    cast(unit_cost as double) as unit_cost, cast(list_price as double) as list_price
from {{ ref('products') }}
