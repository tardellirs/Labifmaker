# LabIF Maker — IFSP Campus Jacareí

Sistema web de agendamento e gestão do laboratório de fabricação digital **LabIF Maker** do **Instituto Federal de São Paulo — Campus Jacareí**.

O LabIF Maker é o laboratório de fabricação digital do IFSP Jacareí, equipado com impressoras 3D, cortadora a laser, fresadora CNC e outros equipamentos. Este sistema foi desenvolvido especificamente para o campus com o objetivo de digitalizar e organizar o fluxo de uso do laboratório: professores, alunos e usuários autorizados solicitam horários pelo portal, e a coordenação avalia, aprova e gerencia tudo em um painel centralizado.

![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-Radix-000000?logo=shadcnui&logoColor=white)
![Nodemailer](https://img.shields.io/badge/Nodemailer-SMTP-22B573?logo=maildotru&logoColor=white)
![Google Calendar](https://img.shields.io/badge/Google%20Calendar-API-4285F4?logo=googlecalendar&logoColor=white)

## Funcionalidades

### Para professores, alunos e usuários externos

- Login com conta Google (domínio `@ifsp.edu.br` por padrão, ou conforme configurações da coordenação)
- Visualização dos equipamentos disponíveis e seus status em tempo real
- Solicitação de agendamento em 3 passos:
  1. **Data** — calendário visual com dias disponíveis destacados e dias sem vaga bloqueados
  2. **Turno** — seleção do turno liberado pela coordenação para aquele dia (ex.: Turno 1 · 08:00 às 12:00)
  3. **Horário exato** — definição do horário de início e saída dentro do turno, com validação inline
- Acompanhamento do histórico de pedidos (pendente, aprovado, indeferido, cancelado)
- Notificação por e-mail de agendamento e aprovações
- Painel com badge adaptado ao tipo de conta: "Painel do Professor", "Painel do Aluno" ou "Painel do Usuário"

### Para a coordenação

- Painel com indicadores (pendentes, aprovados, finalizados) e calendário de agendamentos
- Fila de avaliação de solicitações com comentário e decisão
- Publicação de janelas de disponibilidade (turnos) do laboratório
- Cadastro, remoção e reordenação de equipamentos
- Gerenciamento de coordenadores e destinatários de notificações
- Histórico completo de agendamentos aprovados
- **Controle de acesso ampliado:**
  - Checkbox para permitir login de alunos (`@aluno.ifsp.edu.br`)
  - Checkbox para permitir login de usuários externos (qualquer conta Google)

### Integrações

- **Google Calendar**: sincronização automática de agendamentos aprovados com um calendário institucional (opcional)
- **E-mail**: notificações transacionais para professores e coordenadores via SMTP

## Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 15 (App Router) |
| Frontend | React 19, TypeScript, Tailwind CSS |
| Autenticação | Firebase Auth |
| Banco de dados | Cloud Firestore |
| E-mail | Nodemailer (SMTP/Gmail) |
| Calendário | Google Calendar API |
| UI | Radix UI, shadcn/ui |

## Papéis de usuário

| Papel | Domínio | Acesso |
|-------|---------|--------|
| `coordenador` | Qualquer (configurável) | Painel da coordenação + agendamento |
| `professor` | `@ifsp.edu.br` | Painel do Professor |
| `aluno` | `@aluno.ifsp.edu.br` | Painel do Aluno (se habilitado) |
| `externo` | Qualquer e-mail | Painel do Usuário (se habilitado) |

## Estrutura do projeto

```
Labifmaker/
├── apps/
│   └── web/                    # Aplicação principal
│       └── src/
│           ├── app/            # Rotas, layouts e APIs (App Router)
│           ├── components/
│           │   ├── auth/       # Login com com Firebase Auth
│           │   ├── booking/    # Formulário de agendamento (3 passos)
│           │   ├── coordinator/# Painel da coordenação (calendário, filas, config)
│           │   ├── landing/    # Seções da landing page
│           │   ├── layout/     # Shell, sidebar, logo, labels de papel
│           │   └── ui/         # Design system local (Button, Card, Dialog, etc.)
│           ├── contexts/       # AuthContext (login, logout, signingIn state)
│           ├── lib/
│           │   ├── auth/       # Guards, access (cache unificado), session
│           │   ├── bookings/   # Schema Zod, serializers, formatters
│           │   ├── coordinator/# Funções de busca por pagina (bookings, availability, settings)
│           │   ├── email/      # Nodemailer e templates
│           │   ├── equipment/  # Catálogo com ordem customizada
│           │   ├── firebase/   # SDK client e admin
│           │   ├── google-calendar/ # Integração Calendar API
│           │   └── utils/      # cn, role-labels
│           └── types/          # Tipos por domínio (user, equipment, booking, availability)
└──  package.json               # Raiz do monorepo (npm workspaces)
```

## Pré-requisitos

- **Node.js** 22+ e **npm** 10+
- Projeto no **Firebase** com Auth e Firestore habilitados
- Conta Gmail com **App Password** para envio de e-mails (ou outro SMTP)
- _(Opcional)_ Service account no Google Cloud com acesso à Calendar API

## Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/tardellirs/labifmaker.git
cd labifmaker

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.local.example .env.local
# Edite o .env.local com suas credenciais (veja a seção abaixo)

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

O app estará disponível em **http://localhost:3000**.

## Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_FIREBASE_*` | Credenciais do Firebase Web (API Key, Auth Domain, Project ID, etc.) |
| `FIREBASE_PROJECT_ID` | ID do projeto Firebase (server-side) |
| `FIREBASE_CLIENT_EMAIL` | E-mail da service account do Firebase Admin |
| `FIREBASE_PRIVATE_KEY` | Chave privada da service account do Firebase Admin |
| `SESSION_COOKIE_NAME` | Nome do cookie de sessão (padrão: `labifmaker_session`) |
| `COORDINATOR_EMAILS` | E-mails dos coordenadores iniciais, separados por vírgula |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Configuração do servidor SMTP |
| `SMTP_FROM` | Remetente dos e-mails transacionais |
| `GOOGLE_CALENDAR_ENABLED` | `true` para ativar a integração com Google Calendar |
| `GOOGLE_CALENDAR_ID` | ID do calendário do Google |
| `GOOGLE_CALENDAR_CLIENT_EMAIL` | E-mail da service account do Calendar |
| `GOOGLE_CALENDAR_PRIVATE_KEY` | Chave privada da service account do Calendar |


## Scripts

```bash
npm run dev        # Servidor de desenvolvimento
npm run build      # Build de produção
npm run lint       # Linting com ESLint
npm run typecheck  # Verificação de tipos com TypeScript
```

## Integração com Google Calendar

A sincronização é opcional e funciona via service account. Sem as variáveis configuradas, o sistema funciona normalmente.

**Passos:**
1. No Google Cloud, habilite a `Google Calendar API` e crie uma Service Account.
2. Gere uma chave JSON para essa conta.
3. No Google Calendar, crie ou escolha o calendário oficial do LabIF Maker e compartilhe com o e-mail da service account com permissão `Make changes to events`.
4. Copie o `Calendar ID` e preencha as variáveis de ambiente correspondentes.

A sincronização ocorre em três momentos: criação do pedido (`pendente`), aprovação (`aprovado`) e rejeição (evento removido).

## Licença

Projeto institucional desenvolvido para o **IFSP Campus Jacareí**. Uso restrito ao contexto acadêmico do campus.
