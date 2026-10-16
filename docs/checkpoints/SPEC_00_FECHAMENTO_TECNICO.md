# SPEC 00 | Fechamento técnico e validação adiada

**Estado:** TECHNICALLY COMPLETE — INTEGRATED HUMAN VALIDATION DEFERRED.
**Base verificada:** `1d6c0c73d6893572bf56235836076db12fda126b`.
**Branch de origem:** `feat/spec-00-mvp-operacional`. PR #1 integrado tecnicamente em `develop` por merge commit `bf6581e5689309fa1676a613ef0585cd08d5bf03`. A Human Validation integrada permanece pendente.

## Smoke básico, 16/10/2026

Executado com Playwright e Chromium local contra o build de produção, em 1440 × 900 e 390 × 844. O script reproduzível está em `tests/smoke.mjs`. Cada viewport começou com a massa sintética reiniciada no seu contexto.

| Cenário | Desktop | Mobile | Evidência |
| --- | --- | --- | --- |
| Acesso a Recepção, Profissionais, Financeiro e Gestão | PASS | PASS | Cabeçalhos carregados sem erro de página |
| Criar e confirmar atendimento fictício | PASS | PASS | Agenda e ação registrada |
| Confirmação libera prontuário pendente | PASS | PASS | Atendimento novo aberto na agenda profissional |
| Reflexo financeiro da confirmação | PASS | PASS | Receita prevista sobe de R$ 360 para R$ 480 |
| Navegação e filtro de data | PASS | PASS | Outra data vazia e retorno à data-base; calendário lateral visível no menu mobile |
| Persistência local | PASS | PASS | Quatro confirmados após reload |
| Erros críticos e largura | PASS | PASS | Nenhuma exceção de página nem overflow horizontal acima de 2 px |

Antes deste fechamento, 21 testes de domínio e integração, typecheck, lint, build e E2E em desktop, tablet e mobile também passaram no CP-06. O smoke atual é deliberadamente menor que a matriz de Human Validation.

## Gate de integração em develop

- PR #1: HEAD `1c63e3759ba25109d16933ee1f2274d77ec4cd35`, sem conflitos; retirado de Draft e integrado por merge commit `bf6581e5689309fa1676a613ef0585cd08d5bf03`. Esse SHA técnico é ancestral do HEAD de `develop`.
- Gates antes do merge: 21 testes, typecheck, lint, build, `git diff --check` e smoke local desktop/mobile: PASS.
- Preview de `develop` READY no SHA do merge: https://7clinic-ms50jl6es-christians-projects-4954426e.vercel.app/ . Smoke no Preview, navegador desktop: quatro ambientes, criação e confirmação de `a11` fictício, prontuário pendente, receita R$ 480 com quatro lançamentos, indicadores da Gestão, calendário lateral filtrando agenda e persistência após reload: PASS. O Preview tem proteção de acesso da Vercel; o link direto pode requerer autenticação do projeto.
- Smoke mobile e ausência de overflow foram verificados no build local do mesmo código; **não houve sessão mobile remota no Preview**. A matriz integrada de Human Validation permanece NOT TESTED por humanos.

## Pendências e proposta de integração

- Nenhuma falha crítica encontrada no smoke. Não foram retestados exaustivamente reversões, conciliações, perfis, notificações, exceções e todos os filtros. Permanecem **NOT TESTED por humanos**.
- Integração autorizada e realizada com merge commit, sem squash ou rebase. O commit técnico `1c63e3759ba25109d16933ee1f2274d77ec4cd35` é ancestral de `develop`.
- Não alterar o status para APPROVED nem encerrar a dívida de homologação após esse merge técnico. Preservar a matriz de CP-06 e executar a Human Validation integrada antes de qualquer operação real.
- Não usar dados reais; o cenário ainda é local-first e demonstrativo.

## Limites

O smoke valida somente o fluxo indicado acima, em Chromium local. Não valida concorrência real, autenticação, RLS, acessibilidade completa, backup ou restauração. O Preview público de CP-06 foi publicado, mas o teste automatizado rodou sobre o mesmo código em build local, não sobre uma sessão remota autenticada da Vercel.
