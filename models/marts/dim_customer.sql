select
    c.customer_id,
    c.signup_date,
    c.region_id,
    r.region_name
from {{ ref('stg_customers') }} c
left join {{ ref('stg_regions') }} r on c.region_id = r.region_id
