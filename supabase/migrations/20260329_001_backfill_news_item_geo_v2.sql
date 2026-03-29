create or replace function public.backfill_news_item_geo_v2(
  p_limit integer default 20,
  p_max_age interval default '30 days'::interval
)
returns integer
language plpgsql
as $function$
declare
  v_updated integer := 0;
begin
  with candidates as (
    select
      ni.id,
      lower(
        concat_ws(
          ' ',
          coalesce(ni.title, ''),
          coalesce(ni.content_text, ''),
          coalesce(ni.rss_text, '')
        )
      ) as haystack,
      coalesce(ni.published_at, ni.created_at, now()) as effective_ts
    from public.news_items ni
    where ni.event_id is null
      and ni.city_id is null
      and coalesce(ni.published_at, ni.created_at, now()) >= now() - p_max_age
    order by coalesce(ni.published_at, ni.created_at) asc, ni.created_at asc
    limit p_limit
  ),
  candidate_matches as (
    select
      c.id as news_item_id,
      cgm.city_id,
      row_number() over (
        partition by c.id
        order by
          ga.is_primary desc,
          ga.weight desc nulls last,
          length(ga.alias) desc
      ) as rn
    from candidates c
    join public.geo_aliases ga
      on length(ga.alias) >= 5
     and c.haystack like '%' || lower(ga.alias) || '%'
    join public.geo_entities ge
      on ge.id = ga.geo_entity_id
     and ge.is_active = true
     and ge.geo_type::text = 'city'
    join public.city_geo_map cgm
      on cgm.geo_entity_id = ge.id
  ),
  updated as (
    update public.news_items ni
    set city_id = cm.city_id
    from candidate_matches cm
    where ni.id = cm.news_item_id
      and cm.rn = 1
      and ni.city_id is null
    returning 1
  )
  select count(*) into v_updated from updated;

  return v_updated;
end;
$function$;
