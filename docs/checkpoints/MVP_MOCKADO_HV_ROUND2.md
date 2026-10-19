# 7Clinic | MVP mockado | Human Validation, rodada 2

Status histórico do checkpoint `c3b8556`: **HUMAN VALIDATION ROUND 2 - NOT APPROVED**. Correções e matriz atual em [`MVP_MOCKADO_HV2_CORRECOES.md`](MVP_MOCKADO_HV2_CORRECOES.md).

Branch `feat/mvp-mockado-hv-round2`, PR #5 Draft, baseada no SHA `cdef6bcba1ef9fe65e75338d70449584d279f0ab` do PR #4, com destino `develop`. Nenhum merge foi realizado. Dados exclusivamente fictícios, persistidos no navegador.

## Roteiro para a clínica

1. **Recepção:** use o mini calendário lateral para trocar o dia e compare com o filtro da agenda. Crie um agendamento fictício, abra a exclusão e primeiro escolha “Manter agendamento”; depois confirme a exclusão. Confira o evento `DELETE_APPOINTMENT` na Gestão. No atendimento bloqueado, use “Ver atendimento das 8h”, regularize a pendência ou solicite liberação. Atendimentos confirmados só permitem o fluxo de reversão ou cancelamento com motivo.
2. **Profissionais:** confirme na Recepção um agendamento fictício e verifique a pendência clínica antes de escrever a evolução. Salve e edite um rascunho, finalize, complemente e invalide com justificativa; confira o histórico de leitura. Troque o dia pelo calendário lateral.
3. **Financeiro:** clique nos indicadores “A receber”, “Recebido”, “A pagar”, “Repassado” e “Revertido”; compare conta, situação, registros e subtotais. Limpe a seleção. Consulte as movimentações no Histórico Financeiro e abra o Histórico de Reversões. Reabra uma conciliação com motivo quando necessário. A regra de repasse é apenas consultada aqui.
4. **Gestão:** filtre unidade, profissional e período. Consulte a auditoria por data, usuário simulado, operação e atendimento, incluindo justificativa e estado anterior/posterior quando disponíveis. Altere a regra fictícia de repasse e confirme que lançamentos antigos mantêm o valor anterior. Teste nome, logo local PNG/JPEG/WebP e cores da identidade visual, depois restaure Consult Services. Pergunte à Maia as cinco perguntas sugeridas e uma pergunta fora do escopo.
5. **Integração:** recarregue a página para verificar persistência. Confira que confirmação gera prontuário pendente e produção imediatamente, sem duplicidade. O reset demonstrativo requer confirmação.

## Matriz de evidências técnicas

| Cenário | Esperado | Observado | Desktop 1440 x 900 | Tablet 768 x 1024 | Celular 390 x 844 | Evidência |
| --- | --- | --- | --- | --- | --- | --- |
| Mini calendário lateral | Seleção sincroniza Recepção e Profissionais | Agenda muda para o dia escolhido; visual fixo no menu | PASS | PASS | FAIL conhecido, reformulação adiada | `hv2-*-recepcao-calendario-bloqueio.png`, trace |
| Exclusão controlada | Somente agendado sem vínculos, confirmação e auditoria | Cancelar diálogo conserva; confirmar remove da agenda e registra `DELETE_APPOINTMENT`; ID não reutilizado | PASS | PASS | PASS | Novo E2E, 2 testes de domínio, trace |
| Bloqueio contextual | Explica pendência e abre atendimento anterior | Checkpoint anterior exibia IDs técnicos; correção em matriz atual | FAIL | FAIL | FAIL | `hv2-*-recepcao-calendario-bloqueio.png`, trace |
| Financeiro filtrado | Cards, listagens e subtotais respeitam filtros | Indicadores selecionam conta/situação, destacam filtro e permitem limpar; total do painel usa a mesma seleção | PASS | PASS | PASS | `hv2-*-financeiro-indicadores.png`, trace, teste de domínio |
| Movimentações e reversões | Histórico principal e reversões secundárias | Auditoria financeira consultável; reversões em seção recolhível e vinculadas ao ID | PASS | PASS | PASS | E2E anterior, novo E2E, trace |
| Regra de repasse | Gestão configura, Financeiro consulta; sem retroatividade | A confirmação posterior usa novo valor e lançamentos anteriores preservam o valor gerado | PASS | PASS | PASS | Teste de domínio, novo E2E, trace |
| Auditoria de Gestão | Filtros e justificativas, antes/depois quando disponível | Filtros por período, ator, operação e atendimento; exclusão e edição têm estados anterior/posterior | PASS | PASS | PASS | `hv2-*-gestao-maia-auditoria-marca.png`, trace |
| Whitelabel local | Consult Services padrão, cliente configurável | Checkpoint anterior não seguia o RT-001; correção em matriz atual | FAIL | FAIL | FAIL | Screenshot do Preview, novo E2E, trace |
| Orientação contextual | Ajuda por ambiente sem aviso permanente | Seções recolhíveis na Recepção, Profissionais, Financeiro e Gestão | PASS | PASS | PASS | Capturas e trace |
| Maia: cinco perguntas | Respostas derivadas dos registros e filtros | Consultas de prontuário, confirmação, unidade, produção e recebimentos respondidas; desconhecida informa limite | PASS | PASS | PASS | Teste de domínio, `hv2-*-gestao-maia-auditoria-marca.png`, trace |
| Regressão integrada | Preservar quatro workspaces, clínica, financeiro, reset | Scripts anteriores de smoke, E2E e validação integral repetidos | PASS | PASS | PASS | GitHub Actions, capturas e traces |
| Homologação humana definitiva | Aceite da clínica | Ainda não realizado | NOT TESTED | NOT TESTED | NOT TESTED | Pendente de Human Validation integrada |

## Gates e evidências

O workflow `.github/workflows/mvp-mock-visual.yml` executa `npm ci`, instala Chromium, roda testes de domínio, typecheck, lint, build, `git diff --check` e os quatro scripts `tests/smoke.mjs`, `tests/e2e.mjs`, `tests/validation-e2e.mjs` e `tests/hv-round2-e2e.mjs`. As capturas e traces são publicados como artifact do GitHub Actions. Na execução de validação do código, os 28 testes de domínio e os quatro scripts passaram.

A proteção do Preview Vercel permanece ativa. O Preview foi aberto com acesso temporário autorizado, exibindo a logo Consult Services, o mini calendário, a agenda e a organização demonstrativa. O conjunto visual completo roda contra build local equivalente no CI isolado.

## Limites

Marca e dados demonstrativos vivem apenas no `localStorage`; imagens locais são limitadas a 1 MB e dependem da capacidade de armazenamento do navegador. Perfis e Maia são simulados. Não há autenticação real, Supabase, SQL, RLS, persistência remota, integração financeira ou dados reais. O PR #4 e o CP-02 permanecem sem merge. Nenhuma regra comercial, clínica ou de privacidade é homologada por este checkpoint.

## Pendências de produto posteriores

Menu mobile incompleto e filtragem do mini calendário no mobile foram apontados pela clínica e permanecem **FAIL conhecido** nesta rodada. A conclusão funcional prioriza o desktop. Os resultados anteriores de automação mobile não substituem essa avaliação humana.
