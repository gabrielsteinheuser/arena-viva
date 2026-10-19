-- Dados de demonstração: uma arena com três quadras abertas todos os dias das 7h às 23h.
-- Para vincular a arena ao seu usuário depois de criar a conta no Supabase:
--   insert into public.arena_members (arena_id, user_id)
--   select id, '<uuid do usuário em auth.users>' from public.arenas where slug = 'arena-viva';

insert into public.arenas (id, slug, name, tagline, description, address, city, whatsapp, instagram)
values (
  '00000000-0000-4000-8000-000000000001',
  'arena-viva',
  'Arena Viva',
  'Beach tennis, futevôlei e vôlei de praia com areia de verdade.',
  'Três quadras de areia iluminadas, vestiário, bar e estacionamento. Reserve seu horário em poucos cliques e receba a confirmação pelo WhatsApp.',
  'Rua das Palmeiras, 120',
  'São Paulo — SP',
  '11988241620',
  'arenaviva'
);

insert into public.courts (id, arena_id, name, surface, sports, capacity, hourly_price, color, position) values
  ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001', 'Quadra 01', 'Areia premium', '{Beach tennis,Futevôlei}', 4, 90, '#0d8f91', 1),
  ('00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000001', 'Quadra 02', 'Areia premium', '{Beach tennis,Futevôlei}', 4, 100, '#ed725e', 2),
  ('00000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000001', 'Quadra 03', 'Areia compacta', '{Vôlei de praia,Futevôlei}', 12, 110, '#e8ae3c', 3);

insert into public.court_hours (arena_id, court_id, weekday, opens, closes, slot_minutes)
select c.arena_id, c.id, d, '07:00', '23:00', 60
from public.courts c
cross join generate_series(0, 6) as d
where c.arena_id = '00000000-0000-4000-8000-000000000001';
