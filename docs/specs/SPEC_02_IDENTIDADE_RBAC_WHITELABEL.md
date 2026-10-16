# SPEC 02 | IDENTIDADE RBAC WHITELABEL

**Estado:** PLANNED, não autorizada.
**Pré-requisito:** SPEC anterior APPROVED e autorização expressa.

## Objetivo
Autenticação, perfis e shell visual 7Commander whitelabel.

## Entregáveis
Recepção, profissional, gestão/admin; logo do cliente canto superior esquerdo, sidebar com calendário abaixo, topbar e notificações.

## Regras críticas
Menor privilégio; MFA para acessos sensíveis; revogação; profissional acessa apenas prontuários autorizados.

## Critérios de aceite
Testes de autorização positiva/negativa, responsividade e troca de unidade.

## Cenários obrigatórios
1. Fluxo principal com dados sintéticos e estados coerentes.
2. Fluxos de erro, duplicidade, cancelamento e autorização negada.
3. Permissões por perfil e unidade, sem vazamento clínico.
4. Regressão dos fluxos já homologados, desktop/tablet/celular.
5. Evidências com Preview, SHA, testes e matriz PASS/FAIL/NOT TESTED.

## Restrições
Não iniciar sem autorização, não fazer merge sem Human Validation, não usar dados reais no Preview público. Detalhes ainda não definidos devem virar decisões explícitas, nunca suposições do desenvolvedor.
