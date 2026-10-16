# SPEC 09 | MAIA DEMONSTRATIVA

**Estado:** PLANNED, não autorizada.
**Pré-requisito:** SPEC anterior APPROVED e autorização expressa.

## Objetivo
Maia simulada no MVP; evolução condicionada a autorização.

## Entregáveis
Perguntas sobre pendências, indicadores e orientação de ações, com exemplos de respostas pré-definidas.

## Regras críticas
Rotular demonstração; não enviar dados sensíveis a IA externa, nem dar diagnóstico; IA real é mudança de escopo.

## Critérios de aceite
Simulação sem chamadas externas e respeitando visões/permissões.

## Cenários obrigatórios
1. Fluxo principal com dados sintéticos e estados coerentes.
2. Fluxos de erro, duplicidade, cancelamento e autorização negada.
3. Permissões por perfil e unidade, sem vazamento clínico.
4. Regressão dos fluxos já homologados, desktop/tablet/celular.
5. Evidências com Preview, SHA, testes e matriz PASS/FAIL/NOT TESTED.

## Restrições
Não iniciar sem autorização, não fazer merge sem Human Validation, não usar dados reais no Preview público. Detalhes ainda não definidos devem virar decisões explícitas, nunca suposições do desenvolvedor.
