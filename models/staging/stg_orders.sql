select
    order_id,
    customer_id,
    store_id,
    cast(order_date as date) as order_date,
    channel,
    case when promo_code = '' then null else promo_code end as promo_code,
    status
from {{ ref('orders') }}
