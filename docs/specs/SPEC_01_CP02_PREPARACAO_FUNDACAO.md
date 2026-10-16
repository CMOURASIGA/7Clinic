# SPEC 01 | CP-02 Preparação técnica da fundação

**Estado:** preparação autorizada, sem projeto Supabase, migração definitiva ou dado real. Referência: [CP-01 aprovado com ressalvas e integrado tecnicamente](SPEC_01_CP01_CONTRATOS_SEGURANCA.md).

## Contratos de identidade e cadastro

| Entidade | Relação e invariantes propostas |
| --- | --- |
| `organizations` | Tenant por ID estável; 1:N unidades, pacientes e grants. Toda FK dependente preserva a organização. |
| `units` | FK organização, código único por organização; inativação conserva histórico. Duas unidades fictícias. |
| `auth.users`, `user_profiles` | Auth UID 1:1 com perfil operacional mínimo; email não é chave de paciente nem autoridade de acesso. |
| `access_grants` | Usuário, organização, papel, escopo organizacional ou unidade, concessor, validade, revogação e motivo. Cada concessão independente e auditável. |
| `professionals`, `professional_units` | Profissional vinculado a identidade e a N unidades; vínculo profissional não concede acesso clínico indiscriminado. |
| `patients`, `patient_units` | Paciente único por organização, associado a N unidades; cadastro mínimo visível só com grant da unidade; prontuário segregado por vínculo assistencial. |
| `appointments`, `care_links` | Referências mínimas por organização, unidade, paciente e profissional para testar escopo. Estados e ID estável preservam SPEC 00; agenda física definitiva é posterior. |
| `access_events` | Evento append-only de concessão, revogação, exceção e correlação; sem corpo clínico ou segredo. |

FKs compostas ou validação equivalente impedem referência entre organizações. Índices por tenant, unidade, usuário e grant ativo serão dimensionados pelas consultas. D01 (paciente único) é hipótese arquitetural: não deduplicar por nome nem importar legado. D02/D03 exigem confirmação da clínica e de privacidade antes de constraints e políticas definitivas.

## Administração e Auth

Administrador central recebe grant específico, separado de Gestão. A clínica define quem concede, revisa e revoga; autoconcesão e elevação de escopo são negadas. Fluxo planejado: convite apenas sintético, login Supabase Auth, sessão validada no servidor, consulta a grants ativos no banco em cada ação sensível, evento de auditoria e revogação eficaz mesmo com token ainda válido. Claims editáveis (`user_metadata`) e cache de JWT não autorizam ações. Acesso emergencial e revisão dupla são decisões de privacidade pendentes.

No Next.js App Router, cliente usa URL e chave publicável; servidor usa sessão por cookies e verifica identidade antes do caso de uso. O banco revalida organização, unidade e vínculo. Chaves secretas/service role nunca entram no browser, e não substituem a identidade do usuário nas operações ordinárias. Fixar versões de SDK/SSR e testar renovação de sessão na implementação autorizada.

## Grants e RLS a especificar na implementação

- Negar `anon` nos dados; conceder a `authenticated` somente SELECT de projeções mínimas e EXECUTE de comandos autorizados. Nenhum UPDATE direto de grants, tenant ou unidade.
- Habilitar RLS em toda tabela exposta, incluindo referências. Separar SELECT, INSERT, UPDATE; UPDATE requer SELECT, `USING` e `WITH CHECK`. Sem DELETE de históricos. Views expostas com invocador; preferir schema privado para tabelas sensíveis.
- Predicado: `auth.uid()` válido, grant ativo para organização e unidade, associação paciente-unidade e vínculo assistencial quando necessário. Admin central tem escopo organizacional explícito. Conferir OLD e NEW nas mutações; payload não escolhe ator ou papel.
- Função privilegiada excepcional em schema não exposto, EXECUTE estrito, `search_path` fixo e revisão de elevação. Não usar `security definer` para contornar RLS. Grants e RLS são controles distintos e ambos precisam de teste negativo.
- Corpo clínico e contas definitivas não são criados no CP-02; projeções de referência não revelam conteúdo por joins, UUID direto ou views.

## Fixtures sintéticas

Organização `7clinic-demo`; unidades `demo-centro` e `demo-norte`; `Paciente Alfa` e `Paciente Beta`; `Profissional Alfa` e `Profissional Beta`. Identidades `admin@example.test`, `recepcao.centro@example.test`, `recepcao.norte@example.test`, `profissional.alfa@example.test`, `profissional.beta@example.test`, `financeiro@example.test`, `gestao@example.test`. Incluir conta revogada, sem grant e outra organização fictícia para negar acesso cruzado. Gerar senhas localmente fora do Git, sem envio de email real. A massa é descartável e não deriva de registros da clínica.

## Cenários negativos: aplicação CP-02

| ID | CP-02 | Critério futuro |
| --- | --- | --- |
| S01 | Integral | Anônimo não consulta nem enumera paciente, agenda ou notas. |
| S02 | Integral para cadastro e referência de agenda | Recepção de uma unidade nega UUID, join, filtro e UPDATE na outra. |
| S03 | Parcial; corpo clínico CP-04 | Profissional sem vínculo não lê referência assistencial alheia. |
| S04 | Parcial; corpo clínico CP-04 | Financeiro/Gestão sem grants, view ou join de conteúdo. |
| S05 | Integral | Grant revogado nega com token ainda válido. |
| S06 | Integral | Troca direta de tenant/unidade negada com `WITH CHECK` e FK. |
| S07 | Integral | Papel, organização e `user_metadata` forjados não elevam acesso. |
| S08 | CP-03 | Confirmação concorrente e repetição idempotente. |
| S09 | CP-03 | Chave reutilizada com payload distinto dá conflito. |
| S10 | CP-04 | Conciliação inválida preserva saldo. |
| S11 | Parcial; transferência CP-03 | Falta de grant no destino nega autorização. |
| S12 | CP-03/CP-05 | Notificação obsoleta revalida estado. |

**Todos S01–S12: NOT TESTED no backend.** A execução futura usa usuários sintéticos reais de Auth, consultas diretas, joins, views e escrita; registra PASS/FAIL/NOT TESTED por perfil e unidade. Inspeção do contrato não é PASS.

## Ambiente, custo, restauração e rollback

Alternativa A preferencial: desenvolvimento local e **um** projeto Supabase Free não produtivo, somente após autorização específica. Região proposta: **São Paulo, `sa-east-1`**; privacidade deve avaliar residência, subprocessadores e metadados, sem presumir localização integral no Brasil. Estimativa incremental Supabase: **US$ 0/mês**, condicionada a vaga no limite de dois projetos Free ativos e às cotas. Free inclui 500 MB de banco, 5 GB de egress e 50 mil usuários ativos mensais; pode pausar após uma semana de inatividade e não oferece backup automático. Outros custos e consumo fora do plano não estão incluídos. Fontes oficiais, consultadas em 16/10/2026: [preços](https://supabase.com/pricing), [regiões](https://supabase.com/docs/guides/platform/regions), [backups](https://supabase.com/docs/guides/platform/backups).

Separar local e Preview sintético em URLs, chaves e contas; URL/chave publicável são as únicas variáveis de cliente. Senhas do banco, chave secreta e service role ficam apenas no servidor e cofre do ambiente; `.env*` locais fora do Git, exemplo sem valores. Inventariar acesso ao dashboard, rotação e revogação. Preview protegido. Nenhum projeto produtivo neste checkpoint.

Sequência futura, **não executada**: fixar versões do CLI e dependências; criar ambiente autorizado; versionar migrações pequenas e expansivas; aplicar em local limpo; revisar grants/RLS, índices e advisors; ensaiar testes; aplicar no projeto sintético. Não prometer reversão automática de SQL destrutivo. Rollback de aplicação mantém compatibilidade expandir/migrar/contrair. Exportar manualmente somente fixtures sintéticas, restaurar em instância descartável, comparar contagens, IDs e negativas, registrar tempo e responsável. Pausa/restauração do Free não substitui cópia validada. Produção exigirá RPO/RTO, retenção e plano aprovados.

## Gates e pendências

1. Antes de implementação física: clínica confirma autoridade de acessos e hipótese de paciente único com visibilidade por unidade (D01–D03); privacidade aprova escopo. Sem isso, não fixar constraint/política definitiva.
2. Antes do provisionamento: aprovar expressamente um projeto não produtivo, região `sa-east-1`, custo/teto e capacidade Free da conta. Esta documentação não o cria.
3. Segurança confirma grants, revogação e cenários negativos; RLS só recebe PASS após execução no backend. CP-02 físico terá PR próprio, testes, typecheck, lint, build, smoke e restore sintético.
4. Encaixes, duração e cancelamento (D04–D05) bloqueiam regras físicas da agenda; contratos financeiros (D06–D07) bloqueiam financeiro; retificação, emergência e retenção (D08–D09) bloqueiam prontuário definitivo e operação real; backup de produção e legado real seguem pendentes.
5. PR #2 integrado tecnicamente em `develop`, sem aprovação das regras definitivas. Não avançar CP-03 automaticamente. SPEC 00 segue **TECHNICALLY COMPLETE — INTEGRATED HUMAN VALIDATION DEFERRED**.
