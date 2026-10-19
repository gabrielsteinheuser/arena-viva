-- Arena Viva: schema inicial (multi-arena)
--
-- Regras principais:
--   * cada arena só é vista e alterada pelos seus membros (RLS);
--   * a LP pública nunca lê `bookings` diretamente: usa `available_slots` e
--     `request_booking`, que não expõem nome nem telefone de outros clientes;
--   * reservas pendentes ou confirmadas não podem se sobrepor na mesma quadra
--     (exclusion constraint), mesmo com duas solicitações simultâneas.

create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

create table public.arenas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 3 and 60),
  name text not null check (length(btrim(name)) between 2 and 80),
  tagline text check (length(tagline) <= 140),
  description text check (length(description) <= 2000),
  address text,
  city text,
  whatsapp text check (whatsapp ~ '^[0-9]{10,13}$'),
  instagram text,
  timezone text not null default 'America/Sao_Paulo',
  booking_window_days int not null default 30 check (booking_window_days between 1 and 365),
  min_notice_minutes int not null default 60 check (min_notice_minutes between 0 and 10080),
  -- Mensagem enviada pelo WhatsApp ao confirmar uma reserva. Variáveis:
  -- {nome} {arena} {quadra} {data} {horario} {pessoas} {valor}
  confirmation_template text not null default
    'Olá, {nome}! Sua reserva na {arena} está confirmada ✅' || chr(10) || chr(10) ||
    '📅 {data}' || chr(10) || '⏰ {horario}' || chr(10) || '🏐 {quadra} · {pessoas} pessoa(s)' || chr(10) ||
    '💰 {valor}' || chr(10) || chr(10) || 'Até lá!'
    check (length(confirmation_template) <= 1000),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.arena_members (
  arena_id uuid not null references public.arenas (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now(),
  primary key (arena_id, user_id)
);

create index arena_members_user_idx on public.arena_members (user_id);

create table public.courts (
  id uuid primary key default gen_random_uuid(),
  arena_id uuid not null references public.arenas (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 40),
  surface text,
  sports text[] not null default '{}',
  capacity int not null default 4 check (capacity between 1 and 100),
  hourly_price numeric(10, 2) not null default 0 check (hourly_price >= 0),
  color text not null default '#0d8f91' check (color ~ '^#[0-9a-fA-F]{6}$'),
  active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (arena_id, name),
  unique (id, arena_id)
);

-- Janelas de funcionamento por dia da semana (0 = domingo).
-- Use `closes = '24:00'` para fechar à meia-noite.
create table public.court_hours (
  id uuid primary key default gen_random_uuid(),
  arena_id uuid not null,
  court_id uuid not null,
  weekday smallint not null check (weekday between 0 and 6),
  opens time not null,
  closes time not null,
  slot_minutes int not null default 60 check (slot_minutes between 15 and 240),
  check (closes > opens),
  foreign key (court_id, arena_id) references public.courts (id, arena_id) on delete cascade
);

create index court_hours_court_idx on public.court_hours (court_id, weekday);

-- Períodos indisponíveis (manutenção, evento). `court_id` nulo bloqueia a arena toda.
create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  arena_id uuid not null references public.arenas (id) on delete cascade,
  court_id uuid,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  check (ends_at > starts_at),
  foreign key (court_id, arena_id) references public.courts (id, arena_id) on delete cascade
);

create index blocks_arena_idx on public.blocks (arena_id, starts_at);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  arena_id uuid not null,
  court_id uuid not null,
  customer_name text not null check (length(btrim(customer_name)) between 2 and 80),
  phone text check (phone ~ '^[0-9]{10,11}$'),
  people int not null default 1 check (people between 1 and 100),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  price numeric(10, 2) not null default 0 check (price >= 0),
  status text not null default 'pendente' check (status in ('pendente', 'confirmada', 'recusada', 'cancelada')),
  source text not null default 'site' check (source in ('site', 'painel')),
  notes text check (length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  foreign key (court_id, arena_id) references public.courts (id, arena_id) on delete restrict,
  constraint bookings_no_overlap exclude using gist (
    court_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('pendente', 'confirmada'))
);

create index bookings_arena_starts_idx on public.bookings (arena_id, starts_at);
create index bookings_arena_status_idx on public.bookings (arena_id, status);

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger bookings_touch_updated_at
  before update on public.bookings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

create function public.is_arena_member(p_arena uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.arena_members
    where arena_id = p_arena and user_id = (select auth.uid())
  );
$$;

alter table public.arenas enable row level security;
alter table public.arena_members enable row level security;
alter table public.courts enable row level security;
alter table public.court_hours enable row level security;
alter table public.blocks enable row level security;
alter table public.bookings enable row level security;

-- Dados institucionais da arena e das quadras ativas são públicos (alimentam a LP).
create policy arenas_select on public.arenas for select
  using (active or public.is_arena_member(id));
create policy arenas_update on public.arenas for update to authenticated
  using (public.is_arena_member(id)) with check (public.is_arena_member(id));

create policy arena_members_select on public.arena_members for select to authenticated
  using (user_id = (select auth.uid()) or public.is_arena_member(arena_id));

create policy courts_select on public.courts for select
  using (active or public.is_arena_member(arena_id));
create policy courts_write on public.courts for all to authenticated
  using (public.is_arena_member(arena_id)) with check (public.is_arena_member(arena_id));

create policy court_hours_select on public.court_hours for select
  using (true);
create policy court_hours_write on public.court_hours for all to authenticated
  using (public.is_arena_member(arena_id)) with check (public.is_arena_member(arena_id));

create policy blocks_member on public.blocks for all to authenticated
  using (public.is_arena_member(arena_id)) with check (public.is_arena_member(arena_id));

create policy bookings_member on public.bookings for all to authenticated
  using (public.is_arena_member(arena_id)) with check (public.is_arena_member(arena_id));

-- Defesa extra: visitantes anônimos não têm nenhum acesso direto a reservas e bloqueios.
revoke all on public.bookings, public.blocks, public.arena_members from anon;

-- ---------------------------------------------------------------------------
-- Funções públicas (LP)
-- ---------------------------------------------------------------------------

-- Horários livres de uma quadra em uma data (no fuso da arena).
-- Considera funcionamento, antecedência mínima, janela máxima, bloqueios e
-- reservas pendentes ou confirmadas.
create function public.available_slots(p_court uuid, p_date date)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = '' as $$
  with court as (
    select c.id, c.arena_id, a.timezone, a.booking_window_days, a.min_notice_minutes
    from public.courts c
    join public.arenas a on a.id = c.arena_id
    where c.id = p_court and c.active and a.active
      and p_date <= (now() at time zone a.timezone)::date + a.booking_window_days
  ),
  slots as (
    select distinct
      (s.local_start at time zone court.timezone) as starts_at,
      ((s.local_start + make_interval(mins => h.slot_minutes)) at time zone court.timezone) as ends_at,
      court.id as court_id,
      court.arena_id,
      court.min_notice_minutes
    from court
    join public.court_hours h on h.court_id = court.id and h.weekday = extract(dow from p_date)
    cross join lateral generate_series(
      p_date + h.opens,
      p_date + h.closes - make_interval(mins => h.slot_minutes),
      make_interval(mins => h.slot_minutes)
    ) as s (local_start)
  )
  select slots.starts_at, slots.ends_at
  from slots
  where slots.starts_at >= now() + make_interval(mins => slots.min_notice_minutes)
    and not exists (
      select 1 from public.bookings b
      where b.court_id = slots.court_id
        and b.status in ('pendente', 'confirmada')
        and tstzrange(b.starts_at, b.ends_at) && tstzrange(slots.starts_at, slots.ends_at)
    )
    and not exists (
      select 1 from public.blocks k
      where k.arena_id = slots.arena_id
        and (k.court_id is null or k.court_id = slots.court_id)
        and tstzrange(k.starts_at, k.ends_at) && tstzrange(slots.starts_at, slots.ends_at)
    )
  order by slots.starts_at;
$$;

-- Solicitação de reserva feita pela LP. Fica `pendente` e já bloqueia o horário
-- até o dono confirmar ou recusar no painel.
create function public.request_booking(
  p_court uuid,
  p_starts_at timestamptz,
  p_name text,
  p_phone text,
  p_people int
) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_name text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_court record;
  v_slot record;
  v_open_requests int;
  v_id uuid;
begin
  if length(v_phone) in (12, 13) and v_phone like '55%' then
    v_phone := substr(v_phone, 3);
  end if;

  if length(v_name) < 2 or length(v_name) > 80 then
    raise exception 'Informe seu nome.' using errcode = 'P0001';
  end if;
  if v_phone !~ '^[1-9][0-9]9?[0-9]{8}$' or length(v_phone) not in (10, 11) then
    raise exception 'Informe um telefone válido com DDD.' using errcode = 'P0001';
  end if;

  select c.id, c.arena_id, c.capacity, c.hourly_price, a.timezone
    into v_court
  from public.courts c
  join public.arenas a on a.id = c.arena_id
  where c.id = p_court and c.active and a.active;

  if not found then
    raise exception 'Esta quadra não está disponível para reservas.' using errcode = 'P0001';
  end if;
  if p_people is null or p_people < 1 or p_people > v_court.capacity then
    raise exception 'Esta quadra comporta de 1 a % pessoas.', v_court.capacity using errcode = 'P0001';
  end if;

  select s.starts_at, s.ends_at into v_slot
  from public.available_slots(p_court, (p_starts_at at time zone v_court.timezone)::date) s
  where s.starts_at = p_starts_at;

  if not found then
    raise exception 'Este horário não está mais disponível. Escolha outro.' using errcode = 'P0001';
  end if;

  select count(*) into v_open_requests
  from public.bookings b
  where b.arena_id = v_court.arena_id and b.phone = v_phone
    and b.status = 'pendente' and b.starts_at > now();

  if v_open_requests >= 3 then
    raise exception 'Você já tem 3 solicitações em análise. Aguarde o retorno da arena.' using errcode = 'P0001';
  end if;

  insert into public.bookings (arena_id, court_id, customer_name, phone, people, starts_at, ends_at, price, status, source)
  values (
    v_court.arena_id, p_court, v_name, v_phone, p_people, v_slot.starts_at, v_slot.ends_at,
    round(v_court.hourly_price * extract(epoch from v_slot.ends_at - v_slot.starts_at) / 3600, 2),
    'pendente', 'site'
  )
  returning id into v_id;

  return v_id;
exception
  when exclusion_violation then
    raise exception 'Este horário acabou de ser reservado. Escolha outro.' using errcode = 'P0001';
end;
$$;

-- Cria uma arena e torna o usuário logado o dono dela.
create function public.create_arena(p_slug text, p_name text) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'É preciso estar logado.' using errcode = 'P0001';
  end if;

  insert into public.arenas (slug, name) values (lower(btrim(p_slug)), btrim(p_name))
  returning id into v_id;
  insert into public.arena_members (arena_id, user_id, role) values (v_id, (select auth.uid()), 'owner');
  return v_id;
exception
  when unique_violation then
    raise exception 'Este endereço já está em uso. Escolha outro.' using errcode = 'P0001';
  when check_violation then
    raise exception 'Verifique o nome e o endereço (use letras minúsculas, números e hífens).' using errcode = 'P0001';
end;
$$;

revoke execute on function public.available_slots(uuid, date) from public;
revoke execute on function public.request_booking(uuid, timestamptz, text, text, int) from public;
revoke execute on function public.create_arena(text, text) from public, anon;
revoke execute on function public.is_arena_member(uuid) from public;
grant execute on function public.available_slots(uuid, date) to anon, authenticated;
grant execute on function public.request_booking(uuid, timestamptz, text, text, int) to anon, authenticated;
grant execute on function public.create_arena(text, text) to authenticated;
-- anon também precisa: as policies públicas de arenas/quadras chamam esta função.
grant execute on function public.is_arena_member(uuid) to anon, authenticated;

-- Tempo real: o painel recebe novas solicitações sem recarregar (respeita RLS).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.bookings;
  end if;
end;
$$;
