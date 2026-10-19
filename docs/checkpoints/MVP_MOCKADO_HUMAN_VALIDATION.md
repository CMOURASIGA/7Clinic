# MVP mockado | Preparação da Human Validation integrada

Base: `develop` em `e6410c2e29f48c9ab62ef9e4a0594db229e0a89c`. Branch: `feat/mvp-mockado-human-validation`. PR Draft separado do CP-02. Apenas dados sintéticos e `localStorage`.

## Escopo e operação

A Recepção cadastra pacientes fictícios, agenda, confirma, edita, transfere, registra falta, cancela e reverte com justificativa. A confirmação cria imediatamente a produção e a pendência clínica. O Profissional edita rascunho, finaliza, complementa e invalida. A invalidação remove o registro da visão clínica ativa, mas preserva texto, versões de rascunho, complementos, data, autor e justificativa no histórico do atendimento. O Financeiro mantém recebimento e repasse independentes, subtotais por conta e situação, conciliação, reabertura e reversões. A Gestão filtra unidade, profissional e período, supervisiona valores e abre pendências contextualmente. Maia continua simulada.

Reversões bloqueadas por evolução ativa ou conciliação mostram o ambiente responsável e um atalho até o registro. Depois do tratamento, o usuário retorna ao atendimento e pode voltar à visão original. A operação mantém o ID e não duplica produção. A massa inicial contém duas unidades, quatro pacientes sintéticos, dois profissionais, todos os estados de atendimento, rascunho, evolução finalizada e invalidada com complemento histórico, conciliações, bloqueio e exceção. O reset exige confirmação e afeta apenas o navegador atual.

## Roteiro de validação por ambiente

1. Recepção: reiniciar cenário, cadastrar paciente fictício, agendar horário livre, confirmar e conferir pendência; testar falta e correção, edição, transferência, cancelamento com motivo. Abrir reversão bloqueada do atendimento `a8` e seguir ao Profissional.
2. Profissionais: selecionar Profissional Exemplo 2, abrir `a8`, editar o rascunho, finalizar e complementar, invalidar com motivo. Conferir versões e complemento em histórico de leitura; `a11` já demonstra uma evolução invalidada. Retornar ao atendimento.
3. Financeiro: conferir produção antes de qualquer evolução, filtrar por profissional, unidade, período, conta e situação. Receber e repassar de forma independente; reabrir o recebimento de `a8` com motivo; retornar à Recepção para a reversão.
4. Gestão: filtrar unidade, profissional e período; comparar valores com Financeiro, seguir pendência à agenda correspondente, voltar ao contexto; testar regra de bloqueio, liberação excepcional e Maia simulada.
5. Recarregar a página para validar persistência. Confirmar que a produção não duplicou e que o histórico da reversão e da evolução invalidada persistiu. Testar reset e cancelá-lo antes de confirmar.

## Matriz de evidências

| Cenário | Domínio automatizado | Interface desktop/tablet/mobile | Human Validation |
| --- | --- | --- | --- |
| Confirmação gera prontuário pendente e produção independente | PASS | NOT TESTED nesta branch | NOT TESTED |
| Evolução: rascunho, versões, finalização, complemento, invalidação histórica | PASS | NOT TESTED | NOT TESTED |
| Reversão e conciliação sem duplicidade, bloqueios justificados | PASS | NOT TESTED | NOT TESTED |
| Filtros e subtotais financeiros por conta e situação | PASS | NOT TESTED | NOT TESTED |
| Gestão por profissional/período e navegação contextual | Revisão de código; NOT TESTED em browser | NOT TESTED | NOT TESTED |
| Reset protegido, persistência e massa fictícia | PASS parcial no domínio; confirmação visual NOT TESTED | NOT TESTED | NOT TESTED |
| Responsividade e exceções visuais | NOT TESTED | NOT TESTED | NOT TESTED |

`npm test`, typecheck, lint, build e `git diff --check` devem ser reexecutados no SHA final. Os scripts `tests/smoke.mjs`, `tests/e2e.mjs` e `tests/validation-e2e.mjs` cobrem respectivamente smoke, fluxo principal e exceções. Este runner não dispõe de Chromium; o download pelo Playwright falhou com arquivo truncado. Não declarar essas linhas como PASS antes da execução em runner com browser e no Preview.

## Limites

Perfis são simulados, sem autenticação ou isolamento real. A trilha clínica e financeira é demonstrativa e local ao navegador. A massa e os valores são fictícios e não estabelecem regras contratuais da clínica. O PR #3 permanece aberto em Draft, isolado; nenhuma dependência, migração ou serviço Supabase é incluído neste MVP. SPEC 00 continua tecnicamente completa, com homologação humana integrada pendente.
