# Plano mestre 7Clinic

## Escopo aprovado para apresentação
Duas unidades, três ambientes (recepção, profissionais, gestão), whitelabel padrão 7Commander com menu lateral e calendário, agenda, confirmação, faltas, transferências, prontuário, financeiro, pendências, bloqueios configuráveis, relatórios e Maia simulada.

## Invariantes
- Confirmar atendimento habilita **em paralelo** prontuário obrigatório e registro financeiro. Não existe dependência financeira do preenchimento clínico.
- Repasse padrão **R$ 18 por consulta**, inicialmente para qualquer especialidade, parametrizável e com histórico de vigência.
- Convênio: carteira vinculada ao paciente; preenchimento da guia no portal do convênio fora de escopo; contas a receber e conciliação dentro do 7Clinic.
- Duas unidades com acesso segregado, gestão consolidada e transferências sem duplicação.
- Notificações e bloqueios são configuráveis pela gestão, com exceções auditadas.
- Relatórios: presença/faltas, financeiro por profissional, contas a pagar/receber por período.
- Maia é demonstrativa no MVP, não clínica nem conectada a IA real.

## Gates
SPEC 00 tecnicamente completa → smoke básico → preparação e aprovação arquitetural da SPEC 01 → implementação autorizada → SPECs posteriores → Human Validation integrada antes de operação real. Integração de branches e provisionamento exigem autorizações próprias; conclusão técnica não equivale à homologação funcional.

## Cronograma-alvo
Out/2026 definição e MVP; nov/2026 base; dez/2026 integrações; jan/2027 homologação; fev/2027 produção, sujeito a aceite e dependências.

## Pendências de refinamento
Volume real de usuários e unidades; regras de faltas, recebíveis e exceções; campos do prontuário; formato e qualidade do legado; políticas de retenção, backups e prazos. Não inventar essas regras no desenvolvimento.

## Fora do escopo inicial
Integração automática com portal de convênios, emissão fiscal, conciliação bancária, WhatsApp, telemedicina e IA diagnóstica.
