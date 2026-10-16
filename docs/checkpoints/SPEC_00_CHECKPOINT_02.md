# SPEC 00 | Checkpoint 02 · Fluxo operacional demonstrativo

## Entregue

- Recepção: cadastro fictício de paciente, agenda, confirmação, falta, transferência entre unidades, filtros e central de pendências.
- Profissionais: agenda vinculada a um profissional fictício, liberação do prontuário após confirmação, evolução simulada e alerta de pendência.
- Gestão: indicadores por unidade e consolidados, produção por profissional, contas a pagar e receber, conciliação manual simulada, regras e liberação excepcional auditada.
- Maia: respostas locais simuladas, rotuladas como demonstração.
- Persistência local versionada no navegador, com opção explícita de reinício.

## Regras preservadas

1. A confirmação altera o atendimento e cria um único lançamento financeiro, sem esperar evolução clínica.
2. Repetir confirmação não duplica lançamento.
3. Transferir atendimento agendado mantém o ID; confirmação posterior produz na unidade de destino.
4. Repasse vigente começa em R$ 18,00. Nova parametrização vale apenas para confirmações seguintes e mantém histórico.
5. Liberação excepcional requer gestão e justificativa, registrada na auditoria.
6. Conteúdo de evolução não entra no log de auditoria nem na tela da recepção e gestão.

## Limitações e decisões pendentes

- Troca de perfil é simulação de UX, não autenticação nem controle de acesso seguro. Não usar com pacientes reais.
- Persistência via localStorage é isolada por navegador e dispositivo. Não há sincronização multiusuário.
- Valor de receita prevista de R$ 120 por consulta é somente massa fictícia e **não representa preço ou acordo comercial**.
- Transferência após confirmação, cancelamentos com estorno, regras de faltas, prazos de alertas, adendos clínicos e políticas de recebíveis requerem refinamento. O MVP restringe esses cenários, sem inventar regras definitivas.
- Maia não é IA externa e não oferece orientação clínica.
- Agenda usa data-base demonstrativa de 16/10/2026.
- Nenhum Supabase, integração de convênio ou pagamento real.

## Roteiro de homologação

1. Reinicie a demonstração. Na recepção, transfira o Paciente Exemplo B da Unidade I para II e confirme. Confira um atendimento e um lançamento na Unidade II.
2. Confirme o Paciente Exemplo A às 08h. Na gestão, confira a receita prevista e o repasse; no profissional 1, registre uma evolução fictícia. O financeiro deve já existir antes da evolução.
3. Marque falta no Paciente Exemplo D. Confira ausência de lançamento.
4. Na gestão, ative o bloqueio de confirmação anterior pendente. O segundo agendamento do Paciente Exemplo A, às 15h, deve ficar bloqueado se o primeiro ainda estiver pendente. Registre liberação excepcional justificada e confirme na recepção.
5. Concilie manualmente um recebível e um repasse. Verifique valores previstos, recebidos e a pagar separadamente.
6. Altere o repasse para uma nova confirmação e confira que o lançamento anterior permanece com R$ 18,00.
7. Faça uma pergunta à Maia sobre pendências e financeiro. Confira o rótulo de modo demonstrativo.
8. Recarregue a página e confira a persistência local. Repita em desktop e celular.

## Matriz

| Cenário | Resultado esperado | Status |
| --- | --- | --- |
| Confirmação gera prontuário e financeiro independentes | Um lançamento antes da evolução | PASS em teste de domínio |
| Repetição de confirmação | Sem duplicidade | PASS em teste de domínio |
| Transferência | Mesmo atendimento, lançamento único no destino | PASS em teste de domínio |
| Bloqueio e exceção | Negação e liberação justificada auditada | PASS em teste de domínio |
| Falta | Nenhum lançamento e confirmação posterior negada | PASS em teste de domínio |
| Permissão simulada | Evolução limitada ao profissional vinculado | PASS em teste de domínio |
| Repasse parametrizado | Histórico anterior preservado | PASS em teste de domínio |
| Conciliação manual | Recebido e pago independentes | PASS em teste de domínio |
| Responsividade e persistência em navegador | Fluxo visual completo | NOT TESTED em Preview |
| Autenticação real, RLS e multiusuário | Fora da SPEC 00 | NOT TESTED |

Não realizar merge sem aprovação humana escrita. A SPEC 01 continua não autorizada.
