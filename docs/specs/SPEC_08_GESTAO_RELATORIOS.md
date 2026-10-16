# SPEC 08 | GESTAO RELATORIOS

**Estado:** PLANNED, não autorizada.
**Pré-requisito:** SPEC anterior APPROVED e autorização expressa.

## Objetivo
Gestão separada e relatórios.

## Entregáveis
Dashboard operacional e financeiro por unidade e consolidado; presença/faltas, financeiro por profissional, contas a pagar/receber por período.

## Regras críticas
Valores previstos x recebidos separados; transferências não duplicam contagens; exportações com autorização.

## Critérios de aceite
Conferência de totais com massa conhecida, filtros e segurança.

## Cenários obrigatórios
1. Fluxo principal com dados sintéticos e estados coerentes.
2. Fluxos de erro, duplicidade, cancelamento e autorização negada.
3. Permissões por perfil e unidade, sem vazamento clínico.
4. Regressão dos fluxos já homologados, desktop/tablet/celular.
5. Evidências com Preview, SHA, testes e matriz PASS/FAIL/NOT TESTED.

## Restrições
Não iniciar sem autorização, não fazer merge sem Human Validation, não usar dados reais no Preview público. Detalhes ainda não definidos devem virar decisões explícitas, nunca suposições do desenvolvedor.
