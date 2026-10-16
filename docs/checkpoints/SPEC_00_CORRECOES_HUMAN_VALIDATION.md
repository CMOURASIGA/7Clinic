# SPEC 00 | Correções para Human Validation final

Estado: READY FOR HUMAN VALIDATION. PR #1 permanece Draft. Sem merge e sem SPEC 01.

## Fluxos incorporados

- Recepção: editar data, horário, profissional e unidade de agendamento, mantendo o identificador; desfazer confirmação ou falta; cancelar sem excluir o histórico. Motivo com pelo menos dez caracteres para edição, reversão e cancelamento.
- Confirmação revertida remove a produção financeira fictícia vinculada. Nova confirmação cria um único lançamento. Conciliações precisam ser reabertas pelo Financeiro antes de reversão.
- Havendo evolução, o profissional precisa invalidá-la explicitamente com motivo antes de reversão ou cancelamento. Conteúdo clínico não entra na trilha de auditoria.
- Profissional: salvar e editar rascunho, finalizar, complementar e invalidar evolução fictícia. O conteúdo final não é editado diretamente; complementos preservam o texto original.
- Financeiro: ambiente próprio para produção por profissional, contas e regra de repasse. Gestão mantém indicadores operacionais, pendências, bloqueios, configurações e Maia demonstrativa.
- Calendário lateral: seletor de data compartilhado pelas agendas de Recepção e Profissionais, inclusive no menu mobile. A opção de todas as datas limpa o filtro.

## Verificação automatizada

13 testes de domínio; TypeScript, lint, build e `git diff --check` aprovados. Os testes incluem reversão financeira, impedimento por evolução e conciliação, correção de falta, edição sem duplicidade, rascunho e complemento.

## Human Validation pendente

1. Recepção: editar e corrigir estados, verificar motivo, mesmo ID e trilha demonstrativa.
2. Profissional: rascunho, edição, finalização, complemento e invalidação explícita.
3. Financeiro: lançamento independente, reversão e reabertura de conciliação.
4. Gestão: confirmar separação de áreas e indicadores sem conteúdo clínico.
5. Calendário: escolher outra data na barra lateral e conferir as duas agendas em desktop e celular.
6. Confirmar uso exclusivo de dados fictícios e persistência apenas no navegador.

Os papéis continuam simulados, sem autenticação, e a auditoria é local. Não usar dados reais.
