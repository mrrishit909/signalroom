select
    s.store_id,
    s.store_name,
    s.region_id,
    r.region_name,
    case when s.store_id = 'S0' then 'online' else 'in_store' end as channel_type
from {{ ref('stg_stores') }} s
left join {{ ref('stg_regions') }} r on s.region_id = r.region_id
