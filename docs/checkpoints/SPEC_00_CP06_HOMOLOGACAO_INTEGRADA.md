# SPEC 00 | CP-06 Estabilização e homologação integrada

Estado: READY FOR INTEGRATED HUMAN VALIDATION, sem homologação formal. PR #1 Draft, sem merge.

## Massa fictícia e reinício

O primeiro acesso sem dados locais carrega `createScenario()`. O comando **Reiniciar cenário fictício** no menu descarta os dados demonstrativos deste navegador e carrega a mesma massa. Quem já utilizou o Preview precisa usar esse comando uma vez para obter a massa nova.

A massa contém as duas unidades, quatro pacientes fictícios, dois profissionais fictícios, agendamentos, confirmações, falta, cancelamento, evolução pendente, rascunho, evolução finalizada, contas em aberto e conciliadas, bloqueio e liberação excepcional. A Maia responde a pendências, unidades, bloqueios e supervisão financeira usando o estado atual, identificando o modo demonstrativo.

## Matriz de cenários

| Cenário | Automatizado | Visual no Preview | Human Validation |
| --- | --- | --- | --- |
| Confirmar: prontuário e financeiro independentes | PASS | PASS no navegador para o fluxo principal | NOT TESTED |
| Editar, transferir, falta, cancelar e reverter sem duplicidade | PASS | NOT TESTED na interface | NOT TESTED |
| Rascunho, finalização, adendo e invalidação | PASS | PASS rascunho/finalização; adendo/invalidação NOT TESTED | NOT TESTED |
| Receber, pagar, reabrir e arquivar produção revertida | PASS | NOT TESTED na interface | NOT TESTED |
| Bloqueio, exceção, notificações e ações por perfil | PASS | NOT TESTED na interface | NOT TESTED |
| Filtros financeiros e saldos por unidade | PASS | PASS filtro de convênio; demais filtros NOT TESTED | NOT TESTED |
| Persistência local, migração da massa anterior e reinício | PASS | PASS após recarregar; migração/reinício NOT TESTED na interface | NOT TESTED |
| Permissões simuladas entre quatro ambientes | PASS | NOT TESTED na interface | NOT TESTED |
| Responsividade desktop, tablet e celular | PASS no Playwright | PASS em 1440, 768 e 390 px, sem overflow horizontal | NOT TESTED |
| Narrativa completa com massa fictícia e Maia | PASS nas regras | NOT TESTED para Maia na interface | NOT TESTED |

## Execução e limites

21 testes de domínio e integração passaram, além de três execuções E2E em Chromium via Playwright, typecheck, lint, build e `git diff --check`. O E2E percorreu confirmação, filtro financeiro, rascunho e finalização, persistência após recarregar, menu e calendário mobile e ausência de overflow horizontal nas larguras de 1440, 768 e 390 px. O Preview Vercel final ainda exige Human Validation visual e operacional antes da homologação.

Os perfis não são autenticação real. Não usar dados reais de pacientes. A auditoria, o histórico financeiro e as conciliações são locais e demonstrativos. Sem Supabase definitivo, portal de convênio, integração bancária, fiscal, pagamentos ou IA externa.
