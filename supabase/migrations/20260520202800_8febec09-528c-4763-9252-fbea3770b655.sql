-- ACCOMMODATION SUPPLIER REGISTRY
create table if not exists accommodation_suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  country text not null,
  city text not null,
  zip text not null,
  total_rooms int default 0,
  available_rooms int default 0,
  base_nightly_rate_usd numeric not null,
  vegan_meal_available boolean default false,
  vegetarian_meal_available boolean default false,
  trust_score int default 0,
  status text default 'pending',
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- ZIP INDEX TABLE
create table if not exists zip_supply_index (
  id uuid primary key default gen_random_uuid(),
  zip text unique not null,
  has_accommodation boolean default false,
  active_supplier_count int default 0,
  last_updated timestamp default now()
);

-- Enable RLS (tables otherwise expose data publicly)
alter table accommodation_suppliers enable row level security;
alter table zip_supply_index enable row level security;

-- Admins manage suppliers
create policy "Admins manage accommodation suppliers"
  on accommodation_suppliers for all
  to authenticated
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy "Verified suppliers publicly readable"
  on accommodation_suppliers for select
  to public
  using (status = 'verified' or has_role(auth.uid(), 'admin'::app_role));

-- ZIP index publicly readable, admin-managed
create policy "Zip supply index publicly readable"
  on zip_supply_index for select
  to public
  using (true);

create policy "Admins manage zip supply index"
  on zip_supply_index for all
  to authenticated
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));
