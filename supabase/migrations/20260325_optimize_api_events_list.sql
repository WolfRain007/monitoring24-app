create or replace function public.api_events_list(
  p_q text default null,
  p_status text default null,
  p_event_family_key text default null,
  p_date_from timestamptz default null,
  p_date_to timestamptz default null,
  p_sort_by text default 'last_seen_desc',
  p_limit integer default 20,
  p_offset integer default 0
)
returns table(
  id uuid,
  title text,
  status text,
  started_at timestamptz,
  last_seen_at timestamptz,
  event_family_key text,
  city_id uuid,
  country_code text,
  real_news_count integer,
  total_count integer
)
language sql
stable
as $$
  with filtered as (
    select
      e.id,
      e.title,
      e.status,
      e.started_at,
      e.last_seen_at,
      e.event_family_key,
      e.city_id,
      e.country_code,
      e.created_at
    from public.events e
    where
      (p_q is null or p_q = '' or e.title ilike '%' || p_q || '%')
      and (p_status is null or p_status = '' or e.status = p_status)
      and (p_event_family_key is null or p_event_family_key = '' or e.event_family_key = p_event_family_key)
      and (p_date_from is null or coalesce(e.last_seen_at, e.started_at, e.created_at) >= p_date_from)
      and (p_date_to is null or coalesce(e.last_seen_at, e.started_at, e.created_at) < p_date_to)
  ),
  paged as (
    select
      f.*,
      count(*) over()::int as total_count
    from filtered f
    order by
      case when p_sort_by = 'started_desc' then f.started_at end desc nulls last,
      case when p_sort_by is null or p_sort_by = '' or p_sort_by = 'last_seen_desc' then f.last_seen_at end desc nulls last,
      f.id desc
    limit greatest(coalesce(p_limit, 20), 1)
    offset greatest(coalesce(p_offset, 0), 0)
  )
  select
    p.id,
    p.title,
    p.status,
    p.started_at,
    p.last_seen_at,
    p.event_family_key,
    p.city_id,
    p.country_code,
    (
      select count(*)::int
      from public.news_items ni
      where ni.event_id = p.id
    ) as real_news_count,
    p.total_count
  from paged p
  order by
    case when p_sort_by = 'started_desc' then p.started_at end desc nulls last,
    case when p_sort_by is null or p_sort_by = '' or p_sort_by = 'last_seen_desc' then p.last_seen_at end desc nulls last,
    p.id desc;
$$;
