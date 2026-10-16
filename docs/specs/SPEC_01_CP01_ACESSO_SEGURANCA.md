# SPEC 01 CP-01 | RBAC, RLS, grants e testes negativos

**Escopo:** proposta de autorização para quatro workspaces. `R` lê, `C` cria, `U` altera por comando de domínio, `X` executa transição sensível, `A` administra. `–` nega. Todas as concessões são condicionadas a organização, unidade ativa, vínculo ao atendimento e estado. O seletor visual da SPEC 00 não é uma identidade real.

| Recurso / operação | Recepção na unidade | Profissional vinculado | Financeiro na unidade | Gestão central/autorizada |
| --- | --- | --- | --- | --- |
| Cadastro básico do paciente / C,R,U | C,R,U | R mínimo de pacientes atendidos | R mínimo para conta | R mínimo, U sujeito a papel administrativo |
| Agenda / C,R,U, transferir | C,R,U,X em origem e destino | R própria agenda | R referência operacional | R consolidada, X exceção justificada |
| Confirmar, falta, corrigir, cancelar | X com motivo/precondição | – | – | R, liberação de bloqueio X |
| Evolução clínica, corpo / R, rascunho, final, adendo, invalidar | – | R,U,X nos atendimentos vinculados e escopo assistencial aprovado | – | – por padrão |
| Metadado clínico de pendência, sem conteúdo | R status operacional | R próprio | – | R contagem/status |
| Produção, contas e saldos / R | – | – | R | R agregado por unidade, sem corpo clínico |
| Conciliação, reabertura, ajuste, reversão financeira | – | – | X com motivo e alçada | R agregado; alçada gerencial a decidir |
| Políticas, regras e exceções / A | R efeito na agenda | R efeito na própria agenda | R regra de repasse vigente | A com trilha e escopo aprovados |
| Usuários, perfis, vínculos / A | – | – | – | Administrador central específico, não todo perfil de Gestão |
| Auditoria / R | própria operação mínima | própria operação mínima | eventos financeiros | metadados autorizados, sem conteúdo clínico |

Vínculos cruzados são cumulativos apenas mediante concessões independentes, sem união automática de escopos de unidade. Profissional com papel Financeiro não recebe texto clínico de pacientes fora de sua assistência. A transferência exige autorização em ambas as unidades, não apenas na origem. A Gestão consolidada precisa de concessão organizacional explícita; não é efeito implícito de um login.

## Camadas de autorização

1. Identidade verificada no servidor por Supabase Auth e sessão atual. O cliente envia somente intenção, referência, `expected_version` e chave idempotente. Ator e papéis vêm da sessão e dos vínculos ativos no banco.
2. Caso de uso valida papel, organização, unidade(s), vínculo profissional, estado e regra de negócio. Não delegar ao cliente o valor financeiro nem `actor_user_id`.
3. Grants explícitos são a porta da Data API: negar `anon`, liberar `authenticated` apenas às relações/projeções necessárias; tabelas sensíveis e funções privilegiadas ficam fora de schemas expostos ou sem grant direto.
4. RLS habilitada em toda tabela exposta, inclusive referências, com predicado de organização + papel/vínculo. `SELECT`, `INSERT`, `UPDATE` e eventual `DELETE` têm políticas separadas; `UPDATE` exige `USING` e `WITH CHECK`. Sem `DELETE` para eventos, notas finais e lançamentos.
5. Projeções agregadas de Gestão não incluem texto clínico; views expostas usam invocador e são testadas com usuários reais de teste. Funções de escrita transacional, se indispensáveis, ficam privadas, com grants estreitos, identidade verificada e revisão de `search_path`/elevação de privilégio.
6. RLS não substitui autorização transacional, constraints nem isolamento por tenant nas FKs. `service_role` nunca é enviado ao browser e não é usado para ações comuns de usuário.

## Cenários negativos obrigatórios no CP-02 e CP-04

| ID | Tentativa | Resultado esperado |
| --- | --- | --- |
| S01 | Anônimo consultar paciente, agenda ou notas | Negado, sem dados e sem indicar existência do registro |
| S02 | Recepção da Unidade I ler/alterar atendimento da II por UUID direto | Negado, salvo transferência com concessões de ambas e comando específico |
| S03 | Profissional A ler evolução do profissional B sem vínculo assistencial | Negado mesmo conhecendo paciente e UUID da nota |
| S04 | Financeiro/Gestão consultar corpo clínico por API, view ou relação indireta | Negado; indicadores sem conteúdo clínico |
| S05 | Usuário revogado usar token ainda válido para alterar conta ou nota | Negado por vínculo ativo no banco; testar atualização de sessão |
| S06 | Recepção tentar alterar `unit_id`, `organization_id` ou profissional por UPDATE direto | Negado em `WITH CHECK`; apenas caso de uso de transferência autorizado |
| S07 | Ator forjar `user_metadata`, papel, valor, autor ou organização no payload | Ignorado/negado; sem confiar em claim editável |
| S08 | Duas confirmações simultâneas e repetição da mesma chave | Um ciclo ativo e um resultado idempotente, sem duplicidade |
| S09 | Reutilizar chave idempotente com payload diferente | Conflito, sem efeitos novos |
| S10 | Tentativa de reconciliação com saldo insuficiente ou conta revertida | Negada; saldos e histórico intactos |
| S11 | Transferir para unidade sem vínculo profissional ou permissão de destino | Negada, sem mudar ID, eventos ou saldos |
| S12 | Notificação antiga acionar confirmação após falta/cancelamento | Comando revalida estado e nega a ação |

Testes devem exercitar consulta normal, ID direto, joins, filtros, views e canais de escrita. Matriz PASS/FAIL/NOT TESTED com usuário sintético de cada papel e unidade. Revisar planos e índices das políticas sem relaxar predicados para corrigir desempenho.
