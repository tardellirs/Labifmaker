# LabIF Maker — IFSP Campus Jacareí

Sistema web de agendamento e gestão do laboratório de fabricação digital **LabIF Maker** do **Instituto Federal de São Paulo — Campus Jacareí**.

O LabIF Maker é o laboratório de fabricação digital do IFSP Jacareí, equipado com impressoras 3D, cortadora a laser, fresadora CNC e outros equipamentos. Este sistema foi desenvolvido especificamente para o campus com o objetivo de digitalizar e organizar o fluxo de uso do laboratório: professores, alunos e usuários autorizados solicitam horários pelo portal, e a coordenação avalia, aprova e gerencia tudo em um painel centralizado.

## Funcionalidades

### Para professores, alunos e usuários externos

- Login com conta Google (domínio `@ifsp.edu.br` por padrão, ou conforme configurações da coordenação)
- Visualização dos equipamentos disponíveis e seus status em tempo real
- Solicitação de agendamento em 3 passos:
  1. **Data** — calendário visual com dias disponíveis destacados e dias sem vaga bloqueados
  2. **Turno** — seleção do turno liberado pela coordenação para aquele dia (ex.: Turno 1 · 08:00 às 20:00)
  3. **Horário exato** — definição do horário de início e saída dentro do turno, com validação inline
- Acompanhamento do histórico de pedidos (pendente, aprovado, indeferido, cancelado)
- Notificação por e-mail sobre decisões da coordenação
- Painel com badge adaptado ao tipo de conta: "Painel do Professor", "Painel do Aluno" ou "Painel do Usuário"

### Para a coordenação

- Painel com indicadores (pendentes, aprovados futuros, finalizados) e calendário de agendamentos
- Fila de avaliação de solicitações com comentário e decisão
- Publicação de janelas de disponibilidade (turnos) do laboratório
- Cadastro, remoção e reordenação de equipamentos por arrastar e soltar
- Gerenciamento de coordenadores (qualquer e-mail) e destinatários de notificações
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
| Autenticação | Firebase Auth (Google Provider) |
| Banco de dados | Cloud Firestore |
| E-mail | Nodemailer (SMTP/Gmail) |
| Calendário | Google Calendar API (service account) |
| UI | Radix UI, shadcn/ui |
| Hospedagem | Vercel |

## Papéis de usuário

| Papel | Domínio | Acesso |
|-------|---------|--------|
| `coordenador` | Qualquer (configurável) | Painel da coordenação + agendamento |
| `professor` | `@ifsp.edu.br` | Painel do Professor |
| `aluno` | `@aluno.ifsp.edu.br` | Painel do Aluno (habilitado via config) |
| `externo` | Qualquer outro | Painel do Usuário (habilitado via config) |

## Estrutura do projeto

```
Labifmaker/
├── apps/
│   └── web/                    # Aplicação principal
│       └── src/
│           ├── app/            # Rotas, layouts e APIs (App Router)
│           ├── components/
│           │   ├── auth/       # Botão de login Google com estado de carregamento
│           │   ├── booking/    # Formulário de agendamento (3 passos)
│           │   ├── coordinator/# Painel da coordenação (calendário, filas, config)
│           │   ├── landing/    # Seções da landing page
│           │   ├── layout/     # Shell, sidebar, logo, labels de papel
│           │   └── ui/         # Design system local (Button, Card, Dialog, etc.)
│           ├── contexts/       # AuthContext (login, logout, signingIn state)
│           ├── lib/
│           │   ├── auth/       # Guards, access (cache unificado), session
│           │   ├── bookings/   # Schema Zod, serializers, formatters
│           │   ├── coordinator/# Dados do dashboard
│           │   ├── email/      # Nodemailer e templates
│           │   ├── equipment/  # Catálogo com ordem customizada
│           │   ├── firebase/   # SDK client e admin
│           │   ├── google-calendar/ # Integração Calendar API
│           │   └── utils/      # cn, role-labels
│           └── types/          # Tipos por domínio (user, equipment, booking, availability)
├── docs/                       # Documentação complementar
├── package.json                # Raiz do monorepo (npm workspaces)
└── AI_PROJECT_CONTEXT.md       # Contexto para assistentes de IA
```

## Pré-requisitos

- **Node.js** 22+ e **npm** 10+
- Projeto no **Firebase** com Auth e Firestore habilitados
- Conta Gmail com **App Password** para envio de e-mails (ou outro SMTP)
- _(Opcional)_ Service account no Google Cloud com acesso à Calendar API

## Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/labifmaker.git
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

> **Importante:** nunca versione o arquivo `.env.local` com credenciais reais. O arquivo `.env.local.example` (sem segredos) deve ser versionado como referência.

## Scripts

```bash
npm run dev        # Servidor de desenvolvimento
npm run build      # Build de produção
npm run lint       # Linting com ESLint
npm run typecheck  # Verificação de tipos com TypeScript
```

## Deploy

O projeto está preparado para deploy na **Vercel**:

1. Conecte o repositório na Vercel
2. Configure o **Root Directory** como `apps/web`
3. Adicione as variáveis de ambiente no painel da Vercel
4. O deploy acontece automaticamente a cada push

## Integração com Google Calendar

A sincronização com o Google Calendar é opcional e funciona via service account. Para configurar, consulte [`docs/google-calendar-setup.md`](docs/google-calendar-setup.md).

Sem as credenciais configuradas, o sistema funciona normalmente — apenas não sincroniza com o calendário.

## Licença

Projeto institucional desenvolvido para o **IFSP Campus Jacareí**. Uso restrito ao contexto acadêmico do campus.
