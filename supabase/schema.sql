create extension if not exists pgcrypto;

create table if not exists public.blog_articles (
  id uuid primary key default gen_random_uuid(),
  auto_seo_id bigint not null unique,
  title text not null,
  slug text not null unique,
  url text not null unique,
  meta_description text not null default '',
  excerpt text not null default '',
  content_html text not null default '',
  content_markdown text not null default '',
  hero_image_url text,
  hero_image_alt text,
  infographic_image_url text,
  infographic_image_alt text,
  keywords jsonb not null default '[]'::jsonb,
  meta_keywords text,
  faq_schema jsonb not null default '[]'::jsonb,
  language_code text not null default 'es',
  status text not null default 'published',
  published_at timestamptz not null,
  updated_at timestamptz not null,
  created_at timestamptz not null,
  reading_time_minutes integer not null default 1,
  updated_on_site_at timestamptz not null default timezone('utc', now()),
  created_on_site_at timestamptz not null default timezone('utc', now())
);

create index if not exists blog_articles_published_at_idx
  on public.blog_articles (published_at desc);

alter table public.blog_articles enable row level security;

insert into storage.buckets (id, name, public)
values ('blog-media', 'blog-media', true)
on conflict (id) do update
set public = true;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public can read blog media'
  ) then
    create policy "Public can read blog media"
      on storage.objects
      for select
      to public
      using (bucket_id = 'blog-media');
  end if;
end
$$;
