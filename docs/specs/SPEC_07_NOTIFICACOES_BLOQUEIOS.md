# SPEC 07 | NOTIFICACOES BLOQUEIOS

**Estado:** PLANNED, não autorizada.
**Pré-requisito:** SPEC anterior APPROVED e autorização expressa.

## Objetivo
Motor de regras de pendências.

## Entregáveis
Alertas de confirmação e prontuário, prazos, bloqueios configuráveis por gestão, exceções e trilha.

## Regras críticas
Bloqueio é política da gestão; exceção justificada; alertas por perfil e unidade, sem duplicação.

## Critérios de aceite
Ativar/desativar regra, bloquear, liberar, resolver e auditar.

## Cenários obrigatórios
1. Fluxo principal com dados sintéticos e estados coerentes.
2. Fluxos de erro, duplicidade, cancelamento e autorização negada.
3. Permissões por perfil e unidade, sem vazamento clínico.
4. Regressão dos fluxos já homologados, desktop/tablet/celular.
5. Evidências com Preview, SHA, testes e matriz PASS/FAIL/NOT TESTED.

## Restrições
Não iniciar sem autorização, não fazer merge sem Human Validation, não usar dados reais no Preview público. Detalhes ainda não definidos devem virar decisões explícitas, nunca suposições do desenvolvedor.
