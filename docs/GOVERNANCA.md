# Governança

Branches `main` produção, `develop` integração, `feat/spec-NN-*` desenvolvimento. PR Draft até Human Validation, merge commit sem squash/rebase. `develop → main` somente com autorização expressa.

Status: PLANNED → AUTHORIZED → IN DEVELOPMENT → READY FOR HUMAN VALIDATION → APPROVED → MERGED.

Cada SPEC exige: escopo refinado, testes unitários/integrados/E2E conforme risco, typecheck, lint, build, `git diff --check`, Preview com dados sintéticos, evidências por perfil/unidade, matriz PASS/FAIL/NOT TESTED, SHA homologado e aprovação escrita. Exceção de sequência: em 16/10/2026 foi autorizada a preparação técnica da SPEC 01 após smoke básico da SPEC 00, cuja Human Validation integrada foi adiada. Essa autorização não cobre provisionamento nem implementação da SPEC 01 ou merge da SPEC 00. O estado TECHNICALLY COMPLETE não equivale a APPROVED.

Segurança: LGPD, dados de saúde sensíveis, menor privilégio, RLS, MFA, criptografia, backups e restore testados, auditoria, política de retenção aprovada. Não publicar dados pessoais ou credenciais em repo público. Nenhuma certificação de conformidade é presumida.
