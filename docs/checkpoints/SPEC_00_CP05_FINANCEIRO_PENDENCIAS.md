# SPEC 00 | CP-05 Financeiro e pendências

Estado: concluído no código; Human Validation integrada pendente. PR #1 Draft.

## Entrega
- Financeiro separado em componente próprio com produção por profissional, contas independentes a receber e a pagar, saldos filtrados e conciliação simulada.
- Filtros por profissional, convênio, unidade, período do atendimento, tipo de conta e situação. Períodos históricos de reversão usam a data original armazenada no evento.
- Reversão de confirmação ou cancelamento arquiva valor, repasse, motivo, ator e horário. O lançamento deixa o saldo ativo; nova confirmação gera somente um lançamento ativo.
- Histórico de recebimentos, repasses, reaberturas e reversões. Reabertura exige motivo.
- Pendências da Recepção oferecem ações de confirmação, acesso ao atendimento e encaminhamento de bloqueio à Gestão. A Gestão encaminha à agenda adequada. O alerta superior navega à pendência concreta.
- Contagem das notificações respeita as regras configuradas e os estados de rascunho/finalização.

## Matriz automatizada
| Cenário | Resultado |
| --- | --- |
| Filtros financeiros combinados e situação de cada conta | PASS |
| Reversão, histórico com data original e reconfirmação sem duplicidade | PASS |
| Repasse parametrizado e conciliações independentes | PASS |
| Contador e pendências com regras configuradas | PASS |
| Navegação contextual desktop e celular | NOT TESTED, validação visual pendente |

17 testes de domínio, typecheck, lint, build e diff check aprovados localmente.

Limites: valores de receita e convênios fictícios; sem pagamentos reais, integrações bancárias, fiscais ou portais de convênios.
