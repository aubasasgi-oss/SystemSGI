create table if not exists sgi_management_reviews (
  id text primary key,
  year text,
  status text,
  date date,
  participants text,
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table sgi_management_reviews disable row level security;
