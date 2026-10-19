# Arena Viva

Painel de gestão para arenas esportivas, desenvolvido para centralizar reservas, agenda, clientes, quadras e preços em uma interface rápida e responsiva.

Esta versão funciona como uma demonstração navegável do produto. Os dados são armazenados localmente no navegador e ainda não existe integração com backend, autenticação real ou meios de pagamento.

## Visão do produto

O Arena Viva foi pensado para facilitar a operação diária de espaços com quadras de areia, como arenas de beach tennis, futevôlei e vôlei de praia.

Principais objetivos:

- reduzir o trabalho manual no controle de horários;
- mostrar rapidamente a ocupação e a receita prevista;
- acompanhar reservas pendentes e confirmadas;
- organizar informações básicas dos clientes;
- configurar quadras e preços em um só lugar;
- servir como base para um futuro produto comercial.

## Funcionalidades disponíveis

### Visão geral

- resumo das reservas do dia;
- receita prevista;
- horários disponíveis;
- indicador de ocupação;
- destaque para a próxima reserva;
- widget de condições da arena;
- gráfico de receita semanal;
- lista das próximas reservas.

### Agenda

- visualização semanal;
- alternância entre os dias no celular;
- identificação visual de reservas confirmadas e pendentes;
- criação de reserva a partir de um horário disponível;
- abertura dos detalhes ao selecionar uma reserva.

### Reservas

- listagem completa;
- busca por cliente, atividade ou quadra;
- filtro por status;
- criação de novas reservas;
- edição de reservas existentes;
- confirmação de reservas pendentes;
- cancelamento com etapa de confirmação.

### Clientes

- busca por nome;
- total de reservas por cliente;
- valor acumulado em reservas;
- painel lateral com informações e última atividade.

### Espaços e preços

- configuração do preço-base de cada quadra;
- ativação e desativação de quadras;
- restauração dos valores padrão;
- uso automático do preço configurado ao criar uma reserva.

### Outros recursos

- central de notificações;
- perfil demonstrativo do administrador;
- mensagens de confirmação das ações;
- persistência local dos dados;
- layout responsivo para desktop, tablet e celular.

## Tecnologias

- [React 19](https://react.dev/)
- JavaScript com JSX
- [Vite 7](https://vite.dev/)
- CSS puro
- `localStorage` para persistência da demonstração
- Google Fonts: DM Sans e Barlow Condensed

## Pré-requisitos

- Node.js 20 ou superior;
- npm 10 ou superior.

O projeto foi desenvolvido e validado com Node.js 24.

## Instalação

Clone o repositório, entre na pasta do projeto e instale as dependências:

```bash
git clone <url-do-repositorio>
cd arena-viva-demo
npm install
```

No Windows PowerShell, caso a execução de `npm.ps1` esteja bloqueada, utilize:

```powershell
npm.cmd install
```

## Executando em desenvolvimento

```bash
npm run dev
```

No Windows:

```powershell
npm.cmd run dev
```

O Vite exibirá o endereço local no terminal, normalmente:

```text
http://127.0.0.1:5173/
```

> Não abra o arquivo `index.html` diretamente pelo Explorer. A aplicação usa módulos do React e deve ser executada pelo servidor do Vite.

## Build de produção

Para gerar uma versão otimizada:

```bash
npm run build
```

Os arquivos finais serão criados em `dist/`.

Para visualizar o build:

```bash
npm run preview
```

No Windows, substitua `npm` por `npm.cmd` caso necessário.

## Comandos disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o ambiente de desenvolvimento. |
| `npm run build` | Gera o build otimizado em `dist/`. |
| `npm run preview` | Abre uma prévia local do build de produção. |

## Estrutura do projeto

```text
arena-viva-demo/
├── src/
│   ├── App.jsx        # Componentes, dados e regras da aplicação
│   ├── main.jsx       # Inicialização do React
│   └── styles.css     # Identidade visual e responsividade
├── dist/              # Build gerado automaticamente
├── index.html         # Documento HTML usado pelo Vite
├── package.json       # Dependências e scripts
├── package-lock.json  # Versões exatas das dependências
├── vite.config.js     # Configuração do Vite
└── README.md
```

### Atenção sobre `dist/`

Não edite manualmente os arquivos dentro de `dist/`, incluindo arquivos como `index-CJRnlK_7.js` e `index-D2ScNrmM.css`.

Esses nomes possuem hashes e são recriados automaticamente por `npm run build`. Toda alteração deve ser feita em `src/App.jsx`, `src/styles.css` ou nos demais arquivos-fonte.

## Organização atual do código

O projeto ainda está concentrado em `src/App.jsx` por ser uma base demonstrativa. O arquivo contém:

- dados iniciais de reservas e quadras;
- ícones SVG;
- componentes das telas;
- modais e painéis laterais;
- gerenciamento de estado;
- regras de criação, edição, confirmação e cancelamento;
- integração com `localStorage`.

Quando a equipe começar a expandir o produto, a recomendação é separar o código em:

```text
src/
├── components/
├── pages/
├── hooks/
├── services/
├── data/
├── utils/
└── styles/
```

## Persistência local

Esta demonstração utiliza duas chaves no `localStorage`:

| Chave | Conteúdo |
| --- | --- |
| `arena-viva-bookings-v2` | Reservas criadas e modificadas. |
| `arena-viva-courts-v2` | Preços e disponibilidade das quadras. |

Para restaurar completamente os dados iniciais, abra as ferramentas do navegador e remova essas duas chaves em **Application > Local Storage**.

Os dados armazenados dessa forma pertencem somente ao navegador e dispositivo utilizados. Eles não são compartilhados entre usuários.

## Identidade visual

A interface utiliza uma paleta inspirada em arenas de praia:

| Papel | Cor |
| --- | --- |
| Azul profundo | `#123f49` |
| Azul oceano | `#0d8f91` |
| Coral | `#ed725e` |
| Amarelo-sol | `#efb642` |
| Areia | `#f4efe5` |
| Papel | `#fffdf8` |

As principais variáveis estão declaradas no início de `src/styles.css`.

## Convenções para contribuir

1. Crie uma branch a partir da branch principal.
2. Use nomes claros, como `feature/pagamentos` ou `fix/filtro-reservas`.
3. Faça alterações somente nos arquivos-fonte, nunca diretamente em `dist/`.
4. Preserve a interface responsiva.
5. Evite criar botões ou links sem comportamento implementado.
6. Execute o build antes de abrir um pull request.
7. Descreva no pull request o que mudou e como testar.

Exemplo de fluxo:

```bash
git checkout -b feature/minha-funcionalidade
npm install
npm run dev
npm run build
git add .
git commit -m "feat: adiciona minha funcionalidade"
```

## Checklist antes de entregar uma alteração

- [ ] A página abre pelo servidor do Vite.
- [ ] O console do navegador não apresenta erros.
- [ ] `npm run build` termina com sucesso.
- [ ] Os fluxos alterados foram testados.
- [ ] A interface continua funcionando em tela pequena.
- [ ] Nenhum arquivo de `dist/` foi editado manualmente.
- [ ] Textos estão revisados e com acentuação correta.
- [ ] Botões e links visíveis possuem comportamento funcional.

## Limitações da versão atual

- os dados são apenas locais;
- não existe cadastro ou login real;
- clima, receita semanal e alguns indicadores são demonstrativos;
- não existe validação de conflito entre horários;
- ainda não há pagamento online;
- ainda não há integração com WhatsApp ou e-mail;
- ainda não há diferentes níveis de acesso.

## Próximas etapas recomendadas

1. Separar os componentes e regras de negócio em arquivos menores.
2. Criar uma API e conectar um banco de dados.
3. Implementar autenticação e permissões.
4. Adicionar validação de conflito entre quadras e horários.
5. Integrar pagamentos e controle financeiro.
6. Criar notificações por WhatsApp.
7. Adicionar relatórios e indicadores com dados reais.
8. Implementar testes automatizados.
9. Preparar implantação e monitoramento de produção.

## Status

Versão atual: **2.0.0 — demonstração front-end**.

O projeto está pronto para apresentação e evolução, mas precisa de backend e infraestrutura antes de operar com dados reais de clientes.
