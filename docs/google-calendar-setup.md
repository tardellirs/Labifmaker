# Google Calendar

Esta integracao sincroniza automaticamente os agendamentos do portal com um calendario real do Google:

- ao criar um pedido: cria evento como `Pendente`
- ao aprovar: atualiza o evento para `Aprovado`
- ao rejeitar: remove o evento do calendario

## Estrategia recomendada

Use um calendario dedicado do laboratorio e compartilhe esse calendario com uma `service account` do Google Cloud com permissao de escrita.

Isso evita depender de login humano da coordenacao e funciona bem no backend serverless.

## Passos no Google

1. No Google Cloud, habilite a `Google Calendar API`.
2. Crie uma `Service Account`.
3. Gere uma chave JSON para essa conta.
4. No Google Calendar da conta do laboratorio, crie ou escolha o calendario oficial do LabIF Maker.
5. Compartilhe esse calendario com o e-mail da service account com permissao `Make changes to events` (`writer`).
6. Copie o `Calendar ID` desse calendario.

## Variaveis de ambiente

Preencha no `.env.local`:

```env
GOOGLE_CALENDAR_ENABLED=true
GOOGLE_CALENDAR_ID=seu_calendar_id@group.calendar.google.com
GOOGLE_CALENDAR_CLIENT_EMAIL=sua-service-account@seu-projeto.iam.gserviceaccount.com
GOOGLE_CALENDAR_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_TIMEZONE=America/Sao_Paulo
```

## Onde a sincronizacao acontece

- Criacao do pedido: `apps/web/src/app/api/bookings/route.ts`
- Aprovacao/reprovacao: `apps/web/src/app/api/bookings/[bookingId]/decision/route.ts`
- Cliente Google Calendar: `apps/web/src/lib/google-calendar/client.ts`
- Regras de sincronizacao: `apps/web/src/lib/google-calendar/sync.ts`

## Observacoes

- Sem essas variaveis, o sistema continua funcionando normalmente e apenas nao sincroniza com o Google Calendar.
- A sincronizacao real nao foi testada aqui porque depende de credenciais e acesso externo ao Google.

## Referencias oficiais

- Google Calendar API: https://developers.google.com/workspace/calendar/api/guides/overview
- Service accounts: https://developers.google.com/identity/protocols/oauth2/service-account
- Calendar ACL / access roles: https://developers.google.com/workspace/calendar/api/concepts/sharing
