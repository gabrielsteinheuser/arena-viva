-- Testes do schema. Rode com `npm run db:test` (precisa de Docker).
\set ON_ERROR_STOP on
\set QUIET on
\o /dev/null

insert into auth.users (id) values
  ('00000000-0000-4000-8000-0000000000a1'),  -- dono da Arena Viva
  ('00000000-0000-4000-8000-0000000000b2');  -- usuário de outra arena
insert into public.arena_members (arena_id, user_id)
values ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a1');

create function pg_temp.expect_error(p_sql text, p_message text) returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'esperava erro "%", mas executou com sucesso: %', p_message, p_sql;
exception when others then
  if sqlerrm not like '%' || p_message || '%' then
    raise exception 'esperava erro "%", recebeu "%"', p_message, sqlerrm;
  end if;
end;
$$;
grant execute on function pg_temp.expect_error(text, text) to anon, authenticated;

create temp table ctx as
select (now() at time zone 'America/Sao_Paulo')::date + 1 as tomorrow,
       ((((now() at time zone 'America/Sao_Paulo')::date + 1) + time '10:00') at time zone 'America/Sao_Paulo') as ten_am;
grant select on ctx to anon, authenticated;

-- ---------------------------------------------------------------- visitante (LP)
set role anon;
set request.jwt.claim.sub = '';

do $$ begin
  assert (select count(*) from public.arenas where slug = 'arena-viva') = 1, 'anon deve ver a arena';
  assert (select count(*) from public.courts) = 3, 'anon deve ver as quadras ativas';
  assert (select count(*) from public.available_slots('00000000-0000-4000-8000-000000000011', (select tomorrow from ctx))) = 16,
    'amanhã deve ter 16 horários livres (7h às 23h)';
  assert (select count(*) from public.available_slots('00000000-0000-4000-8000-000000000011', (select tomorrow from ctx) + 400)) = 0,
    'fora da janela de reserva não deve haver horários';
end $$;

select pg_temp.expect_error('select * from public.bookings', 'permission denied');

do $$ begin
  perform public.request_booking('00000000-0000-4000-8000-000000000011', (select ten_am from ctx), '  Marina   Duarte ', '+55 (11) 98824-1620', 4);
  assert (select count(*) from public.available_slots('00000000-0000-4000-8000-000000000011', (select tomorrow from ctx))) = 15,
    'solicitação pendente deve bloquear o horário';
end $$;

select pg_temp.expect_error($q$select public.request_booking('00000000-0000-4000-8000-000000000011', (select ten_am from ctx), 'Outra Pessoa', '11999990000', 2)$q$,
  'não está mais disponível');
select pg_temp.expect_error($q$select public.request_booking('00000000-0000-4000-8000-000000000012', (select ten_am from ctx), 'Pedro', '1234', 2)$q$,
  'telefone válido');
select pg_temp.expect_error($q$select public.request_booking('00000000-0000-4000-8000-000000000012', (select ten_am from ctx), 'Pedro', '11999990000', 5)$q$,
  'comporta de 1 a 4');
select pg_temp.expect_error($q$select public.request_booking('00000000-0000-4000-8000-000000000012', (select ten_am from ctx) + interval '30 minutes', 'Pedro', '11999990000', 2)$q$,
  'não está mais disponível');

do $$ begin
  perform public.request_booking('00000000-0000-4000-8000-000000000012', (select ten_am from ctx), 'Pedro', '11999990000', 2);
  perform public.request_booking('00000000-0000-4000-8000-000000000012', (select ten_am from ctx) + interval '1 hour', 'Pedro', '11999990000', 2);
  perform public.request_booking('00000000-0000-4000-8000-000000000012', (select ten_am from ctx) + interval '2 hours', 'Pedro', '11999990000', 2);
end $$;
select pg_temp.expect_error($q$select public.request_booking('00000000-0000-4000-8000-000000000012', (select ten_am from ctx) + interval '3 hours', 'Pedro', '11999990000', 2)$q$,
  '3 solicitações em análise');
select pg_temp.expect_error($q$select public.create_arena('nova', 'Nova')$q$, 'permission denied');

reset role;

-- ---------------------------------------------------------------- dono da arena
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000a1';

do $$ begin
  assert (select count(*) from public.bookings) = 4, 'dono deve ver as 4 solicitações';
  assert (select phone from public.bookings where customer_name = 'Marina Duarte') = '11988241620',
    'nome e telefone devem ser normalizados';
  assert (select price from public.bookings where customer_name = 'Marina Duarte') = 90, 'preço deve vir da quadra';

  update public.bookings set status = 'confirmada' where customer_name = 'Marina Duarte';
  update public.bookings set status = 'recusada' where customer_name = 'Pedro' and starts_at = (select ten_am from ctx);
  assert (select count(*) from public.available_slots('00000000-0000-4000-8000-000000000012', (select tomorrow from ctx))) = 14,
    'recusar deve liberar o horário';
end $$;

select pg_temp.expect_error($q$
  insert into public.bookings (arena_id, court_id, customer_name, starts_at, ends_at, status, source)
  values ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', 'Encaixe',
          (select ten_am from ctx) + interval '30 minutes', (select ten_am from ctx) + interval '90 minutes', 'confirmada', 'painel')
$q$, 'bookings_no_overlap');

reset role;

-- ---------------------------------------------------------------- outro usuário
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000b2';

do $$ begin
  assert (select count(*) from public.bookings) = 0, 'outro usuário não pode ver reservas da arena';
  update public.courts set hourly_price = 1;
  assert (select count(*) from public.courts where hourly_price = 1) = 0, 'outro usuário não pode alterar quadras';
  perform public.create_arena('arena-do-bruno', 'Arena do Bruno');
  assert (select count(*) from public.arena_members) = 1, 'create_arena deve tornar o usuário dono';
end $$;

select pg_temp.expect_error($q$select public.create_arena('arena-viva', 'Duplicada')$q$, 'já está em uso');
select pg_temp.expect_error($q$
  insert into public.bookings (arena_id, court_id, customer_name, starts_at, ends_at)
  values ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000013', 'Invasor', now() + interval '1 day', now() + interval '25 hours')
$q$, 'row-level security');

reset role;
\echo 'OK: todos os testes do banco passaram.'
