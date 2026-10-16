# SPEC 04 | AGENDA RECEPCAO TRANSFERENCIAS

**Estado:** PLANNED, não autorizada.
**Pré-requisito:** SPEC anterior APPROVED e autorização expressa.

## Objetivo
Agenda e recepção operacional.

## Entregáveis
Filtros, ações rápidas, confirmação, falta, cancelamento, transferência entre duas unidades e histórico.

## Regras críticas
Status explícitos; bloqueio configurável por confirmações anteriores pendentes, com liberação excepcional justificada; sem duplicar produção.

## Critérios de aceite
Confirmar, faltar, bloquear, excepcionar e transferir com trilha e sem duplicação.

## Cenários obrigatórios
1. Fluxo principal com dados sintéticos e estados coerentes.
2. Fluxos de erro, duplicidade, cancelamento e autorização negada.
3. Permissões por perfil e unidade, sem vazamento clínico.
4. Regressão dos fluxos já homologados, desktop/tablet/celular.
5. Evidências com Preview, SHA, testes e matriz PASS/FAIL/NOT TESTED.

## Restrições
Não iniciar sem autorização, não fazer merge sem Human Validation, não usar dados reais no Preview público. Detalhes ainda não definidos devem virar decisões explícitas, nunca suposições do desenvolvedor.
