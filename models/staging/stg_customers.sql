select customer_id, cast(signup_date as date) as signup_date, region_id
from {{ ref('customers') }}
