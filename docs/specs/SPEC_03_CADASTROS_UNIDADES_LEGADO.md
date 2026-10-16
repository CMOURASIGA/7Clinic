# SPEC 03 | CADASTROS UNIDADES LEGADO

**Estado:** PLANNED, não autorizada.
**Pré-requisito:** SPEC anterior APPROVED e autorização expressa.

## Objetivo
Cadastros e importação legada.

## Entregáveis
Paciente com carteira do convênio, profissional, especialidade, convênio, unidade e vínculo multiunidade; importação por arquivo mapeado.

## Regras críticas
Não integrar portal do convênio; deduplicar, preservar histórico e exigir amostra autorizada; importar sem custo adicional dentro de escopo acordado.

## Critérios de aceite
Conferência de contagens, duplicados, erros, rollback e acessos.

## Cenários obrigatórios
1. Fluxo principal com dados sintéticos e estados coerentes.
2. Fluxos de erro, duplicidade, cancelamento e autorização negada.
3. Permissões por perfil e unidade, sem vazamento clínico.
4. Regressão dos fluxos já homologados, desktop/tablet/celular.
5. Evidências com Preview, SHA, testes e matriz PASS/FAIL/NOT TESTED.

## Restrições
Não iniciar sem autorização, não fazer merge sem Human Validation, não usar dados reais no Preview público. Detalhes ainda não definidos devem virar decisões explícitas, nunca suposições do desenvolvedor.
