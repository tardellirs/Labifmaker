# LabIF Maker Jacarei - Contexto do Projeto para IA

Este arquivo resume a estrutura e as decisoes principais do projeto para facilitar o uso por agentes de IA, copilotos e assistentes de codigo.

## Visao geral

- Projeto: sistema web de agendamento e gestao do LabIF Maker Jacarei
- Stack principal: Next.js App Router, React, TailwindCSS, Firebase Auth, Firestore, Nodemailer
- Hospedagem alvo: Vercel
- Tipo de repositorio: monorepo simples com workspaces npm
- App principal atual: `apps/web`

## Estrutura do repositorio

```text
Labifmaker/
├── apps/
│   └── web/
│       ├── src/
│       │   ├── app/                 # rotas App Router, layouts e APIs
│       │   ├── components/          # componentes de UI e features
│       │   │   ├── auth/            # botao de login (GoogleSignInButton)
│       │   │   ├── coordinator/     # painel da coordenacao
│       │   │   └── landing/         # secoes da landing page
│       │   ├── contexts/            # AuthContext (login, logout, signingIn)
│       │   ├── lib/
│       │   │   ├── auth/            # guards, access (cache unificado), session
│       │   │   ├── bookings/
│       │   │   │   └── formatters.ts  # formatDate, formatDetailLabel, formatDetailValue
│       │   │   └── utils/
│       │   │       └── role-labels.ts # getRoleLabel, getPanelLabel
│       │   └── types/               # tipos separados por dominio
│       │       ├── index.ts         # barrel re-export
│       │       ├── user.ts          # UserRole ("professor"|"aluno"|"externo"|"coordenador")
│       │       ├── equipment.ts     # EquipmentType, EquipmentStatus, Equipment
│       │       ├── booking.ts       # BookingStatus, BookingDetails, Booking
│       │       └── availability.ts  # AvailabilitySlot
│       ├── package.json
│       ├── tailwind.config.ts
│       └── eslint.config.mjs
├── docs/
│   ├── plano-inicial.md
│   └── google-calendar-setup.md
├── package.json
└── AI_PROJECT_CONTEXT.md
```

## Scripts principais

Na raiz:

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`

No app web:

- `npm run dev --workspace @labifmaker/web`
- `npm run build --workspace @labifmaker/web`
- `npm run lint --workspace @labifmaker/web`
- `npm run typecheck --workspace @labifmaker/web`

## Estrutura da aplicacao web

### `apps/web/src/app`

- `layout.tsx`: layout raiz do App Router
- `globals.css`: estilos globais e tokens visuais
- `(public)/page.tsx`: landing page publica; usa leitura de cookie para CTA (nao chama `getCurrentSession`); usa componentes de `components/landing/`
- `login/page.tsx`: login com Google; texto do botao e hint dinamicos baseados em `allowStudents`/`allowExternalUsers`; paraleliza `getCurrentSession` + `getAccessSettings`
- `(protected)/layout.tsx`: injeta o shell protegido
- `(protected)/app/page.tsx`: painel do usuario (professor/aluno/externo); label dinamico via `getPanelLabel`
- `(protected)/coordenacao/page.tsx`: overview da coordenacao
- `(protected)/coordenacao/solicitacoes/page.tsx`: fila de pendentes
- `(protected)/coordenacao/aprovados/page.tsx`: historico aprovado
- `(protected)/coordenacao/disponibilidade/page.tsx`: gestao de janelas disponiveis
- `(protected)/coordenacao/configuracoes/page.tsx`: coordenadores, notificacoes e controle de acesso (alunos/externos); `force-dynamic`
- `(protected)/coordenacao/equipamentos/page.tsx`: cadastro e gestao de equipamentos
- `(protected)/loading.tsx`, `app/loading.tsx`, `coordenacao/loading.tsx`: estados de carregamento
- `login/loading.tsx`: loading da pagina de login

### `apps/web/src/app/api`

- `auth/session/route.ts`: cria sessao segura; `isAllowedLoginEmail` + `createSessionCookie` + `userRef.get` rodam em paralelo; `userRef.set` e fire-and-forget
- `auth/logout/route.ts`: encerra sessao
- `auth/bootstrap/route.ts`: bootstrap inicial do usuario
- `access-settings/route.ts`: GET/PATCH de `allowStudents` e `allowExternalUsers` (apenas coordenadores)
- `bookings/route.ts`: cria solicitacoes de agendamento
- `bookings/[bookingId]/decision/route.ts`: aprovar ou rejeitar agendamento
- `availability/route.ts`: CRUD basico de disponibilidade
- `coordinator-emails/route.ts`: gestao de e-mails de coordenadores e notificacoes (aceita qualquer dominio)
- `equipments/route.ts`: CRUD de equipamentos e reordenacao
- `send-email/route.ts`: endpoint serverless de envio de e-mail

## Estrutura por responsabilidade

### `apps/web/src/components`

- `auth/google-sign-in-button.tsx`: botao de login; aceita prop `institutional`; quando `signingIn=true` exibe overlay "Entrando no portal..." em vez do botao
- `booking/`: formulario de solicitacao do usuario
  - `booking-request-form.tsx`: fluxo em 3 passos; campo "Possuo conhecimento tecnico para operar o equipamento."
  - `booking-date-picker.tsx`: calendario mensal com dias disponiveis/bloqueados
  - `booking-cancel-button.tsx`: botao de cancelamento
- `coordinator/`: calendario, fila de avaliacao, disponibilidade, configuracoes
  - `equipment-manager.tsx`: drag-and-drop customizado com mouse events + atualizacao otimista
  - `booking-calendar.tsx`: calendario de agendamentos da coordenacao
  - `booking-review-queue.tsx`: fila de avaliacao de pedidos
  - `availability-manager.tsx`: gestao de janelas de disponibilidade
  - `coordinator-email-manager.tsx`: gestao de e-mails (qualquer dominio); dialog de confirmacao ao excluir
  - `access-settings-manager.tsx`: checkboxes para `allowStudents` e `allowExternalUsers`
- `landing/`: secoes da landing page publica
  - `landing-hero.tsx`, `landing-about.tsx`, `landing-equipment.tsx`, `landing-location.tsx`
- `layout/`: shell, sidebar, logo, menu do usuario
  - `protected-shell.tsx`: usa `getRoleLabel(session.papel)` para badge de papel; sem texto "Sistema online"
  - `protected-sidebar.tsx`: label de navegacao via `getPanelLabel`; badge de papel via `getRoleLabel`
  - `labif-logo.tsx`: prop `vertical` para versao vertical do login
- `ui/dialog.tsx`: chaves unicas em `AnimatePresence` (`key="overlay"` e `key="content"`)

### `apps/web/src/lib`

- `auth/access.ts`
  - cache unificado `AccessDoc` (60s TTL) para `coordinatorEmails` + `allowStudents` + `allowExternalUsers`
  - `loadAccessDoc()` faz um unico snapshot Firestore
  - `invalidateAccessCache()` limpa o cache ao alterar dados
  - `isStudentEmail(email)`: testa `/^[^@]+@aluno\.ifsp\.edu\.br$/i`
  - `isAllowedLoginEmail(email)`: ordem de checagem: `allowExternalUsers` → `isPrimaryIfspEmail` → `allowStudents && isStudentEmail` → `isCoordinatorEmail`
  - `addCoordinatorEmail`: aceita qualquer dominio (sem restricao de `isIfspFamilyEmail`)
  - `setAccessSettings({ allowStudents, allowExternalUsers })`: persiste no Firestore
- `auth/guards.ts`
  - `getCurrentSession`: papel derivado do e-mail do token (`isStudentEmail` → `"aluno"`, `isPrimaryIfspEmail` → `"professor"`, fallback → `"externo"`) sobrescrito por `isCoordinatorEmail`
- `auth/session.ts`
  - `resolveUserRole`: mesma logica de derivacao de papel por e-mail
  - `toUserProfile`: aceita `"aluno"` e `"externo"` como valores validos de `papel`
- `firebase/client.ts`
  - `getGoogleAuthProvider(institutional?: boolean)`: cria instancia nova a cada chamada; se `institutional=true` seta `hd: "ifsp.edu.br"`, caso contrario omite `hd` (permite qualquer conta Google)
- `bookings/`
  - `schema.ts`: validacao Zod
  - `serializers.ts`: normalizacao Firestore → tipos
  - `formatters.ts`: `formatDate`, `formatDetailLabel`, `formatDetailValue`
- `equipment/catalog.ts`: catalogo; `sortByOrder` aplica ordem customizada; `ensureEquipmentCatalog` so executa quando colecao vazia
- `email/`: `sender.ts` + `templates.ts`
- `google-calendar/`: `client.ts` + `sync.ts`
- `coordinator/dashboard-data.ts`: agrega dados para telas da coordenacao
- `utils/cn.ts`: helper de classes CSS
- `utils/role-labels.ts`
  - `getRoleLabel(papel)`: "Coordenação" | "Professor" | "Aluno" | "Usuário Externo"
  - `getPanelLabel(papel)`: "Painel do Professor" | "Painel do Aluno" | "Painel do Usuário"

### `apps/web/src/contexts`

- `auth-context.tsx`
  - `loading`: estado geral de autenticacao
  - `signingIn`: `true` enquanto nova sessao esta sendo sincronizada (do popup Google ate navegacao para `/app`); usado pelo `GoogleSignInButton` para exibir overlay de carregamento
  - `signInWithGoogle(institutional?)`: aceita flag; erros `auth/cancelled-popup-request` e `auth/popup-closed-by-user` sao silenciados
  - `router.push("/app")` so ocorre em novo login (`isNewSignIn`), nao em refresh silencioso de token
  - `router.prefetch("/app")` executado antes do push

### `apps/web/src/types`

Tipos separados por dominio com barrel export em `index.ts`:

- `user.ts`: `UserRole` = `"professor" | "aluno" | "externo" | "coordenador"`, `UserTrainingMatrix`, `UserProfile`, `AuthenticatedSession`
- `equipment.ts`: `EquipmentStatus`, `EquipmentType`, `Equipment`
- `booking.ts`: `BookingStatus`, `BookingDetails`, `Booking`
- `availability.ts`: `AvailabilitySlot`
- `index.ts`: re-exporta tudo

## Fluxo funcional atual

### Publico

- landing page institucional com secoes: hero, sobre, equipamentos, agendamento, regras, localizacao
- CTA dinamico para login

### Professor / Aluno / Externo

- **Professor**: entra com `@ifsp.edu.br` (padrao)
- **Aluno**: entra com `@aluno.ifsp.edu.br` apenas se `allowStudents=true` na config
- **Externo**: entra com qualquer conta Google apenas se `allowExternalUsers=true` na config
- O papel e derivado do e-mail a cada request server-side (guards.ts), nao do Firestore
- Ve painel com label adequado: "Painel do Professor", "Painel do Aluno" ou "Painel do Usuário"
- Fluxo de agendamento em 3 passos: data → turno → horario exato
- Acompanha historico de status: `pendente`, `aprovado`, `indeferido`, `cancelado`
- Status "rejeitado" no banco e exibido como "indeferido" na interface

### Coordenacao

- Acesso ao painel completo de coordenacao
- Aprova/rejeita pedidos, publica disponibilidade, gerencia equipamentos
- Configura quais perfis podem acessar (alunos e/ou externos) via `AccessSettingsManager`
- Gerencia lista de coordenadores (qualquer e-mail, sem restricao de dominio)
- Exclusao de coordenador requer confirmacao em dialog popup

## Modelo de dados no Firestore

Colecoes esperadas:

- `usuarios`
  - documento por `uid`
  - `papel`: `"professor" | "aluno" | "externo" | "coordenador"`
  - nome, email, campus, treinamentos, ultimo login
- `agendamentos`
  - solicitante, equipamento, horarios, status, detalhes tecnicos, comentario
  - pode armazenar ids/links do Google Calendar
- `disponibilidades`
  - janelas de atendimento publicadas pela coordenacao
- `configuracoes/acesso`
  - `coordinatorEmails`: array de e-mails de coordenadores (qualquer dominio)
  - `notificationRecipientEmails`: array de e-mails para notificacoes
  - `allowStudents`: boolean (padrao `false`)
  - `allowExternalUsers`: boolean (padrao `false`)
- `configuracoes/equipamentos`
  - `ordem`: array de IDs com a ordem customizada dos equipamentos
- `equipamentos`: catalogo de maquinas

## Regras de autenticacao e acesso

- login via Google Provider no Firebase Auth
- `getGoogleAuthProvider(institutional)`: define `hd` dinamicamente
- validacao real de acesso ocorre na aplicacao (nao apenas no Firebase)
- Ordem de checagem em `isAllowedLoginEmail`:
  1. `allowExternalUsers=true` → qualquer e-mail aceito
  2. `isPrimaryIfspEmail` → professores do IFSP sempre aceitos
  3. `allowStudents=true && isStudentEmail` → alunos aceitos se habilitado
  4. `isCoordinatorEmail` → coordenadores cadastrados sempre aceitos
- rotas protegidas usam guardas server-side
- papel derivado do token JWT a cada request (nao do Firestore `papel`)

Arquivos mais importantes:

- `apps/web/src/contexts/auth-context.tsx`
- `apps/web/src/lib/auth/access.ts`
- `apps/web/src/lib/auth/guards.ts`
- `apps/web/src/app/api/auth/session/route.ts`

## Integracoes externas

### Firebase

- Firebase Auth para login Google (com ou sem `hd` dependendo da configuracao)
- Firestore para persistencia
- Firebase Admin para APIs server-side

### E-mail

- envio por Nodemailer
- rota dedicada em `/api/send-email`
- usado para avisar coordenadores sobre novo pedido e professor sobre decisao

### Google Calendar

- integracao server-side via service account
- cria/atualiza/remove eventos relacionados aos agendamentos
- setup documentado em `docs/google-calendar-setup.md`

## Variaveis de ambiente esperadas

Arquivos de referencia:

- `.env.local.example`
- `apps/web/.env.local`

Grupos de variaveis:

- Firebase Web (`NEXT_PUBLIC_FIREBASE_*`)
- Firebase Admin (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`)
- SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`)
- Google Calendar (`GOOGLE_CALENDAR_ENABLED`, `GOOGLE_CALENDAR_ID`, `GOOGLE_CALENDAR_CLIENT_EMAIL`, `GOOGLE_CALENDAR_PRIVATE_KEY`)
- Sessao (`SESSION_COOKIE_NAME`)
- Coordenadores iniciais (`COORDINATOR_EMAILS`)

Importante: nao versionar segredos reais; manter nomes de variaveis existentes ao alterar integracoes.

## Layout e UX atuais

- area logada usa sidebar fixa em estilo painel administrativo
- shell principal: `protected-shell.tsx` + `protected-sidebar.tsx`
- badge de papel dinamico via `getRoleLabel` / `getPanelLabel` (sem texto "Sistema online")
- pagina de login: card centralizado com logo IFSP vertical; botao "Entrar com o Google institucional" ou "Entrar com o Google" conforme config; overlay "Entrando no portal..." durante sincronizacao
- indicadores do painel dentro do card verde escuro
- coordenacao separada em multiplas rotas

## Otimizacoes de performance aplicadas

- cache unificado `AccessDoc` em `access.ts` (60s TTL, um unico snapshot por ciclo)
- `isAllowedLoginEmail` + `createSessionCookie` + `userRef.get` em paralelo na rota de sessao
- `userRef.set` (upsert do perfil) e fire-and-forget na rota de sessao
- `getCurrentSession` + `getAccessSettings` em paralelo na pagina de login
- queries paralelas em `getCurrentSession` (user doc + `isCoordinatorEmail`)
- `getEquipmentCatalog` nao chama `ensureEquipmentCatalog` em toda leitura
- landing page usa cookie em vez de `getCurrentSession` para CTA
- `router.prefetch("/app")` antes do `router.push("/app")`
- `router.push` apenas em novo login (nao em refresh silencioso de token)
- drag-and-drop com atualizacao otimista de UI

## Arquivos mais importantes para comecar a mexer

Se a tarefa for visual:

- `apps/web/src/app/globals.css`
- `apps/web/src/components/ui/*`
- `apps/web/src/components/layout/*`

Se a tarefa for autenticacao ou controle de acesso:

- `apps/web/src/contexts/auth-context.tsx`
- `apps/web/src/lib/auth/access.ts`
- `apps/web/src/lib/auth/guards.ts`
- `apps/web/src/lib/auth/session.ts`
- `apps/web/src/lib/firebase/client.ts`
- `apps/web/src/app/api/auth/session/route.ts`
- `apps/web/src/app/api/access-settings/route.ts`

Se a tarefa for agendamento:

- `apps/web/src/components/booking/booking-request-form.tsx`
- `apps/web/src/components/booking/booking-date-picker.tsx`
- `apps/web/src/lib/bookings/*`
- `apps/web/src/app/api/bookings/*`

Se a tarefa for coordenacao:

- `apps/web/src/app/(protected)/coordenacao/*`
- `apps/web/src/components/coordinator/*`
- `apps/web/src/lib/coordinator/dashboard-data.ts`

Se a tarefa for integracoes:

- `apps/web/src/lib/email/*`
- `apps/web/src/lib/google-calendar/*`

Se a tarefa for landing page:

- `apps/web/src/app/(public)/page.tsx`
- `apps/web/src/components/landing/*`

## Convencoes uteis para outra IA

- preferir editar com foco em `apps/web`
- na landing page, evitar chamar `getCurrentSession`; usar leitura de cookie para decisao de CTA
- evitar mexer em `node_modules`
- usar os tipos de `src/types/index.ts` (ou importar diretamente do arquivo especifico do dominio)
- manter nomenclatura em portugues no dominio da aplicacao
- manter `status`, `papel`, `treinamentos` e nomes de colecoes consistentes com o Firestore atual
- para UI, seguir o shell com sidebar e componentes base de `components/ui`
- para rotas protegidas, validar sempre tanto frontend quanto server-side
- status "rejeitado" no banco e exibido como "indeferido" na interface (nao alterar o valor no banco)
- drag-and-drop de equipamentos usa mouse events customizados (nao a API HTML5 nativa de DnD)
- `invalidateAccessCache()` deve ser chamado ao alterar `configuracoes/acesso`
- papel e SEMPRE derivado do e-mail no token (guards.ts), nao do campo `papel` no Firestore
- `getGoogleAuthProvider` deve receber `institutional=false` quando `allowExternalUsers=true`

## Estado atual do produto

Ja existe:

- landing publica com secoes separadas em componentes (`components/landing/`)
- login com Google (institucional ou geral, dinamico via config)
- overlay "Entrando no portal..." durante sincronizacao de sessao
- dashboard com label adaptado ao papel: Professor, Aluno, Usuário
- solicitacao de agendamento em 3 passos (data, turno, horario exato com validacao inline)
- calendario visual de selecao de data com dias disponiveis/bloqueados
- fila de aprovacao da coordenacao
- disponibilidade do laboratorio com turnos nomeados
- cadastro e gestao de equipamentos com reordenacao por arrastar e soltar
- historico aprovado
- notificacoes por e-mail
- integracao com Google Calendar
- layout administrativo com sidebar
- loading states em rotas protegidas e login
- controle de acesso para alunos e usuarios externos (checkboxes na config da coordenacao)
- exclusao de coordenador com dialog de confirmacao
- lista de coordenadores aceita qualquer dominio de e-mail

Ajustes futuros provaveis:

- filtros mais ricos em historico e fila
- testes automatizados
- separar `booking-request-form.tsx` e `booking-review-queue.tsx` em sub-componentes (>200 linhas)

## Sugestao de prompt rapido para IA

Use este resumo como contexto inicial:

> Este projeto e um sistema de agendamento do LabIF Maker Jacarei em Next.js App Router, com Firebase Auth/Firestore, Nodemailer e Google Calendar. O app principal esta em `apps/web`. As areas principais sao professor/aluno/externo (`/app`) e coordenacao (`/coordenacao`). A autenticacao suporta 4 papeis: `professor` (@ifsp.edu.br), `aluno` (@aluno.ifsp.edu.br, habilitavel), `externo` (qualquer Google, habilitavel) e `coordenador`. O papel e derivado do e-mail no token a cada request (nao do Firestore). As regras centrais estao em `src/lib/auth` — `access.ts` tem cache unificado de 60s e `invalidateAccessCache()` deve ser chamado ao alterar `configuracoes/acesso`. Os fluxos de agendamento estao em `src/components/booking`, `src/app/api/bookings` e `src/lib/bookings`. A coordenacao esta em `src/app/(protected)/coordenacao` e `src/components/coordinator`. A landing page usa cookie (nao `getCurrentSession`) para o CTA. O `GoogleSignInButton` exibe overlay durante `signingIn`. Preserve nomes de dominio em portugues e a arquitetura atual com sidebar na area logada. O status "rejeitado" no banco e exibido como "indeferido" na interface.
