# SPEC 01 | Preparação técnica da persistência e identidade

**Estado:** proposta para aprovação, sem migração SQL, provisionamento ou dados reais.
**Base funcional:** SPEC 00 CP-04, CP-05 e CP-06. A homologação humana integrada foi adiada, não dispensada. O PR #1 permanece Draft.

## 1. Arquitetura proposta

- Manter Next.js App Router e TypeScript. Separar interface, casos de uso, regras de domínio e adaptadores de persistência. Os comandos de `lib/domain.ts` são a referência comportamental; o navegador deixa de ser a fonte de verdade quando houver backend.
- Usar Supabase Auth para identidade e Postgres para estado transacional. Sessão SSR com clientes de browser e servidor, cookies e renovação conforme documentação vigente. Verificar identidade no servidor, autorizar cada operação por perfil, unidade e vínculo e aplicar RLS no banco. Não confiar em seletor visual de perfil ou `user_metadata` para autorização.
- Operações que mudam mais de uma entidade, em especial confirmação, reversão, conciliação e transferência, devem ser atômicas numa transação controlada no servidor/banco. Registrar evento e resultado no mesmo commit. Não usar chave privilegiada no browser.
- Consultas de agenda, prontuário, financeiro e gestão devem usar projeções específicas e autorização própria. Não transportar conteúdo clínico para payloads de gestão, auditoria genérica, logs ou notificações.
- Ambientes isolados de desenvolvimento, preview com massa sintética e produção, com migrações versionadas. Não habilitar dados reais antes de testes de isolamento, backup/restore e homologação integrada.

## 2. Modelo lógico proposto

IDs UUID estáveis, timestamps UTC, `created_at`, `updated_at` e `version` para concorrência nos registros mutáveis. `unit_id` é obrigatório nas operações vinculadas à unidade. Valores monetários em `numeric(12,2)` ou centavos inteiros, nunca ponto flutuante. Constraints e FKs reforçam a lógica de domínio.

| Conjunto | Entidades e vínculos principais | Proteção/invariante |
| --- | --- | --- |
| Organização | `units`, `user_profiles` (referência a `auth.users`), `user_unit_memberships`, `professional_profiles`, `professional_units` | Dois registros de unidade no cenário inicial; acesso por vínculo ativo e papel efetivo na base |
| Cadastro | `patients`, `insurers`, `patient_coverage` e identificadores de carteira | Separar dados pessoais de projeções operacionais; unicidade de carteira conforme convênio e unidade/organização, decisão pendente |
| Agenda | `appointments`, `appointment_events`, `policy_versions`, `appointment_exceptions` | Mesmo ID em edição/reversão; transições explícitas com motivo, ator, antes/depois e versão; restrição de colisão de paciente/profissional para slots ativos |
| Clínica | `clinical_notes`, `clinical_note_versions`, `clinical_addenda`, `clinical_invalidation_events` | Rascunho editável; final imutável com adendos; invalidação justificada sem exclusão física; acesso ao profissional vinculado e perfil clínico autorizado |
| Financeiro | `production_entries`, `receivables`, `payables`, `settlement_events`, `financial_reversal_events`, `payout_rule_versions` | Confirmação gera produção e contas uma única vez; conciliações de recebimento e repasse independentes; reabertura antes da reversão; histórico preservado |
| Operação | `notification_events`, `audit_events` e projeções de pendências | Derivar estado vigente, evitar notificações duplicadas por chave de evento; auditoria sem texto clínico ou segredo |

As tabelas de financeiro devem guardar os valores e a regra vigentes no momento da confirmação. Mudança da regra de repasse afeta apenas novas confirmações. Convênio e unidade do lançamento são fotografados para histórico; alterações posteriores do cadastro não reescrevem lançamentos anteriores. Adendos e evolução clínica nunca são apagados por reversão financeira.

## 3. Papéis e segregação proposta

| Perfil | Acesso necessário | Negado por padrão |
| --- | --- | --- |
| Recepção | Pacientes e agenda das unidades autorizadas; agendar, editar, confirmar, falta, cancelar e reversões elegíveis | Texto clínico e conciliação financeira |
| Profissional | Própria agenda nas unidades vinculadas; histórico clínico mínimo necessário do paciente atendido; notas e adendos próprios | Agenda alheia sem vínculo, contas e regras financeiras |
| Financeiro | Produção, contas, conciliações e reversões nas unidades autorizadas; referências operacionais mínimas | Corpo de evolução clínica e administração de perfis |
| Gestão | Indicadores consolidados ou unidades autorizadas, políticas e exceções, pendências sem texto clínico | Conteúdo clínico por padrão; eventual acesso clínico exige papel específico e decisão formal |

Um usuário pode ter mais de um papel, com concessões explícitas, escopo de unidade e revogação. Verificar autorização em cada comando e leitura, inclusive ao consultar por ID direto. Transferência entre unidades exige permissão na origem e destino e disponibilidade profissional, sem recriar atendimento nem produção. O piloto com apenas duas unidades não deve fixar `u1/u2` no esquema.

## 4. Estados, transações e rastreabilidade

- `scheduled → confirmed`: validar bloqueios, exceção e conflito; criar produção, receber e pagar uma vez com chave única `appointment_id`; prontuário fica pendente em paralelo.
- `scheduled → absent/cancelled` e correções: registrar motivo; reabrir slot só após checar concorrência. Edição e transferência preservam ID e evento histórico.
- `confirmed → scheduled/cancelled`: exigir tratamento explícito de evolução e conciliações; reversão financeira com referência ao lançamento original e motivo. Lançamento revertido não integra saldo, mas continua no histórico.
- Nota clínica: `pending → draft → final`; versão de rascunho, finalização, adendo e invalidação são eventos rastreáveis. Final não deve ser sobrescrito. Motivo e responsável obrigatórios em invalidação.
- Bloqueios, liberações e configurações são versionados. Central de pendências e indicadores vêm do estado vigente, com contagem distinta por atendimento e evento idempotente, sem dupla contagem.
- Cada comando terá `idempotency_key` de requisição, `expected_version` e `actor_user_id`; conflito de versão retorna erro recuperável. O servidor não aceita ator, valor ou permissão declarados pelo cliente como verdade.

## 5. RLS e dados clínicos

- Criar grants explícitos apenas para relações expostas, habilitar RLS em todas as tabelas expostas e testar políticas para leitura, escrita e `UPDATE` com `USING` e `WITH CHECK`. `TO authenticated` sozinho não concede acesso a uma linha. Negar `anon` para dados operacionais.
- Basear políticas em `auth.uid()` e vínculos ativos no banco, com índices em `unit_id`, `professional_id`, `patient_id` e colunas usadas pelos predicados. Claims editáveis pelo usuário não concedem papel. Revisar atualização de sessão e revogação de acesso.
- Isolar corpo clínico em tabela/schema e API com grants limitados, sem views que contornem RLS. Se houver view exposta, exigir `security_invoker` e testar a política subjacente. Função privilegiada, se indispensável, fica em schema privado, escopo estreito e revisão de segurança.
- Testes negativos com usuários de unidades distintas, profissional não vinculado, Financeiro e Gestão tentando acessar evolução, URL/ID direto, tentativa de reatribuir `unit_id` e conta desativada. Dados sintéticos em todos os testes e previews.
- Definir retenção, acesso de emergência, exportação, exclusão, criptografia, MFA e acesso administrativo com responsável pelo tratamento antes de dados reais. A arquitetura não afirma conformidade LGPD por si só.

## 6. Migração do local-first

1. Congelar e versionar o contrato do domínio SPEC 00, incluindo invariantes e fixtures sintéticas. Criar interfaces de repositório e casos de uso sem substituir a experiência demonstrativa existente.
2. Implementar esquema e políticas em ambiente isolado **após aprovação**, aplicar migrações versionadas, gerar tipos e portar comandos um a um com testes de equivalência.
3. Fazer importação somente de massa sintética no preview, mapeando IDs `p*`, `pr*`, `a*`, `fin:*` a UUIDs numa tabela de importação de teste. Validar contagens, unicidade, valores, eventos e acesso cruzado. Não migrar `localStorage` dos navegadores públicos para o banco.
4. Habilitar adaptador remoto por ambiente/flag com caminho demonstrativo preservado; comparar saídas e métricas. Cortar para persistência real somente após autorização, testes de isolamento, restore e Human Validation integrada. Desativar escrita local operacional e definir tratamento de cache/sessão.

## 7. Testes, deploy e rollback

- A cada entrega: testes unitários de transição, integração transacional, RLS com perfis/unidades cruzados, idempotência/conflito, typecheck, lint, build, smoke desktop/mobile e Preview sintético. E2E cobre ciclo de agenda, clínica, financeiro, reversões e persistência entre sessões.
- Testar duas confirmações concorrentes, reconfirmação após reversão, conciliação parcial, transferência, duplicidade de carteira e slots, invalidação clínica, acesso cruzado e indicadores após cada etapa.
- Antes de migração: backup verificável, ensaio de restore isolado, migração de avanço e plano de reversão de aplicação. Mudanças destrutivas de esquema exigem expandir, migrar e só depois remover em entrega posterior. Rollback de código não deve apagar eventos financeiros ou clínicos já escritos.
- Monitorar falhas por comando, latência, conflitos, erros de política e divergências de saldo, sem nomes, carteiras ou evolução nos logs. A janela de corte e o RPO/RTO dependem de definição do negócio.

## 8. Decisões para aprovação antes do provisionamento

1. Escopo jurídico/organizacional do tenant e compartilhamento do paciente entre unidades; papéis acumuláveis, gestão central e suporte administrativo.
2. Método de login, MFA, convite, suspensão e recuperação; quem concede e revoga vínculos de unidade e de profissional.
3. Identidade e unicidade de paciente/carteira, campos mínimos, qualidade e origem do legado; nenhuma carga real neste momento.
4. Política de conflitos de horário, atendimento simultâneo, transferências, cancelamentos tardios, correção de falta e exceção gerencial.
5. Regras contratuais de receita, glosa, repasse, ajustes, recebimentos parciais e conciliação; o R$ 120 de receita é apenas fixture e o repasse padrão de R$ 18 requer vigência.
6. Escopo clínico: campos, autoria, acesso emergencial, invalidação, retenção e adendos. Aprovar responsabilidades de privacidade antes de dado real.
7. Ambientes, região, segregação de projetos, backups, frequência de restore, RPO/RTO, retenção de auditoria e responsável pelo corte.

## Referências consultadas em 16/10/2026

- https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&queryGroups=framework&router=app
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically

As APIs e padrões serão verificados novamente antes da implementação. O changelog registra alteração de exposição automática das tabelas na Data API; grants explícitos e RLS devem ser testados separadamente.
