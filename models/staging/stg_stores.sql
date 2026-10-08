select store_id, store_name, region_id from {{ ref('stores') }}
