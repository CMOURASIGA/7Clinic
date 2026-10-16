# SPEC 00 | Checkpoint 01

## Escopo entregue
- Estrutura Next.js com TypeScript.
- Shell visual inspirado no 7Commander, responsivo.
- Whitelabel Clínica Movimentar-se no canto superior esquerdo.
- Navegação local entre Recepção, Profissional e Gestão.
- Visões sintéticas por perfil, por unidade e consolidada.
- Calendário no menu lateral, topbar de usuário e notificações demonstrativas.
- Maia identificada como modo demonstrativo, sem chamadas externas.

## Estratégia local-first
O Checkpoint 01 usa apenas massa sintética embutida na interface para validar a experiência. Nos próximos checkpoints da SPEC 00, o estado demonstrativo ficará atrás de uma camada de repositório local, persistida em `localStorage`, separando:
1. entidades e regras de domínio;
2. casos de uso de confirmação, falta, transferência e exceção;
3. repositórios locais;
4. componentes de interface.

Essa separação prepara a troca futura para Supabase sem reproduzir regras de negócio nas telas.

## Limites preservados
- Sem Supabase, credenciais, APIs externas ou dados reais.
- Sem fluxos operacionais de confirmação, prontuário, financeiro, transferências ou bloqueios ainda.
- Não iniciar SPEC 01 antes da homologação formal da SPEC 00.

## Próximos checkpoints, condicionados à aprovação
1. Massa local e domínio: pacientes, agenda, unidades, regras e auditoria demonstrativa.
2. Recepção: confirmação, falta, transferência, pendências, bloqueio e liberação excepcional.
3. Profissional: prontuário simulado, permissões e alertas.
4. Gestão: indicadores, financeiro, parametrização e Maia demonstrativa.
5. Testes dos cenários e pacote de homologação.