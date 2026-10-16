# 7Clinic

Sistema de gestão clínica da Clínica Movimentar-se. Documentação técnica, sem dados reais.

Início obrigatório: [Plano mestre](docs/PLANO_MESTRE.md) → [Governança](docs/GOVERNANCA.md) → [SPEC 00](docs/specs/SPEC_00_MVP_OPERACIONAL.md).

**A SPEC 00 está em desenvolvimento na branch `feat/spec-00-mvp-operacional`. A SPEC 01 (banco Supabase definitivo) depende de homologação formal da SPEC 00 e não está autorizada.**

Repositório público: não publicar credenciais, dados clínicos, contratos ou arquivos legados.

## MVP demonstrativo

`npm install`, `npm run dev`. Para verificar: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.

O MVP é local-first, usa apenas dados fictícios e persiste o estado no navegador. A troca de perfil demonstra as telas, mas **não substitui autenticação ou autorização segura**. Não cadastrar pacientes nem evoluções reais. O roteiro e as limitações estão em [Checkpoint 02](docs/checkpoints/SPEC_00_CHECKPOINT_02.md).

## Verificação E2E da SPEC 00

Com o build pronto, inicie `npm run start` em outro terminal e execute `npm run test:e2e`. O teste usa Playwright e verifica desktop (1440 px), tablet (768 px) e celular (390 px), além de confirmação, financeiro, prontuário e persistência. Instale o Chromium do Playwright no ambiente de testes ou informe `CHROMIUM_EXECUTABLE_PATH` para um binário compatível. `BASE_URL` permite apontar para outro servidor, por padrão `http://localhost:3000`.
