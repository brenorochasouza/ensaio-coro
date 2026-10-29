-- Ensaio do Coro: estrutura no Supabase
-- Rode uma vez no SQL Editor do projeto.
-- O acesso fica liberado para quem tiver a chave pública do projeto.

create table if not exists public.coro_apresentacoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  data date,
  local text,
  criado_em timestamptz not null default now()
);

create table if not exists public.coro_musicas (
  id uuid primary key default gen_random_uuid(),
  apresentacao_id uuid not null references public.coro_apresentacoes(id) on delete cascade,
  titulo text not null,
  bg_path text,
  voz_path text,
  pdf_path text,
  criado_em timestamptz not null default now()
);

create index if not exists coro_musicas_apresentacao_idx
  on public.coro_musicas (apresentacao_id);

alter table public.coro_apresentacoes enable row level security;
alter table public.coro_musicas enable row level security;

grant select, insert, update, delete on public.coro_apresentacoes to anon, authenticated;
grant select, insert, update, delete on public.coro_musicas to anon, authenticated;

drop policy if exists coro_apresentacoes_acesso on public.coro_apresentacoes;
create policy coro_apresentacoes_acesso on public.coro_apresentacoes
  for all to anon, authenticated using (true) with check (true);

drop policy if exists coro_musicas_acesso on public.coro_musicas;
create policy coro_musicas_acesso on public.coro_musicas
  for all to anon, authenticated using (true) with check (true);

-- Bucket privado para MP3 e PDF (até 50 MB por arquivo)
insert into storage.buckets (id, name, public, file_size_limit)
values ('coro', 'coro', false, 52428800)
on conflict (id) do nothing;

drop policy if exists coro_arquivos_ler on storage.objects;
create policy coro_arquivos_ler on storage.objects
  for select to anon, authenticated using (bucket_id = 'coro');

drop policy if exists coro_arquivos_enviar on storage.objects;
create policy coro_arquivos_enviar on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'coro');

drop policy if exists coro_arquivos_alterar on storage.objects;
create policy coro_arquivos_alterar on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'coro') with check (bucket_id = 'coro');

drop policy if exists coro_arquivos_apagar on storage.objects;
create policy coro_arquivos_apagar on storage.objects
  for delete to anon, authenticated using (bucket_id = 'coro');
