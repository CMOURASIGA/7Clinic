# SPEC 00 | MVP OPERACIONAL

**Estado:** IN DEVELOPMENT, autorizada em 16/10/2026.
**Pré-requisito:** aprovação para iniciar protótipo, cumprido. Checkpoints em andamento, sem autorização de merge.

## Objetivo
Protótipo local-first sem dados reais, com três ambientes e Maia simulada.

## Entregáveis
Recepção com filtros data/paciente/status e ações visualizar, editar, confirmar, falta; profissional com agenda e prontuário simulado; gestão com dashboard, financeiro e configuração de bloqueios.

## Regras críticas
Confirmar libera prontuário e financeiro paralelamente; bloqueio de confirmação pendente configurável; duas unidades e transferência sem duplicar.

## Critérios de aceite
Validar navegação, responsividade, persistência local e fluxos com dados fictícios. Nenhum Supabase definitivo.

## Cenários obrigatórios
1. Fluxo principal com dados sintéticos e estados coerentes.
2. Fluxos de erro, duplicidade, cancelamento e autorização negada.
3. Permissões por perfil e unidade, sem vazamento clínico.
4. Regressão dos fluxos já homologados, desktop/tablet/celular.
5. Evidências com Preview, SHA, testes e matriz PASS/FAIL/NOT TESTED.

## Restrições
Não iniciar sem autorização, não fazer merge sem Human Validation, não usar dados reais no Preview público. Detalhes ainda não definidos devem virar decisões explícitas, nunca suposições do desenvolvedor.
