# SPEC 00 | CP-04 Integração operacional

Estado: concluído no código; Human Validation integrada pendente. PR #1 Draft.

## Entrega
- Estado único local-first sincroniza confirmação, prontuário, produção financeira, gestão e notificações.
- Gestão ganhou indicadores financeiros de supervisão somente leitura, mantendo a operação no Financeiro.
- Pendências e contador de notificações derivam da mesma regra, respeitando notificações configuradas e evolução em rascunho.
- Reversão de falta impede reocupar horário de paciente ou profissional já atribuído.
- O filtro de data compartilhado continua nas agendas da Recepção e Profissionais.

## Matriz automatizada
| Cenário | Resultado |
| --- | --- |
| Confirmar e gerar prontuário e produção em paralelo | PASS |
| Transferir sem duplicar, confirmar, rascunhar, finalizar, receber e recalcular indicadores | PASS |
| Bloqueio, exceção e notificações configuráveis | PASS |
| Reversões e cancelamento com financeiro coerente | PASS |
| Conflito de horário ao corrigir falta | PASS |
| Conferência visual desktop e mobile | NOT TESTED, reservada à Human Validation |

15 testes de domínio, typecheck, lint, build e diff check aprovados localmente.

Limites: papéis simulados, sem autenticação ou banco definitivo; dados exclusivamente fictícios no navegador.
