# 7Clinic — Roteiro Único de Validação Integrada (HV-INTEGRADA-01)

**Objetivo:** validar em um único ambiente a SPEC 00 (MVP mockado), as correções HV Round 2 do PR #5 e a Central V3 do PR #6.

**Branch exclusiva:** `test/7clinic-hv-integrada`. **Origem:** PR #6 SHA `01de26a55ca0f484830654088fb3754c44639e88`, incorporando funcionalmente as correções do PR #5 SHA `d013febfb0284f01fec04b4e74d2a53c5019a0f6`.

**Estado:** INTEGRATED CODE — CI/VALIDAÇÃO INTEGRADA PENDENTES. Não há homologação deste SHA nem autorização de merge. PRs #4, #5, #6 e `develop`/`main` preservados.

## Preparação obrigatória do validador
- Receber **somente** o Preview protegido publicado desta branch, com SHA exato e CI verde; não usar os Previews isolados dos PRs #5 e #6.
- Utilizar dados 100% fictícios. Não enviar foto, CPF ou registro real; conversas, documentos, financeiro e IA são simulações locais.
- Abrir navegador limpo ou executar **Reiniciar cenário fictício** com confirmação antes da bateria; registrar navegador, resolução e data.
- Comparar comportamentos e valores com a massa exibida no cenário, **sem presumir valores hardcoded**. Anotar números antes/depois e capturar evidências.
- Resultado por cenário: PASS / FAIL / NOT TESTED; anotar passos, valor esperado/observado, evidência e bloqueios. PASS em CI não substitui validação humana.

## Matriz única — roteiro sequencial

| ID | Área | Passos de execução | Critério de aceite |
|---|---|---|---|
| INT-01 | Shell/menu | Navegar pelas quatro rotinas em 1440×900; repetir em 1280×600, 768×1024 | Quatro rotinas visíveis em desktop normal, sem barra independente do menu; em janela baixa, sidebar inteira rolável sem esconder o calendário |
| INT-02 | Calendário | Alternar dias/meses no mini calendário e navegar entre Recepção e Profissionais; alterar data na agenda | Data sincronizada e filtros consistentes em ambos os módulos |
| INT-03 | Recepção / cadastro | Pesquisar, cadastrar paciente fictício e criar/editar agendamento; testar exclusão permitida e bloqueada | Sem duplicação; exclusão apenas antes da confirmação e sem vínculos posteriores; auditoria registrada |
| INT-04 | Confirmação bloqueada | Abrir atendimento que depende de outro anterior pendente do mesmo paciente; clicar "Ver atendimento das HH:mm" e retornar | Mensagem sem ID técnico, data/hora corretas, destaque do atendimento vinculado e retorno ao contexto |
| INT-05 | Fluxo clínico-financeiro | Confirmar agendamento e abrir Profissionais/Financeiro; repetir confirmação | Uma única pendência clínica e um único lançamento financeiro, sem duplicidade |
| INT-06 | Reversão e transferência | Registrar falta/cancelamento/reversão permitida; transferir unidade ou editar atendimento com justificativa | Operações respeitam bloqueios e mantêm consistência clínica/financeira e histórico |
| INT-07 | Financeiro / carregamento | Abrir Financeiro e **registrar cada card antes de clicar**; abrir cada detalhe | Cards corretos imediatamente e coerentes com a listagem; clicar não muda total/filtro |
| INT-08 | Financeiro / filtros | Testar período, unidade, profissional, convênio, conta e situação; limpar; conciliar recebimento e repasse separadamente | Cards, subtotais e listas respondem à mesma seleção; saldos coerentes; recebimento ≠ repasse |
| INT-09 | Gestão / repasse | Localizar e ajustar regra de repasse na Gestão, gerar atendimento novo e verificar Financeiro | Regra configurada em Gestão; aplicação consistente às novas produções conforme regra de domínio |
| INT-10 | Gestão / histórico | Consultar Histórico de operações e filtros; conferir edição, exclusão, reversão, repasse e conciliação | Linguagem operacional, data, ator, vínculo, justificativa e antes/depois quando houver; sem ID técnico confuso |
| INT-11 | Whitelabel RT-001 | Selecionar marca sintética; conferir prévia, cores sugeridas, edição manual, salvar, navegar, recarregar e restaurar | Logo/cores aplicados ao shell e componentes previstos, contraste legível, persistência e restauração Consult Services |
| INT-12 | Maia mockada | Perguntar quem tem mais prontuários pendentes e cruzar com Profissionais; perguntar fora do escopo | Resposta baseada em DemoState/filtros sintéticos, sem inventar dados; informar limite |
| INT-13 | Central / layout e navegação | Recepção → Central; conferir lista, conversa e painel contextual; buscar e filtrar | Três colunas desktop funcionais, sem vazamento entre pacientes |
| INT-14 | Central / conversas paralelas | Editar dados, rascunho, filtros, hora provisória no paciente A; alternar B→C→A; atualizar página | Contexto isolado de cada conversa mantido após alternância e reload |
| INT-15 | Central / documentos e atendimento | Abrir anexos sintéticos e cadastrar dados manualmente; registrar mensagem simulada | Dados vinculados ao paciente certo; rascunho não enviado; nenhuma integração com WhatsApp/OCR |
| INT-16 | Central / agenda contextual | Filtrar por unidade, especialidade, turno e profissional e selecionar horário em análise | Agenda refletindo disponibilidade existente; seleção provisória sem reserva |
| INT-17 | Central / pré-agendamento | Paciente escolhe slot; registrar pré-agendamento explícito; conferir Recepção, Financeiro e Profissionais | Reserva em Recepção, mesmo paciente/slot; **zero produção e zero pendência clínica** até a confirmação |
| INT-18 | Central / confirmação | Confirmar pré-agendamento na Recepção, retornar à Central e conferir downstream | Um lançamento financeiro e uma pendência clínica exatamente uma vez, mantendo vínculo e histórico |
| INT-19 | Central / colisão | Em outra conversa tentar reservar o mesmo slot profissional/data/hora | Segunda reserva recusada; sem duplicidade ou corrupção |
| INT-20 | Notificações e estados | Navegar por alertas e ações contextuais; recarregar e reiniciar cenário fictício | Alertas coerentes com estados; reset devolve massa original e não preserva rascunhos da Central |
| INT-21 | Responsividade delimitada | Verificar Central em 768×1024 e 390×844 (painéis acessíveis), e registrar limitações de menu/calendário mobile | Central deve permitir navegação por painéis; **menu/calendário mobile continuam FAIL conhecido e adiados**, não homologar como PASS |

## Critérios de bloqueio
- Qualquer falha de compilação, navegação, regressão de dados, vazamento entre pacientes, duplicidade financeira/clínica ou pré-agendamento que gere financeiro/prontuário prematuramente bloqueia aprovação integrada.
- Inconsistência financeira nos indicadores no carregamento, alteração de totals ao clicar, perda de dados da Central ou configuração whitelabel que não persiste bloqueiam.
- A limitação **já aceita como pendência futura** do menu e mini calendário mobile não deve ser maquiada como PASS. Separar pendências conhecidas de regressões novas.
- Não usar contas reais, integração com Helena CRM/WhatsApp/Supabase ou usuários reais. Não validar concorrência real entre navegadores como se fosse suportada.

## Evidência e entrega do validador
1. Matriz preenchida com **PASS/FAIL/NOT TESTED** por INT-01…INT-21; para FAIL: reprodução, esperado/observado, evidência visual.
2. Relatório de consistência com números de cards no carregamento e após filtros, e registros de confirmação/pré-agendamento.
3. Registro das resoluções e do teste de restauração de whitelabel.
4. Resumo executivo: BLOQUEADO / APROVADO COM PENDÊNCIAS CONHECIDAS / APROVADO, justificativa e riscos.
5. SHA e URL **deste Preview integrado**, resultado de testes, typecheck, lint, build, browser tests (desktop/tablet/mobile) e evidências.
6. **Não executar merge**. Somente o responsável funcional pode autorizar integração após análise.

## Passagem ao validador
"Validar exclusivamente o Preview da branch `test/7clinic-hv-integrada`, usando esta matriz INT-01 a INT-21. Não utilizar Previews isolados. Não preencher resultados técnicos como se fossem homologação humana. Devolver evidências e reprovações objetivas. Menu e mini calendário mobile permanecem pendências previamente aceitas. Nenhuma liberação para dados reais ou merge."
