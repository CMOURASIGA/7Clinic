# SPEC 00 | CP-06 Estabilização e homologação integrada

Estado: READY FOR INTEGRATED HUMAN VALIDATION, sem homologação formal. PR #1 Draft, sem merge.

## Massa fictícia e reinício

O primeiro acesso sem dados locais carrega `createScenario()`. O comando **Reiniciar cenário fictício** no menu descarta os dados demonstrativos deste navegador e carrega a mesma massa. Quem já utilizou o Preview precisa usar esse comando uma vez para obter a massa nova.

A massa contém as duas unidades, quatro pacientes fictícios, dois profissionais fictícios, agendamentos, confirmações, falta, cancelamento, evolução pendente, rascunho, evolução finalizada, contas em aberto e conciliadas, bloqueio e liberação excepcional. A Maia responde a pendências, unidades, bloqueios e supervisão financeira usando o estado atual, identificando o modo demonstrativo.

## Matriz de cenários

| Cenário | Automatizado | Visual no Preview | Human Validation |
| --- | --- | --- | --- |
| Confirmar: prontuário e financeiro independentes | PASS | NOT TESTED no CP-06 | NOT TESTED |
| Editar, transferir, falta, cancelar e reverter sem duplicidade | PASS | NOT TESTED no CP-06 | NOT TESTED |
| Rascunho, finalização, adendo e invalidação | PASS | NOT TESTED no CP-06 | NOT TESTED |
| Receber, pagar, reabrir e arquivar produção revertida | PASS | CP-05 desktop inspecionado | NOT TESTED |
| Bloqueio, exceção, notificações e ações por perfil | PASS | NOT TESTED no CP-06 | NOT TESTED |
| Filtros financeiros e saldos por unidade | PASS | CP-05 desktop inspecionado | NOT TESTED |
| Persistência local, migração da massa anterior e reinício | PASS | NOT TESTED no CP-06 | NOT TESTED |
| Permissões simuladas entre quatro ambientes | PASS | NOT TESTED no CP-06 | NOT TESTED |
| Responsividade desktop, tablet e celular | NOT TESTED automatizado | Desktop CP-05 inspecionado; tablet e celular NOT TESTED | NOT TESTED |
| Narrativa completa com massa fictícia e Maia | PASS nas regras; interface pendente | NOT TESTED no CP-06 | NOT TESTED |

## Execução e limites

21 testes de domínio e integração passaram, além de typecheck, lint, build e `git diff --check`. O runner local de Chromium não ficou disponível: o download do navegador retornou arquivo truncado. A matriz registra explicitamente o teste de viewport como NOT TESTED, sem presumir aprovação visual. O Preview Vercel final deve ser validado em desktop, tablet e celular antes da homologação.

Os perfis não são autenticação real. Não usar dados reais de pacientes. A auditoria, o histórico financeiro e as conciliações são locais e demonstrativos. Sem Supabase definitivo, portal de convênio, integração bancária, fiscal, pagamentos ou IA externa.
