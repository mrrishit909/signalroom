with bounds as (
    select min(order_date) as min_d, max(order_date) as max_d from {{ ref('stg_orders') }}
),
spine as (
    select cast(generate_series as date) as date_day
    from bounds, generate_series(bounds.min_d, bounds.max_d, interval 1 day)
)
select
    date_day,
    extract(year from date_day) as year,
    extract(month from date_day) as month,
    extract(day from date_day) as day,
    extract(dow from date_day) as day_of_week,
    strftime(date_day, '%Y-%m') as year_month,
    case when extract(dow from date_day) in (0, 6) then true else false end as is_weekend
from spine
