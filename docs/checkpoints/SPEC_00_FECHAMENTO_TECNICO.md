# SPEC 00 | Fechamento técnico e validação adiada

**Estado:** TECHNICALLY COMPLETE — INTEGRATED HUMAN VALIDATION DEFERRED.
**Base verificada:** `1d6c0c73d6893572bf56235836076db12fda126b`.
**Branch:** `feat/spec-00-mvp-operacional`, PR #1 Draft. Nenhum merge realizado.

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

## Pendências e proposta de integração

- Nenhuma falha crítica encontrada no smoke. Não foram retestados exaustivamente reversões, conciliações, perfis, notificações, exceções e todos os filtros. Permanecem **NOT TESTED por humanos**.
- Para integrar: revisar PR #1 e diferenças contra `develop`, obter autorização expressa para merge commit, executar novamente testes, typecheck, lint, build e smoke, registrar SHA do merge e validar um smoke no Preview de `develop`.
- Não alterar o status para APPROVED nem encerrar a dívida de homologação após esse merge técnico. Preservar a matriz de CP-06 e executar a Human Validation integrada antes de qualquer operação real.
- Não usar dados reais; o cenário ainda é local-first e demonstrativo.

## Limites

O smoke valida somente o fluxo indicado acima, em Chromium local. Não valida concorrência real, autenticação, RLS, acessibilidade completa, backup ou restauração. O Preview público de CP-06 foi publicado, mas o teste automatizado rodou sobre o mesmo código em build local, não sobre uma sessão remota autenticada da Vercel.
