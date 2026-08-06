-- Aggregated, real-time site stats (single row)
create table if not exists public.site_stats (
  id int primary key,
  total_views bigint not null default 0,
  unique_visitors bigint not null default 0,
  updated_at timestamptz not null default now(),
  constraint site_stats_single_row check (id = 1)
);

insert into public.site_stats (id, total_views, unique_visitors)
values (1, 0, 0)
on conflict (id) do nothing;

-- Backfill from existing page_views if present
update public.site_stats s
set total_views = greatest(s.total_views, coalesce(pv.total, 0)),
    unique_visitors = greatest(s.unique_visitors, coalesce(pv.uniq, 0))
from (
  select count(*)::bigint as total,
         count(distinct session_id)::bigint as uniq
  from public.page_views
) pv
where s.id = 1;

alter table public.site_stats enable row level security;

drop policy if exists "Public can read site stats" on public.site_stats;
create policy "Public can read site stats"
  on public.site_stats for select
  using (true);

-- Per-(session,page) throttle so refreshes don't inflate counts
create table if not exists public.view_throttle (
  session_id text not null,
  page text not null,
  last_view timestamptz not null default now(),
  primary key (session_id, page)
);

alter table public.view_throttle enable row level security;
-- Intentionally no public policies: only the SECURITY DEFINER fn touches it.

-- Atomic, throttled view recording
create or replace function public.record_page_view(p_session text, p_page text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_counted boolean;
  v_is_new_unique boolean;
begin
  if p_session is null or length(p_session) < 8 then
    return;
  end if;
  if p_page is null then
    p_page := '/';
  end if;
  if length(p_page) > 512 then
    p_page := substring(p_page from 1 for 512);
  end if;

  -- Decide whether this is a "new unique visitor" BEFORE we touch the throttle row.
  select not exists (
    select 1 from public.view_throttle where session_id = p_session
  ) into v_is_new_unique;

  -- Throttle: count only if no row OR last_view older than 30 minutes.
  with up as (
    insert into public.view_throttle (session_id, page, last_view)
    values (p_session, p_page, now())
    on conflict (session_id, page) do update
      set last_view = excluded.last_view
      where view_throttle.last_view < now() - interval '30 minutes'
    returning 1
  )
  select exists (select 1 from up) into v_counted;

  if not v_counted then
    return;
  end if;

  update public.site_stats
    set total_views = total_views + 1,
        unique_visitors = unique_visitors + case when v_is_new_unique then 1 else 0 end,
        updated_at = now()
    where id = 1;
end;
$$;

revoke all on function public.record_page_view(text, text) from public;
grant execute on function public.record_page_view(text, text) to anon, authenticated;

-- Enable realtime broadcasts on site_stats
alter table public.site_stats replica identity full;
do $$
begin
  begin
    execute 'alter publication supabase_realtime add table public.site_stats';
  exception when duplicate_object then null;
  end;
end$$;

-- Helpful index to prune stale throttle rows efficiently later
create index if not exists view_throttle_last_view_idx
  on public.view_throttle (last_view);