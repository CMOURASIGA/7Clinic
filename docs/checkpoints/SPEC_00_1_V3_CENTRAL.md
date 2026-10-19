# SPEC 00.1 V3 - Central de Atendimento mockada

Status: READY FOR HUMAN VALIDATION somente após os gates visuais da branch. Aceite da clínica pendente.

## Base e governança

- Branch: `feat/spec-00-1-v3-central`, PR Draft para `develop`.
- Ancestral obrigatório: checkpoint completo do PR #4 (`cdef6bcba1ef9fe65e75338d70449584d279f0ab`) e ajustes da primeira Human Validation presentes no PR #5 (`c3b855604cc644bade0650b8b6ed73d67c9923dd`). Os dois PRs permanecem independentes em Draft; `develop` ainda não contém esses commits.
- Persistência: mesmo `localStorage` do MVP, sem serviços externos. Reset demonstrativo explícito também remove os estados da Central.
- Nenhum dado real das telas de referência foi utilizado. Nomes, contatos e anexos são sintéticos.

## Adaptação de estados

| Etapa | Conversa | Solicitação | Agenda existente | Financeiro / prontuário |
| --- | --- | --- | --- | --- |
| Coleta/edição | Independente | `EM_COLETA` ou `EM_CONFERENCIA` | Nenhuma | Nenhum |
| Opção provisória | Independente | `AGUARDANDO_ESCOLHA` ou em conferência | Nenhuma reserva | Nenhum |
| Escolha e reserva explícita | Independente | `PRE_AGENDADA` | `prebooked`, slot reservado com ID único | Nenhum |
| Confirmação posterior na Recepção | Independente | Histórico de origem preservado | `confirmed`, mesmo ID | Um lançamento financeiro e pendência clínica |
| Falta/cancelamento/transferência | Independente | Registro contextual de origem preservado | Regras da agenda da Recepção | Regras existentes de reversão |

`prebooked` usa a mesma verificação de colisão de paciente e profissional do agendamento. Não pode ser excluído diretamente. A confirmação aceita `scheduled` ou `prebooked` e é idempotente. O mini calendário lateral continua filtrando Recepção e Profissionais; filtros da agenda contextual pertencem à conversa.

## Roteiro por ambiente

1. Na Recepção, abrir **Central de Atendimento**. Em desktop, verificar lista, conversa e painel contextual lado a lado. Em tablet/celular, usar os botões Conversas, Cadastro e agenda, Voltar à conversa.
2. Filtrar por `AGUARDANDO_PACIENTE`, buscar por paciente fictício e voltar a todos. Abrir A, digitar rascunho, editar contato sem salvar e selecionar horário provisório. Navegar B, C e A. Confirmar preservação individual. Atualizar a página e reabrir a Central.
3. Abrir documento sintético ao lado do cadastro. Conferir manualmente, salvar os campos e consultar agenda contextual. Uma mensagem digitada não aparece no histórico até **Registrar mensagem simulada**; esta ação não envia WhatsApp.
4. Na conversa C, selecionar horário livre, marcar que o paciente escolheu e criar pré-agendamento. Conferir na Recepção o status `Pré-agendado`, o mesmo ID, e a ausência de produção e pendência clínica. Confirmar na Recepção e conferir uma única produção no Financeiro e uma pendência em Profissionais.
5. Na conversa D, conferir paciente novo sem duplicidade. Testar a escolha do mesmo horário da conversa C; a segunda reserva é recusada após a primeira ocupar o slot. Testar reset explícito e retorno à massa sintética.
6. Executar o roteiro da primeira Human Validation do PR #5 para os quatro ambientes após a Central.

## Matriz de evidências

| Cenário | Esperado | Teste de regra | Navegador desktop 1440x900 | Tablet 768x1024 | Celular 390x844 | Evidência |
| --- | --- | --- | --- | --- | --- | --- |
| HV-14 | Quatro conversas; busca e filtro corretos | PASS | NOT TESTED | NOT TESTED | NOT TESTED | `tests/central.test.ts`, `tests/central-e2e.mjs` |
| HV-15 | A-B-C-A preserva rascunho, edição, filtro e horário | PASS | NOT TESTED | NOT TESTED | NOT TESTED | mesmos testes |
| HV-16 | Retorno após atualização | PASS | NOT TESTED | NOT TESTED | NOT TESTED | serialização e E2E |
| HV-17 | Cadastro, anexos e agenda isolados, sem gravação cruzada | PASS | NOT TESTED | NOT TESTED | NOT TESTED | testes de associação e E2E |
| HV-18 | Reserva explícita e colisão recusada | PASS | NOT TESTED | NOT TESTED | NOT TESTED | teste de colisão e E2E |
| HV-19 | Três áreas no desktop e painéis menores sem perda | PASS estrutural | NOT TESTED | NOT TESTED | NOT TESTED | E2E e capturas |
| HV-20 | Rascunho não enviado e conversa independente do agendamento | PASS | NOT TESTED | NOT TESTED | NOT TESTED | teste de estado e E2E |
| Regressão SPEC 00/PR #4/PR #5 | Agenda, clínica, financeiro, gestão e reset | PASS unitário | NOT TESTED | NOT TESTED | NOT TESTED | suítes existentes |

Atualizar a matriz com o resultado do CI e os links de capturas e traces. Não atribuir PASS visual sem navegador.

## Limites de demonstração

- Anexos são representações locais inteiramente fictícias; não há upload, OCR, WhatsApp, chatbot novo, assunção real de conversa ou sincronização multiusuário.
- Horários noturnos não são inventados. Especialidades, dois profissionais e disponibilidade derivam da agenda sintética existente.
- Validação de cadastro, convênio e pedido é ilustrativa; as regras assistenciais e contratuais da clínica seguem pendentes.
- Concorrência é revalidada no estado do navegador único. Não há reserva transacional entre navegadores distintos nesta fase local-first.
