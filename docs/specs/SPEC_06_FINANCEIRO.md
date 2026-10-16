# SPEC 06 | FINANCEIRO

**Estado:** PLANNED, não autorizada.
**Pré-requisito:** SPEC anterior APPROVED e autorização expressa.

## Objetivo
Produção financeira e conciliação.

## Entregáveis
Repasse inicial R$18 por consulta confirmada; contas a pagar profissionais e contas a receber convênios por período/unidade; recebimento manual conciliado.

## Regras críticas
Financeiro inicia simultaneamente à liberação do prontuário; guia preenchida fora do 7Clinic; receita prevista distinta de recebida; idempotência e estornos.

## Critérios de aceite
Uma confirmação gera um lançamento, reprocessar não duplica; conciliação e totais corretos.

## Cenários obrigatórios
1. Fluxo principal com dados sintéticos e estados coerentes.
2. Fluxos de erro, duplicidade, cancelamento e autorização negada.
3. Permissões por perfil e unidade, sem vazamento clínico.
4. Regressão dos fluxos já homologados, desktop/tablet/celular.
5. Evidências com Preview, SHA, testes e matriz PASS/FAIL/NOT TESTED.

## Restrições
Não iniciar sem autorização, não fazer merge sem Human Validation, não usar dados reais no Preview público. Detalhes ainda não definidos devem virar decisões explícitas, nunca suposições do desenvolvedor.
