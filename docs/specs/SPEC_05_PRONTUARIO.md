# SPEC 05 | PRONTUARIO

**Estado:** PLANNED, não autorizada.
**Pré-requisito:** SPEC anterior APPROVED e autorização expressa.

## Objetivo
Prontuário obrigatório após confirmação.

## Entregáveis
Evolução por profissional, histórico, autoria, adendos e pendências por prazo.

## Regras críticas
Atraso notifica; prontuário não é pré-requisito para financeiro; acesso clínico restrito.

## Critérios de aceite
Após confirmar, prontuário liberado; pendente gera alerta; correções auditáveis.

## Cenários obrigatórios
1. Fluxo principal com dados sintéticos e estados coerentes.
2. Fluxos de erro, duplicidade, cancelamento e autorização negada.
3. Permissões por perfil e unidade, sem vazamento clínico.
4. Regressão dos fluxos já homologados, desktop/tablet/celular.
5. Evidências com Preview, SHA, testes e matriz PASS/FAIL/NOT TESTED.

## Restrições
Não iniciar sem autorização, não fazer merge sem Human Validation, não usar dados reais no Preview público. Detalhes ainda não definidos devem virar decisões explícitas, nunca suposições do desenvolvedor.
