select product_id, product_name, category, subcategory, unit_cost, list_price
from {{ ref('stg_products') }}
