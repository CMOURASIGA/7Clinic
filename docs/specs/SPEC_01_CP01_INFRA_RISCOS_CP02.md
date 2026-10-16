# SPEC 01 CP-01 | Ambientes, custos, riscos e plano executivo CP-02

**Orçamento de referência em 16/10/2026, USD/mês.** Não houve compra, projeto Supabase, configuração de conta nem cotação contratual. Valores dependem de consumo, impostos, câmbio, usuários, plano e recursos opcionais. Revalidar preços antes de autorizar gastos.

## Isolamento e alternativas

| Alternativa | Ambientes e dados | Custo base estimado | Uso proposto e limite |
| --- | --- | --- | --- |
| A, sem custo de banco agora | Desenvolvimento local isolado, Preview Supabase Free sintético, produção não criada | Supabase US$ 0; Vercel já existente sem custo incremental conhecido nesta proposta | Recomendada apenas para CP-02 sintético se a clínica aprovar provisionamento. Free pode pausar após inatividade e não tem backup automático; não é base para dado real |
| B, três projetos Pro | Desenvolvimento, Preview e produção em projetos separados, cada um Micro | Supabase cerca de US$ 45, composição ilustrativa: assinatura US$ 25 + US$ 30 de três Micro − US$ 10 em créditos | Isolamento completo e backup diário Pro, mas custo começa ao criar os projetos; produção só depois de aprovação e necessidade real |
| C, local + Preview e produção Pro | Desenvolvimento local, dois projetos Micro pagos separados | Supabase cerca de US$ 35, assinatura US$ 25 + US$ 20 de compute − US$ 10 em créditos | Custo menor com isolamento de Preview/produção; exige disciplina de ensaio local e produção não deve ser criada no CP-02 sem autorização |

Supabase lista Free US$ 0 com até dois projetos ativos, 500 MB/projeto, pausa por inatividade e sem backup automático. Pro começa em US$ 25/mês, inclui US$ 10 em créditos de compute, Micro custa US$ 10/projeto e backup diário com retenção de 7 dias. PITR é adicional a partir de US$ 100/mês por 7 dias, se a clínica exigir RPO mais restrito. Os preços não incluem excedentes, SMTP externo, domínio, storage adicional ou serviços de operação.

Vercel Hobby é US$ 0 para uso pessoal não comercial; Pro começa em US$ 20/mês com crédito de uso de US$ 20. **Antes de uso comercial real, revisar o enquadramento e o plano da conta**, além de consumo de funções, transferência e assentos. Não presumir que o Preview demonstrativo atual autoriza hospedagem comercial em Hobby. Para orçamento indicativo de dois projetos Supabase Pro + Vercel Pro, piso aproximado US$ 55/mês, antes de excedentes, backups adicionais e impostos. A assinatura Vercel pertence à conta/equipe e não deve ser somada duas vezes se já contratada.

São Paulo (`sa-east-1`) está listada como região disponível da plataforma Supabase. A escolha exige confirmar latência, custo, residência e fluxos de metadados com privacidade. Escolher região no provisionamento pode implicar migração para trocá-la depois. Não há promessa de que todos os dados e metadados permaneçam apenas no Brasil.

**Fontes oficiais consultadas:** https://supabase.com/pricing ; https://supabase.com/docs/guides/platform/backups ; https://supabase.com/docs/guides/platform/regions ; https://vercel.com/pricing ; https://vercel.com/docs/plans/hobby .

## Desenho de ambientes

- Git: `main` reservada, `develop` integrada, branch da SPEC 01 com PR Draft e Preview sintético. Uma branch não equivale a um banco isolado.
- Segredos separados por ambiente, acesso mínimo por mantenedor, rotação e inventário. Nunca chave secret/service role no cliente. Preview protegido e sem dados reais.
- Migrações versionadas e revisadas por PR depois de autorizadas, com dry run em ambiente isolado, verificação de grants/RLS e diffs. Sem SQL definitivo no CP-01.
- Backups e restauração: CP-02 ensaia dump/restore apenas de massa sintética; produção exige frequência, retenção, responsável, RPO e RTO aprovados. Backup existente não equivale a restore validado.
- Logs sem PHI e sem segredos, com correlação por comando e retenção definida. Testes de segurança usam identidades sintéticas em ambas as unidades.

## Riscos e decisões bloqueadoras

| Risco | Impacto e mitigação | Bloqueia |
| --- | --- | --- |
| Identidade duplicada ou compartilhamento inadequado de paciente | Exposição de histórico entre unidades ou atendimento fragmentado; validar D01, deduplicação e leitura mínima | CP-02 modelo definitivo e CP-03 cadastro |
| Concessão excessiva ou revogação tardia | Acesso indevido a saúde/financeiro; aprovar administradores D02, RLS negativa e vínculo ativo por requisição | CP-02 |
| Regra de slot/duração não confirmada | Dupla agenda ou bloqueio de encaixe legítimo; fixar D04 antes de constraint física | CP-03 |
| Cancelamento/reversão com nota ou conta ativa | Histórico e saldo inconsistentes; D05, contratos transacionais e teste concorrente | CP-03/CP-04 |
| R$ 120 e R$ 18 tratados como contrato | Receita/repasse incorreto; parâmetros D06–D07 e fixtures claramente fictícias | CP-04 |
| Nota final alterada ou acessível fora da assistência | Risco clínico e privacidade; D08, versão imutável, grants restritos e teste por UUID direto | CP-04 |
| Free usado com dados reais ou sem restore | Pausa e perda de capacidade de recuperação; ambientes separados, plano e ensaio de backup | Produção |
| Legado não inventariado | Duplicidade, conflito de IDs e dados sensíveis no Preview; importação sintética e plano D13 | Carga real |
| Human Validation adiada | Falha operacional não descoberta pelos testes; matriz completa e aceite antes de operação real | Produção |

## Plano executivo CP-02, sujeito a autorização específica de implementação

1. **Entrada:** o detalhamento técnico foi autorizado após a aprovação da arquitetura CP-01. Para iniciar implementação física e provisionamento, clínica designa responsável central por acesso, confirma hipótese de paciente único e limites de unidade, e aprova região/ambiente/custo escolhidos. Segurança confirma matriz RBAC e cenários negativos. O detalhamento não equivale a essa autorização.
2. **Escopo:** projeto não produtivo autorizado com dados sintéticos, Auth e usuários de teste, organizações/unidades, perfis e vínculos, grants mínimos, RLS e migrações versionadas. Sem prontuário real, financeiro real ou importação do legado.
3. **Entregas:** SHA e PR Draft, esquema e políticas revisados, tipos gerados, matriz de acesso com PASS/FAIL/NOT TESTED, relatório de Security Advisor, ensaio de backup/restore sintético, Preview protegido e custo observado.
4. **Gates:** anônimo negado; Recepção de uma unidade negada na outra; profissional não vinculado e Financeiro/Gestão negados no corpo clínico; revogação efetiva; UPDATE sem troca de tenant/unidade; grants explícitos; nenhum dado real. Testes, typecheck, lint, build, smoke desktop/mobile e `git diff --check`.
5. **Saída:** revisar falhas e custo antes do CP-03. Rollback de aplicação documentado, migração expansiva compatível e restore ensaiado. Sem merge, produção ou avanço automático.
