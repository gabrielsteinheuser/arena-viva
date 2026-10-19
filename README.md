# Arena Viva

Sistema de reservas para arenas esportivas, com duas pontas ligadas ao mesmo banco de dados:

- **Página pública da arena (LP)** — `/<endereço-da-arena>`: apresenta a arena e as quadras, e permite que o cliente final **solicite uma reserva** informando nome, WhatsApp, quadra, número de pessoas, dia e horário. Só aparecem horários realmente livres.
- **Painel do dono** — `/painel`: solicitações recebidas (em tempo real), confirmação com mensagem pronta no WhatsApp, agenda por dia e quadra, reservas, clientes e configuração de quadras, preços e horários.

O sistema é **multi-arena**: cada conta cadastra a própria arena e só enxerga os próprios dados.

## Como funciona uma reserva

```
Cliente na LP                          Dono no painel
─────────────                          ──────────────
escolhe quadra, dia e horário livre
envia nome, WhatsApp e nº de pessoas ──► aparece em "Solicitações" (tempo real)
         │                                     │
   horário fica bloqueado               [Confirmar reserva]
   enquanto está pendente                      │
                                        status → confirmada
                                        abre o WhatsApp do cliente com a
                                        mensagem do template preenchida
                                               │
                                        [Recusar] → horário volta a ficar livre
```

- Solicitações **pendentes já bloqueiam o horário**, evitando pedidos duplicados.
- O banco **impede reservas sobrepostas** na mesma quadra (constraint de exclusão no Postgres), mesmo com duas solicitações simultâneas.
- A LP **nunca lê a tabela de reservas**: usa as funções `available_slots` e `request_booking`, que não expõem nome nem telefone de outros clientes.
- Cada cliente pode ter no máximo 3 solicitações pendentes por arena.

### Mensagem de confirmação no WhatsApp

Em **Arena e quadras → Mensagem de confirmação** o dono edita o template, com pré-visualização. Variáveis disponíveis:

| Variável | Exemplo |
| --- | --- |
| `{nome}` | Marina |
| `{arena}` | Arena Viva |
| `{quadra}` | Quadra 01 |
| `{data}` | sábado, 24/10 |
| `{horario}` | 10:00 às 11:00 |
| `{pessoas}` | 4 |
| `{valor}` | R$ 90 |

Ao clicar em **Confirmar reserva**, o painel marca a reserva como confirmada e abre o WhatsApp (`api.whatsapp.com/send`) com a mensagem pronta; o dono só aperta "enviar". Se o navegador bloquear a nova aba, aparece um botão "Abrir WhatsApp" no aviso.

## Tecnologias

- React 19 + Vite 7 + React Router 7
- Supabase (Postgres, Auth, Realtime, RLS)
- Vitest para testes de unidade; Postgres em Docker para testes do banco
- CSS puro

## Estrutura

```text
arena-viva/
├── src/
│   ├── main.jsx               # Rotas: /, /painel/*, /:slug
│   ├── styles.css             # Identidade visual e painel
│   ├── components/            # Icon, Modal/Drawer acessíveis, SetupNotice
│   ├── landing/               # LP pública + formulário de solicitação
│   ├── painel/                # Login, onboarding, contexto e telas do painel
│   └── lib/
│       ├── supabase.js        # Cliente Supabase
│       ├── api.js             # Todas as chamadas ao banco
│       └── format.js          # Datas no fuso da arena, telefone, template do WhatsApp
├── supabase/
│   ├── config.toml            # Supabase local (CLI)
│   ├── migrations/            # Schema, RLS e funções
│   ├── seed.sql               # Arena de demonstração
│   └── tests/                 # Testes do banco
└── scripts/db-test.sh
```

## Rodando localmente

Pré-requisitos: Node.js 20+, Docker (para o Supabase local e os testes do banco).

```bash
npm install
npm run db:start          # sobe o Supabase local e aplica migrations + seed
npx supabase status       # mostra a API URL e a Publishable key
cp .env.example .env.local   # preencha com os valores acima
npm run dev
```

- LP de demonstração: http://127.0.0.1:5173/arena-viva
- Painel: http://127.0.0.1:5173/painel. Crie uma conta; sem arena vinculada, o painel oferece cadastrar uma. Para assumir a arena do seed, vincule seu usuário:

```sql
insert into public.arena_members (arena_id, user_id)
select a.id, u.id from public.arenas a, auth.users u
where a.slug = 'arena-viva' and u.email = 'seu@email.com';
```

## Configurando o Supabase em produção

1. Crie um projeto em [supabase.com](https://supabase.com) (região São Paulo).
2. Aplique o schema: `npx supabase link --project-ref <ref>` e `npx supabase db push` (ou cole `supabase/migrations/*.sql` no SQL Editor).
3. Em **Authentication → URL Configuration**, defina o *Site URL* e inclua `https://seu-dominio/painel` nos *Redirect URLs*.
4. Se quiser controlar quem cria arenas, desative cadastros públicos em **Authentication → Sign In / Providers** e convide os donos manualmente.
5. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no ambiente de build.

### Hospedagem

O build (`npm run build` → `dist/`) é estático, mas usa rotas do navegador (`/arena-viva`, `/painel/agenda`). A hospedagem precisa **redirecionar rotas desconhecidas para `index.html`** (SPA fallback). Na Vercel/Netlify isso é uma regra de rewrite; sem isso, abrir um link direto retorna 404.

## Comandos

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Ambiente de desenvolvimento. |
| `npm run build` | Build de produção em `dist/`. |
| `npm test` | Testes de unidade (datas, telefone, template). |
| `npm run db:test` | Sobe um Postgres descartável e testa schema, RLS e funções. |
| `npm run db:start` | Sobe o Supabase local. |
| `npm run db:reset` | Recria o banco local a partir das migrations e do seed. |

## Próximas etapas

- Aviso ao dono por e-mail/WhatsApp quando chega uma solicitação (Edge Function + gatilho).
- Expiração automática de solicitações não respondidas.
- Preços diferentes por faixa de horário (pico/fora de pico) e reservas recorrentes.
- Pagamento antecipado (Pix) e controle financeiro.
- Bloqueios de agenda (manutenção, eventos) pelo painel — a tabela `blocks` já existe e é respeitada pela LP.
- Domínio próprio por arena e imagens/galeria na LP.
