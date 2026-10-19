# SPEC 01 CP-02 | Fundação local e evidências

**Base:** `develop` em `e6410c2e29f48c9ab62ef9e4a0594db229e0a89c`. **Branch:** `feat/spec-01-cp02-foundation`. PR Draft, sem merge. A arquitetura CP-01 mantém **ARCHITECTURE APPROVED WITH BUSINESS AND PRIVACY RESERVATIONS**; a SPEC 00 mantém **TECHNICALLY COMPLETE — INTEGRATED HUMAN VALIDATION DEFERRED**.

## Escopo entregue

- Migração CLI versionada em `supabase/migrations/20261019121833_cp02_foundation.sql`; `supabase/config.toml` limita a Data API a `public` e `api`, sem exposição automática de tabelas. `app_private` não é schema exposto.
- Organização, unidades, perfis, concessões com vigência e revogação, profissionais, pacientes, referências mínimas de atendimentos, vínculos assistenciais e eventos de acesso. FKs compostas impedem vínculos entre organizações. Não há corpo clínico nem conta financeira.
- Grants SELECT explícitos e RLS em todas as 11 tabelas expostas. Sem escrita direta de usuários nas tabelas. Três funções administrativas em `api` exigem administrador central ativo, proíbem autoconcesão/autossuspensão e registram evento na mesma transação. Gestão não recebe administração automaticamente.
- `/foundation` e `/api/foundation/session` usam Supabase Auth com cookies e `getClaims()`; a sessão consulta perfis e grants ativos no banco. `/api/foundation/access` usa as funções administrativas com identidade do usuário, sem service role. O MVP local-first e seus quatro workspaces continuam independentes.
- `supabase/seed.sql` cria somente dados sintéticos. `scripts/seed-local-auth.mjs` cria identidades de teste pelo Auth local e recusa URL que não seja localhost. Variáveis e senha ficam fora do Git. Para recriação limpa: `supabase db reset` e depois `npm run seed:local:auth`, quando Docker estiver disponível.

## Matriz S01–S07 e S11

| ID | Banco PostgreSQL local em processo | Supabase Auth + PostgREST local | Evidência e limite |
| --- | --- | --- | --- |
| S01 | PASS | NOT TESTED | Papel anon sem SELECT; endpoint Auth local não iniciou. |
| S02 | PASS | NOT TESTED | UUID de paciente e atendimento de outra unidade retornam zero linhas. |
| S03 | PASS parcial | NOT TESTED | Vínculo assistencial próprio visível, outro paciente negado; corpo clínico definitivo é CP-04. |
| S04 | PASS parcial | NOT TESTED | Financeiro/Gestão não leem `care_links`; corpo clínico definitivo ainda não existe. |
| S05 | PASS no SQL | NOT TESTED | Mesmo UID perde acesso depois de revogação; sessão HTTP real não testada. |
| S06 | PASS | NOT TESTED | UPDATE direto de tenant/unidade negado; FKs compostas rejeitam relação cruzada. |
| S07 | PASS parcial | NOT TESTED | UID sem grant não lê outro tenant, autoatribuição negada; claim HTTP forjada não testada. |
| S11 | PASS parcial | NOT TESTED | UPDATE direto de unidade negado; comando transacional de transferência é CP-03. |

Testes adicionais locais: concessão/revogação auditada, revogação repetida sem segundo evento, suspensão, grant duplicado, validade expirada, FK cruzada e autoconcesão. `tests/seed-db.mjs` cria **duas instâncias PostgreSQL novas**, aplica migração e seed em cada uma, e confere contagens. Esses testes usam PGlite, um PostgreSQL em processo, com `auth.uid()` e papéis simulados. Não equivalem a um teste do serviço Supabase Auth ou da configuração real do PostgREST.

## Bloqueio ambiental e execução pendente

`supabase start` com CLI 2.121.0 retornou `DockerLifecycleInspectError: docker: command not found (podman also not found)`. Portanto, o Supabase local completo não iniciou. Não há evidência de login, renovação de sessão, revogação em HTTP ou execução da seed de Auth no serviço real. **Não declarar CP-02 aprovado nem READY FOR TECHNICAL VALIDATION plena** até esse gate passar.

O smoke visual local também ficou **NOT TESTED nesta execução**: o runner não possui Chromium e a instalação pelo Playwright recebeu arquivo truncado do CDN. Os 21 testes de regressão, typecheck, lint e build passaram; não substituir o smoke desktop/mobile por esses gates.

Smoke HTTP limitado no build local: `/` e `/foundation` responderam 200, `/api/foundation/session` respondeu 503 sem configuração local, como esperado. Isso não valida login nem responsividade.

Em uma máquina com Docker/Podman e sem projeto remoto:

1. `npm ci`, `npx supabase start`, `npx supabase db reset`.
2. Obter somente as chaves locais com `npx supabase status -o env` e configurar `.env.local` conforme `.env.example`, sem publicar valores.
3. Definir senha sintética local de pelo menos 12 caracteres; `npm run seed:local:auth`.
4. Testar login em `/foundation`, `GET /api/foundation/session`, concessão/revogação/suspensão via `POST /api/foundation/access`, UUIDs cruzados na Data API, refresh com token anteriormente válido e Security Advisor local. Repetir `db reset` e as negativas. Registrar PASS/FAIL por cenário e corrigir antes da validação técnica.

Nenhum projeto Supabase remoto foi criado, nenhum serviço pago ativado e nenhuma credencial de produção usada. A alternativa Free em São Paulo (`sa-east-1`) continua apenas planejada e depende de autorização separada.

## CP-03, somente desenho

Persistir atendimento com ID estável e `expected_version`; um comando transacional confirma e gera ciclo financeiro uma vez, identificado por chave idempotente e hash do payload. Reversão registra evento e exige tratamento explícito de clínica/conciliação. Transferência verifica grants e vínculos da origem e do destino na mesma transação. Adaptador de repositório mantém o MVP localStorage disponível enquanto a persistência real é ativada por ambiente e validada com massa sintética. Duração, encaixes, prazos, regras financeiras e retificação continuam hipóteses que requerem decisão da clínica e privacidade antes das constraints definitivas. Não há código CP-03 nesta branch.
