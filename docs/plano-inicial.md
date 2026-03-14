# Plano Inicial

## Fase 1: Fundacao

- Monorepo com `apps/web`
- Next.js App Router com Tailwind e TypeScript
- Design system leve com componentes reutilizaveis
- Variaveis de ambiente e setup para Vercel/Firebase

## Fase 2: Autenticacao e Autorizacao

- Login Google com `hd=ifsp.edu.br`
- Validacao extra de dominio apos o login
- Sessao server-side com cookie `httpOnly`
- Guardas para rotas protegidas e paginas de coordenacao
- Sincronizacao do documento `usuarios/{uid}` no Firestore

## Fase 3: Dominio do Negocio

- Colecao `usuarios`
- Colecao `equipamentos`
- Colecao `agendamentos`
- Estados iniciais: `pendente`, `aprovado`, `rejeitado`, `cancelado`

## Fase 4: Experiencia do Produto

- Landing page institucional
- Dashboard do aluno com status dos pedidos
- Dashboard da coordenacao com fila de aprovacao
- Gestao de equipamentos e matriz de habilidades

## Fase 5: Notificacoes

- Endpoint `/api/send-email`
- Template para novo agendamento
- Template para aprovacao/rejeicao com justificativa

## Modelagem Inicial do Firestore

### `usuarios/{uid}`

- `uid`
- `nome`
- `email`
- `papel`: `aluno | coordenador`
- `campus`
- `fotoUrl`
- `treinamentos`: mapa com flags por maquina critica
- `createdAt`
- `updatedAt`
- `ultimoLoginEm`

### `equipamentos/{slug}`

- `nome`
- `tipo`
- `status`: `operacional | manutencao`
- `requerTreinamento`
- `materiaisProibidos`
- `observacoes`
- `updatedAt`

### `agendamentos/{id}`

- `solicitanteUid`
- `solicitanteNome`
- `solicitanteEmail`
- `equipamentoId`
- `status`
- `dataSolicitada`
- `turno`
- `detalhesTecnicos`
- `justificativa`
- `avaliadoPor`
- `avaliadoEm`
- `createdAt`
- `updatedAt`
