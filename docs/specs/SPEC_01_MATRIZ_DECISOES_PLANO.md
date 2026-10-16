# SPEC 01 | Matriz de decisões e plano incremental

**Estado:** proposta para aprovação. Base: SPEC 00 integrada tecnicamente em `develop` pelo PR #1. Human Validation integrada adiada. Nenhuma decisão desta matriz autoriza carga real, migração definitiva ou provisionamento.

**Legenda:** DT = decisão técnica recomendada; DN = decisão de negócio da clínica; SP = segurança ou privacidade; DI = dependência para implementação; DP = dependência apenas para produção. Cada linha indica quem deve decidir e o ponto de bloqueio. O caminho recomendado é uma proposta, não uma regra clínica aprovada.

| ID | Classe e momento | Decisão, alternativas e impacto | Recomendação e responsável |
| --- | --- | --- | --- |
| D01 | DN + SP, DI | Cadastro compartilhado entre unidades ou separado por unidade. Compartilhado facilita histórico e evita duplicidade, mas amplia superfície de acesso; separado isola mais, mas exige conciliação de identidade e dificulta transferência. | Propor paciente único na organização, com atendimentos e permissões por unidade e acesso clínico por vínculo assistencial. Clínica e responsável por privacidade aprovam antes da modelagem final. |
| D02 | DN + SP, DI | Quem cria, altera, suspende usuários e concede papéis/unidades: gestor local, administrador central ou fluxo de dupla aprovação. Autogestão local acelera operação e aumenta risco de concessões indevidas. | Administração central com concessões explícitas e trilha de quem aprovou; gestor local solicita, sem autoelevação. Clínica define responsáveis e substitutos. |
| D03 | DT + SP, DI | Identidade por Supabase Auth, perfis e vínculos em tabelas próprias, ou autorização por claims. Claims desatualizadas atrasam revogação. | Auth para identidade; autorização por vínculos ativos no banco, RLS e validação no servidor. Não usar metadados editáveis pelo usuário. Equipe técnica revisa. |
| D04 | DN, DI | Horários simultâneos por profissional e paciente, duração, tolerância, encaixe, atendimento em grupos e conflito entre unidades. Exclusividade rígida impede encaixes; permissiva permite colisões. | Preservar a regra atual de slot exclusivo para o MVP, com exceção formal se a clínica confirmar grupos/encaixes. Clínica define duração e capacidade antes de constraints finais. |
| D05 | DN, DI | Correção de falta, cancelamento tardio, transferência de atendimento confirmado e política de reocupação. Reabrir sem checar slot pode duplicar; bloquear toda correção impede reparo operacional. | Preservar mesmo ID, motivo e histórico; checar conflito e exigir tratamento clínico/financeiro explícito. Clínica confirma prazos, papéis e exceções. |
| D06 | DN, DI para valores reais | Base de receita por convênio/particular, glosas, cobrança parcial e regra de repasse. Valor fictício R$ 120 não é preço; regra demonstrativa de R$ 18 não comprova contrato. | Modelar versões de regras e fotografar valores no lançamento, sem fixar tabela contratual. Clínica/Financeiro aprovam parâmetros antes de cálculo real. |
| D07 | DN + SP, DI | Recebíveis e repasses podem ser parciais, estornados ou ajustados? Modelo booleano do MVP não representa pagamentos parciais. | Projetar eventos de conciliação por valor, origem e motivo com saldo derivado, mantendo caminho simples para quitação integral. Financeiro define cenários e alçadas. |
| D08 | DN + SP, DI | Retificação de rascunho, nota final e adendo; quem pode invalidar, prazo e acesso emergencial. Sobrescrever final perde rastreabilidade; negar correção bloqueia segurança assistencial. | Rascunho versionado, final imutável, adendo e invalidação justificada sem exclusão. Clínica, responsável técnico e privacidade aprovam prazo, autoria e acesso emergencial. |
| D09 | SP, DP antes de dado real | Retenção, exportação, exclusão e logs clínicos; acesso a histórico entre unidades e suporte. Guardar indefinidamente ou registrar texto clínico em auditoria amplia exposição. | Separar conteúdo clínico e metadados de auditoria, negar acesso por padrão; aprovar política de retenção e requisições do titular com responsável por privacidade antes de produção. |
| D10 | DT + SP, DI | Projetos separados para desenvolvimento, preview e produção ou um banco com schemas. Compartilhar banco arrisca mistura de dados e permissões. | Projetos isolados, preview somente sintético, migrações versionadas e segredos por ambiente. Equipe técnica define orçamento e pipeline antes do provisionamento. |
| D11 | SP + DN, DP antes de dado real | Região, backups, retenção, frequência de restore e metas RPO/RTO. Custo e tempo de recuperação variam por plano e criticidade. | Escolher região com clínica e privacidade; ensaiar restore e documentar RPO/RTO aceitos antes de produção. Não prometer meta sem plano contratado e teste. |
| D12 | DT, DI | Mudar todos os fluxos de uma vez ou adaptar por casos de uso. Troca total aumenta risco de regressão e rollback. | Interfaces de repositório, comandos transacionais um a um, fixtures sintéticas e comparação de invariantes. Sem importar localStorage público. Equipe técnica decide desenho detalhado. |
| D13 | DN + SP, DP | Legado: fontes, qualidade, deduplicação e consentimento/base aplicável. Migração cega duplica pacientes e contamina prontuário. | Inventário e ensaio em dados sintéticos primeiro; plano de limpeza, mapeamento, autorização e reconciliação com a clínica antes de carga real. |

## Checkpoints propostos

Cada checkpoint entrega SHA, Preview sintético, matriz PASS/FAIL/NOT TESTED e gates de testes, typecheck, lint, build e smoke desktop/mobile. Os checkpoints são incrementais na branch da SPEC 01 e dependem da aprovação da matriz e plano antes de implementar ou provisionar.

| Etapa | Entrega verificável | Dependência e gate |
| --- | --- | --- |
| CP-01 Contratos e segurança | ADRs das decisões D01 a D08, modelo lógico, estados, permissões por ação/unidade, contrato de repositório e plano de ambientes | Clínica aprova regras operacionais; segurança aprova acesso clínico. Revisão de ameaça e casos negativos documentados |
| CP-02 Fundação isolada | Após autorização de provisionamento: ambientes não produtivos, Auth, unidades, perfis/vínculos, esquema mínimo versionado, grants/RLS e testes cruzados | D01–D03 e D10 aprovadas; nenhuma PHI; acesso negado por padrão e restauração ensaiada |
| CP-03 Operação transacional | Pacientes sintéticos, agenda, transições, eventos, bloqueios e idempotência; adaptador remoto sob flag | D04–D05 aprovadas; testes de conflito e concorrência, identidade estável e no duplicate |
| CP-04 Clínica e financeiro | Notas/adendos/invalidações isolados, produção/contas/eventos de conciliação e reversões; indicadores derivados | D06–D08 aprovadas; RLS negativo, reconciliação de saldo e ausência de conteúdo clínico em gestão/logs |
| CP-05 Migração e estabilização | Ensaios sintéticos de importação, comparação local-first, E2E de quatro ambientes, rollback de aplicação e restore | D09–D13 resolvidas para operação real; Human Validation integrada e autorização específica antes de dados reais |

## Mínimo para iniciar implementação da SPEC 01

1. Aprovação expressa desta matriz e da divisão em checkpoints, com responsáveis pelas decisões de negócio e privacidade.
2. Definições D01–D05 e D08 suficientes para as tabelas e permissões de CP-02; D06–D07 antes de CP-04. Separação dos ambientes e orçamento de D10 aprovados antes de provisionar.
3. Escopo do CP-02 autorizado separadamente, inclusive projeto/região de desenvolvimento e custos. Somente dados sintéticos.
4. Critérios de RLS, teste de restauração e rollback aceitos. A Human Validation integrada da SPEC 00 continua pendente para antes da operação real.

## Integração técnica da SPEC 00

PR #1 integrado por merge commit `bf6581e5689309fa1676a613ef0585cd08d5bf03`. O commit técnico `1c63e3759ba25109d16933ee1f2274d77ec4cd35` é ancestral de `develop`. O status segue **TECHNICALLY COMPLETE — INTEGRATED HUMAN VALIDATION DEFERRED**. Nenhuma aprovação funcional definitiva foi registrada.
