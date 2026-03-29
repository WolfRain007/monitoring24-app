create index if not exists idx_news_items_event_id
  on public.news_items (event_id);

create index if not exists idx_news_items_assignment_status
  on public.news_items (assignment_status);

create index if not exists idx_news_items_city_id
  on public.news_items (city_id);

create index if not exists idx_news_items_published_at
  on public.news_items (published_at);

create index if not exists idx_news_items_created_at
  on public.news_items (created_at);

create index if not exists idx_events_last_seen_at
  on public.events (last_seen_at);

create index if not exists idx_events_event_family_key
  on public.events (event_family_key);

create index if not exists idx_events_geo_level
  on public.events (geo_level);

create index if not exists idx_events_city_id
  on public.events (city_id);

create index if not exists idx_events_region_id
  on public.events (region_id);

create index if not exists idx_events_country_code
  on public.events (country_code);

create index if not exists idx_city_geo_map_geo_entity_id
  on public.city_geo_map (geo_entity_id);
