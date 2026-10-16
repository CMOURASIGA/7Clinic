# SPEC 01 | FOUNDATION SUPABASE

**Estado:** preparação arquitetural autorizada; implementação e provisionamento pendentes de aprovação.
**Pré-requisito para implementar:** aprovação da arquitetura, definição das decisões abertas e integração técnica da SPEC 00 autorizada. A Human Validation integrada da SPEC 00 fica adiada para antes de qualquer operação real.

## Objetivo
Arquitetura Next.js App Router, TypeScript, Tailwind, Supabase com RLS e deploy Vercel.

## Entregáveis
Modelar pacientes, profissionais, unidades, convênios, atendimentos, evoluções, eventos financeiros, regras, notificações e auditoria; migrações versionadas.

## Regras críticas
Somente iniciar após aceite formal SPEC 00. Separar dados clínicos/financeiros, RLS por perfil/unidade, backup/restore, ambientes e logs sem dados sensíveis.

## Critérios de aceite
RLS testado com usuários cruzados, migração reversível, build e plano de recuperação documentados.

## Cenários obrigatórios
1. Fluxo principal com dados sintéticos e estados coerentes.
2. Fluxos de erro, duplicidade, cancelamento e autorização negada.
3. Permissões por perfil e unidade, sem vazamento clínico.
4. Regressão dos fluxos já homologados, desktop/tablet/celular.
5. Evidências com Preview, SHA, testes e matriz PASS/FAIL/NOT TESTED.

## Restrições
Não provisionar banco definitivo antes da aprovação da arquitetura. Não fazer merge automático nem declarar a SPEC 00 APPROVED sem homologação. Não usar dados reais no Preview público. Detalhes ainda não definidos devem virar decisões explícitas, nunca suposições do desenvolvedor. Ver `docs/specs/SPEC_01_PREPARACAO_TECNICA.md`.
