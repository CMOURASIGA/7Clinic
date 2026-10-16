# SPEC 01 CP-01 | Contratos de comandos, auditoria e migração

**Contrato comum:** `command_id` (UUID/idempotência), `appointment_id` quando aplicável, `expected_version`, dados mínimos e motivo obrigatório nas ações sensíveis. Identidade e unidade autorizada são obtidas no servidor. Resposta: resultado tipado, estado/versão atual, IDs de eventos e erro estável (`FORBIDDEN`, `CONFLICT`, `INVALID_STATE`, `PRECONDITION`, `NOT_FOUND`). Repetição exata devolve o mesmo resultado. A transação grava estado, eventos, auditoria mínima e recibo idempotente antes de responder.

| Comando | Leituras e locks na mesma transação | Escritas e pós-condição |
| --- | --- | --- |
| `confirmAppointment` | validar ator/unidade, versão, estado `scheduled`, política/bloqueio, exceção, slot e regra de repasse vigente; serializar por atendimento | status `confirmed`, evento, ciclo de produção, `receivable`, `payable`, recibo; chave única de ciclo ativo; prontuário pendente como projeção. Falha reverte tudo |
| `reverseConfirmation` | atendimento confirmado, motivo, nota ativa e ambas contas; negar se evolução não tratada ou conciliação ativa | evento de reversão compensatória, ciclo inativo, status `scheduled` somente se slot ainda livre; ou cancelamento no mesmo comando elegível. Sem apagar nota/evento |
| `transferAppointment` | permissão origem e destino, vínculo do profissional, versão e conflito em ambas; serializar por paciente/profissional e slot | mesma PK, nova unidade, evento com origem/destino, versão incrementada; sem criar produção. Confirmado requer fluxo de estorno aprovado antes de transferir |
| `settleAccount` | papel/alçada, conta ativa, saldo, versão e chave; lock na conta | evento de recebimento ou pagamento com valor válido, saldo derivado, auditoria; outra conta permanece independente |
| `reopenSettlement` | conta com conciliação, autorização e motivo; lock e checagem de saldo | evento compensatório referenciando liquidação original, novo saldo, histórico preservado |
| `cancel/absence/correctAbsence/edit` | estado, versão, motivo quando exigido, slot ativo e permissões | transição, evento, versão; falta/cancelado sem produção ativa; correção não reabre slot ocupado |
| `saveDraft/finalize/addendum/invalidate` | autoria/vínculo, atendimento confirmado, nota/versão e permissão clínica | versão ou evento clínico privado, final congelado, adendo ou invalidação; auditoria genérica apenas tipo e IDs |

## Concorrência e falhas

- `expected_version` impede perda silenciosa de edição. Conflito retorna versão atual sem aplicar efeitos.
- Locks em ordem estável para atendimento, paciente/profissional e conta evitam ciclo duplo e deadlock; a técnica física (constraints, transação e eventual advisory lock) será ensaiada no CP-03. Constraints no banco são a última defesa contra colisão e ciclo ativo duplicado.
- A chave idempotente é única por organização, ator e tipo de comando. Guardar hash canônico da intenção e referências da resposta. Mesmo hash retorna resultado anterior; hash diferente é conflito. Escopo e retenção exatos serão fixados antes do CP-03.
- Se notificação assíncrona falhar após commit, o comando permanece confirmado. Evento de saída com chave única permite reprocessamento sem repetir lançamento. Indicadores são projeções recalculáveis do estado vigente.
- Auditoria funcional append-only: `actor_user_id`, papel efetivo, organização, unidade, alvo, tipo, motivo codificado ou texto controlado, correlação, instante, resultado e versão. Nunca corpo clínico, carteira, tokens ou payload completo. Falhas de acesso entram em telemetria de segurança com minimização e retenção definida.

## Interfaces propostas

```typescript
interface ClinicalUnitOfWork {
  execute<T>(identity: VerifiedIdentity, operation: (tx: DomainTransaction) => Promise<T>): Promise<T>;
}
interface DomainTransaction {
  appointments: AppointmentRepository;
  notes: ClinicalNoteRepository;
  finances: FinancialAccountRepository;
  rules: PolicyRepository;
  events: EventRepository;
  receipts: CommandReceiptRepository;
}
interface AppointmentRepository {
  getForUpdate(id: string): Promise<AppointmentRecord | null>;
  assertSlotAvailable(input: SlotQuery): Promise<void>;
  save(record: AppointmentRecord, expectedVersion: number): Promise<void>;
}
interface ReadModels {
  reception(identity: VerifiedIdentity, filter: AgendaFilter): Promise<ReceptionView>;
  professional(identity: VerifiedIdentity, filter: AgendaFilter): Promise<ProfessionalView>;
  finance(identity: VerifiedIdentity, filter: FinanceFilter): Promise<FinanceView>;
  management(identity: VerifiedIdentity, filter: ManagementFilter): Promise<ManagementView>;
}
```

Essas assinaturas são contratos de desenho, não código executável. O adaptador local preserva comandos da SPEC 00 para testes e demonstração; o adaptador Postgres é implementado por etapas após autorização. A interface não expõe uma operação genérica de gravação de tabela ao browser. O caso de uso controla transação, autorização e eventos.

## Migração incremental e reversão

1. Congelar fixtures e testes da SPEC 00, inclusive invariantes de confirmação paralela, reversão, duplicidade e filtros. Manter Preview local-first de referência.
2. CP-02 implementa identidade/vínculos e políticas em projeto isolado, sintético. CP-03 move agenda e eventos por comando; CP-04 move clínica e financeiro com leituras segregadas. Feature flag por ambiente escolhe um adaptador para cada jornada completa, evitando escrita dupla sem coordenação.
3. Comparar contagem de atendimentos, ciclos, saldos, estados e permissões em massa sintética. Mapeamento de IDs demonstrativos para UUID apenas em importação de teste; nenhum navegador público envia `localStorage` ao banco.
4. Rollback de aplicação retorna ao build anterior se o esquema ainda for compatível. Migrações seguem expandir, migrar, contrair em etapas; rollback de código não apaga eventos já gravados. Falha de dados requer restauração isolada ensaiada e plano de reconciliação, não `DROP` automático.
5. Antes de dado real: decidir legado, janela de corte, suspensão de escrita, reconciliação e RPO/RTO, testar restore, isolamento RLS e Human Validation integrada. Autorizar o corte separadamente.

## Gates por implementação futura

Testes de contrato local versus remoto, concorrência com duas requisições, repetição de comando, falha entre passos transacionais, RLS cruzado, saldos após compensação, typecheck, lint, build, smoke desktop/mobile e Preview sintético. Nenhuma equivalência será declarada antes desses testes no backend real.
