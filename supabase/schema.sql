create table if not exists public.pricing_options (
  id text primary key,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.pricing_option_prices (
  pricing_option_id text not null references public.pricing_options(id) on delete cascade,
  pricing_type text not null check (pricing_type in ('插画+动效', '仅动效', '仅插画', '三维设计')),
  price numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  primary key (pricing_option_id, pricing_type)
);

create table if not exists public.designers (
  id text primary key,
  name text not null,
  efficiency numeric(8, 4) not null default 1,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.project_records (
  id text primary key,
  created_at timestamptz not null,
  business_line text not null,
  demand_name text,
  demand_label text not null,
  pricing_type text not null check (pricing_type in ('插画+动效', '仅动效', '仅插画', '三维设计')),
  base_value numeric(12, 2) not null default 0,
  designer text not null default '',
  efficiency numeric(8, 4) not null default 1,
  avg_production_days numeric(8, 2) not null default 0,
  slicing_days numeric(8, 2) not null default 0,
  revision_rounds integer not null default 0,
  strategic_value integer not null default 0,
  confidence_score integer not null default 0,
  selected_price numeric(12, 2) not null default 0,
  total_cost numeric(12, 2) not null default 0,
  raw_roi numeric(12, 2) not null default 0,
  roi_score integer not null default 0,
  composite_score numeric(10, 3) not null default 0,
  suggested_category text not null,
  revision_coefficient numeric(8, 4) not null default 1
);

create index if not exists idx_project_records_created_at on public.project_records (created_at desc);
create index if not exists idx_project_records_business_line on public.project_records (business_line);

comment on table public.pricing_options is '需求测算报价模板';
comment on table public.pricing_option_prices is '报价模板四类价格';
comment on table public.designers is '设计师基础名单';
comment on table public.project_records is '手动保存的项目记录';
