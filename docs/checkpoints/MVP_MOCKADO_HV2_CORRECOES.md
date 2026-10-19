# 7Clinic | Human Validation rodada 2 | Correções consolidadas

Status: **HUMAN VALIDATION ROUND 2 CORRECTIONS READY**, sujeito à revalidação humana. PR #5 permanece Draft e sem merge. Base exata: árvore do checkpoint `c3b855604cc644bade0650b8b6ed73d67c9923dd`. A branch SPEC 00.1 V3 permanece independente.

## Referências e comportamento

- Whitelabel: [RT-001 do catálogo Consult Services](https://github.com/CMOURASIGA/componentes_consult_services/blob/main/padroes/RT-001-whitelabel.md), originado do 7Commander. A implementação local permite editar nome, imagem e cores, sugere cores da imagem por canvas 48 x 48, aplica variáveis na navegação e nos botões, persiste após salvar e restaura a identidade padrão. O catálogo classifica a homologação corporativa como pendente; a política remota por empresa não integra este MVP.
- Maia: a interface demonstrativa consulta `answerMaia` em `lib/maia.ts`, que calcula respostas a partir de `DemoState` e filtros. A futura fonte operacional exigirá autorização por usuário, consulta aos registros permitidos, cálculo sem valores inventados e resposta explícita quando faltarem dados. Nenhuma IA real foi integrada.
- Financeiro: o cálculo compartilha a seleção de contas com a listagem. Os filtros manuais definem o recorte dos cards; clicar num card escolhe apenas seu detalhamento e não reescreve os filtros nem os valores dos demais cards. Recebimento e repasse continuam independentes.
- Histórico de operações: registros demonstrativos locais com tipo legível, data, ator, registro relacionado, justificativa e antes/depois quando registrados. Não representa uma trilha definitiva de segurança.

## Matriz para revalidação

| Cenário | Resultado técnico | Evidência | Pendência humana |
| --- | --- | --- | --- |
| HV2-01 Bloqueio com data e hora dinâmica, sem ID visível; botão localiza e destaca | PASS após CI visual | `tests/hv-round2-e2e.mjs`, captura da Recepção | Revalidar texto e navegação |
| HV2-02 Indicadores corretos no carregamento e detalhamento sem mutação dos cards | PASS após CI visual | `tests/hv-round2.test.ts`, `tests/hv-round2-e2e.mjs`, captura do Financeiro | Conferir valores operacionais esperados |
| HV2-02 Filtros, confirmação e conciliação atualizam valores | PASS nos testes de domínio; visual após CI | `tests/hv-round2.test.ts` e scripts integrados | Revalidar na navegação |
| HV2-03 Histórico de operações e filtros | PASS após CI visual | Captura e trace de Gestão | Conferir linguagem e cobertura dos eventos |
| HV2-04 Whitelabel conforme RT-001, salvar, recarregar e restaurar | PASS após CI visual | `tests/hv-round2.test.ts`, E2E, captura de Gestão | Avaliar contraste com marcas reais apenas em fase autorizada |
| HV2-05 Maia simulada preservada; futura integração documentada | PASS nos testes existentes | `tests/hv-round2.test.ts`, `lib/maia.ts` | Aprovar desenho posterior |
| HV2-06 Menu mobile completo | FAIL conhecido, reformulação adiada | Primeira navegação humana | Não homologar mobile |
| HV2-06 Calendário mobile com filtragem equivalente ao desktop | FAIL conhecido, reformulação adiada | Primeira navegação humana | Não homologar mobile |
| Fluxos aprovados de repasse, clínica, exclusão e calendário desktop | PASS após regressão CI | Scripts smoke, E2E e validação | Revalidar desktop integrado |
| Homologação funcional da rodada 2 | NOT TESTED | Depende da clínica | PR permanece Draft |

As linhas marcadas como PASS após CI visual só devem ser consideradas comprovadas quando o run final estiver concluído com sucesso. Capturas em tablet e celular documentam a condição técnica, não homologam as pendências mobile.

## Roteiro desktop

1. Recepção: selecione 16/10/2026, abra o atendimento bloqueado e confira o texto e o botão do horário anterior. Clique, observe o destaque e volte ao atendimento original. Repita após alterar a data de um agendamento pendente.
2. Financeiro: anote os seis valores no carregamento. Clique em A receber e confira o detalhamento sem mudança do valor do card. Limpe a seleção, filtre unidade, profissional, convênio, período, conta e situação. Confirme um atendimento, concilie recebimento e repasse separadamente, reabra e confira os valores imediatamente.
3. Gestão: consulte Histórico de operações, filtre período, responsável, tipo e atendimento. Confira exclusão, edição, reversão e regra de repasse. Configure uma marca local, altere cores, salve, navegue e recarregue. Restaure Consult Services.
4. Maia: pergunte sobre pendências e produção com filtros; confira a resposta de limitação a uma pergunta fora do escopo.

## Limites

Somente dados sintéticos e LocalStorage. Sem WhatsApp, Helena CRM, Supabase, autenticação real, serviço pago, sincronização entre navegadores ou dados clínicos reais. Mobile não está aprovado. Aprovação técnica de código não equivale a homologação funcional.
