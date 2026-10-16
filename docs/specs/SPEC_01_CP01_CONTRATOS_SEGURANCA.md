# SPEC 01 | CP-01 Contratos e segurança

**Estado:** arquitetura CP-01 pronta para revisão. Documento e anexos são propostas; não há banco provisionado, migração SQL, conexão remota ou dados reais. A SPEC 00 segue **TECHNICALLY COMPLETE — INTEGRATED HUMAN VALIDATION DEFERRED**. PR #2 permanece Draft e sem merge em `develop`.

## Entregas e rastreabilidade

| Requisito CP-01 | Evidência |
| --- | --- |
| Modelo lógico, cardinalidades e invariantes | [Modelo lógico](SPEC_01_CP01_MODELO_LOGICO.md), entidades e grupos com diagrama de relações |
| ADRs D01–D08 e estados | [ADRs e estados](SPEC_01_CP01_ADRS_ESTADOS.md), hipóteses e aprovações pendentes explícitas |
| RBAC, RLS, grants, cenários negativos | [Acesso e segurança](SPEC_01_CP01_ACESSO_SEGURANCA.md), quatro workspaces e S01–S12 |
| Transações, auditoria, idempotência e concorrência | [Contratos e migração](SPEC_01_CP01_TRANSACOES_MIGRACAO.md) |
| Interfaces e migração local-first | [Contratos e migração](SPEC_01_CP01_TRANSACOES_MIGRACAO.md) |
| Ambientes, custos, riscos e CP-02 | [Infraestrutura e riscos](SPEC_01_CP01_INFRA_RISCOS_CP02.md) |

## Fronteiras de aprovação

| Grupo | Hipótese técnica atual | Decisão pendente e impacto |
| --- | --- | --- |
| Identidade e paciente, D01–D03 | Paciente único por organização; unidades e vínculos de acesso; administração central | Clínica define identidade, administradores e revogação; privacidade valida compartilhamento. **Bloqueia CP-02 físico** |
| Agenda, D04–D05 | Exclusividade por paciente/profissional, mesmo ID e histórico | Clínica define duração, grupos, encaixes, prazos e cancelamento. **Bloqueia constraints e fluxos do CP-03** |
| Financeiro, D06–D07 | Contas separadas e eventos por valor, regras versionadas | Clínica/Financeiro confirma contratos, glosas, parcial, ajustes e alçadas. **Bloqueia CP-04** |
| Clínica, D08–D09 | Rascunho versionado, final imutável, adendo e invalidação | Responsável técnico e privacidade definem retificação, emergência e retenção. **Bloqueia CP-04 e dado real** |
| Ambientes e legado, D10–D13 | Projetos separados, Preview sintético, migração por adaptador | Aprovação de região, custos e ambiente **bloqueia CP-02**; backup/RPO/RTO e legado real **bloqueiam produção** |

## Revisão de qualidade deste checkpoint

- Contratos preservam os fluxos da SPEC 00: confirmação produz financeiro e libera clínica em paralelo; reversões exigem tratamento explícito; ID estável; estados e saldos sem duplicidade; calendário como filtro dos dois workspaces.
- Matriz de segurança contém testes negativos e nega acesso clínico a Recepção, Financeiro e Gestão por padrão. RLS e grants serão implementados e testados somente em checkpoint autorizado posterior. Portanto, S01–S12 são **NOT TESTED no backend**, não PASS.
- Documentação submetida a `git diff --check`, testes existentes, typecheck, lint, build e smoke local com dados fictícios. O smoke confirma ausência de regressão no código base, mas não valida os desenhos futuros.
- A aprovação do CP-01 valida arquitetura proposta para refinamento; não homologa regras operacionais, privacidade, custos, implementação ou produção.

## Próximo gate

Revisar matriz e ADRs com responsáveis da clínica, de Financeiro, técnico assistencial e de privacidade. Registrar respostas por ID D01–D13. Só então autorizar CP-02 com escopo, região, ambiente e teto de custo explícitos. Human Validation integrada permanece pendente antes de operação real.
