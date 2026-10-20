# Validação integrada, correções do PR #7

Status técnico: **CORRECTIONS READY**, sujeito aos gates de navegador e à repetição da Human Validation. O PR permanece Draft; não há homologação funcional nem autorização de merge.

## Correções

- COR-01: os seis cards financeiros têm seleção de detalhamento independente dos filtros globais. Os valores são derivados sempre do mesmo recorte explícito; conciliações continuam atualizando os saldos imediatamente.
- COR-02: o Histórico de operações da Gestão apresenta rótulos, atendimento contextual e moeda em português brasileiro. Os IDs, campos e eventos originais permanecem no estado local para rastreabilidade demonstrativa. Filtros continuam usando os valores internos.

## Matriz para revalidação

| Cenário | Evidência automatizada | Situação da Human Validation |
| --- | --- | --- |
| INT-01, menu e calendário em desktop, tablet e celular | `tests/hv-round2-e2e.mjs`, capturas `hv2-*-sidebar-depois.png` e traces | Repetir validação humana, inclusive 1280 × 600 e 768 × 1024 |
| INT-03, cadastro, edição e exclusão controlada | `tests/integrated-corrections-e2e.mjs`, captura `integrated-reception-desktop.png`; `tests/hv-round2-e2e.mjs` nas três resoluções | Repetir validação humana |
| INT-07, seis indicadores, filtros e conciliações | `tests/hv-round2-e2e.mjs` nas três resoluções; `tests/integrated-corrections-e2e.mjs`, captura `integrated-finance-desktop.png` | Repetir validação humana |
| INT-10, histórico, filtros, códigos e moeda | `tests/audit-presentation.test.ts`, `tests/integrated-corrections-e2e.mjs`, captura `integrated-history-desktop.png` | Repetir validação humana |
| INT-20, persistência, reset e alertas | `tests/validation-e2e.mjs`, `tests/integrated-corrections-e2e.mjs`, traces; alertas devem ser conferidos na repetição humana | Repetir validação humana |
| INT-21, experiência mobile | Problema conhecido documentado no relatório do validador | **FAIL**, adiado por decisão de produto |

Os cenários previamente aprovados pelo validador independente não recebem nova homologação neste checkpoint. A suíte visual de CI executa `smoke`, `e2e`, `validation-e2e`, `hv-round2-e2e`, `central-e2e` e `integrated-corrections-e2e` contra o build local, com capturas e traces no artefato do workflow. O Preview protegido deve ser conferido separadamente; a proteção Vercel não deve ser removida.

## Roteiro humano breve

1. Em Recepção, confira as quatro rotinas e o calendário nas resoluções previstas; cadastre paciente fictício, edite e exclua um agendamento ainda sem vínculos.
2. Em Financeiro, anote os seis valores, clique em cada card e confirme que Conta, Situação e os outros cinco valores permanecem iguais. Aplique filtros explícitos e concilie recebimento e repasse separadamente.
3. Em Gestão, filtre o Histórico de operações por tipo, responsável e período. Confira rótulos de conciliação, referência operacional e `R$ 20,00` após mudar a regra de repasse.
4. Passe por Central, Recepção, Profissionais e Financeiro; confirme que a confirmação cria pendência clínica e produção sem exigir evolução.
5. Atualize a página, observe alertas, cancele e confirme o reset demonstrativo. INT-21 permanece pendente por decisão de produto.
