import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://localhost:3000";
await mkdir("artifacts/visual", { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined, args: ["--no-sandbox"] });
try {
  for (const viewport of [{ name: "desktop", width: 1440, height: 900 }, { name: "tablet", width: 768, height: 1024 }, { name: "mobile", width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const nav = page.getByRole("navigation", { name: "Ambientes" });
    async function go(name) {
      if (viewport.width <= 730) await page.getByRole("button", { name: "Abrir menu" }).click();
      await nav.getByRole("button", { name, exact: true }).click();
    }
    async function evidence(name) { await page.screenshot({ path: `artifacts/visual/${viewport.name}-${name}.png`, fullPage: true }); }
    try {
      await page.goto(base);
      await page.getByRole("heading", { name: "Agenda e atendimento" }).waitFor();
      const original = page.locator(".appointment").filter({ hasText: "14:00" });
      await original.getByRole("button", { name: "Desfazer confirmação" }).click();
      await page.getByRole("dialog", { name: "Operação bloqueada" }).getByText("evolução clínica ativa", { exact: false }).waitFor();
      await evidence("reversao-bloqueada-clinica");
      await page.getByRole("dialog", { name: "Operação bloqueada" }).getByRole("button", { name: "Abrir prontuário" }).click();
      await page.getByRole("heading", { name: "Prontuário demonstrativo" }).waitFor();
      await page.getByRole("button", { name: "Finalizar", exact: true }).click();
      await page.getByRole("heading", { name: "Evolução finalizada" }).waitFor();
      await page.getByRole("textbox", { name: "Complemento fictício" }).fill("Complemento exclusivamente fictício para homologação.");
      await page.getByRole("button", { name: "Adicionar complemento" }).click();
      await page.getByRole("button", { name: "Invalidar evolução" }).click();
      await page.getByRole("dialog", { name: "Invalidar evolução" }).getByLabel("Motivo").fill("Correção clínica fictícia justificada");
      await page.getByRole("dialog", { name: "Invalidar evolução" }).getByRole("button", { name: "Confirmar" }).click();
      await page.getByRole("heading", { name: "Histórico clínico do atendimento, somente leitura" }).waitFor();
      await page.getByText("Complemento exclusivamente fictício para homologação.").first().waitFor();
      await evidence("historico-invalidado");
      await page.getByRole("button", { name: "Voltar ao contexto anterior" }).click();
      await page.getByRole("heading", { name: "Agenda e atendimento" }).waitFor();
      await original.getByRole("button", { name: "Desfazer confirmação" }).click();
      await page.getByRole("dialog", { name: "Operação bloqueada" }).getByText("recebimento ou repasse conciliado", { exact: false }).waitFor();
      await evidence("reversao-bloqueada-financeiro");
      await page.getByRole("dialog", { name: "Operação bloqueada" }).getByRole("button", { name: "Abrir financeiro" }).click();
      const focused = page.locator(".ledger-item.appointment-focused");
      await focused.getByRole("button", { name: "Reabrir recebimento" }).click();
      await page.getByRole("dialog", { name: "Reabrir recebimento" }).getByLabel("Motivo").fill("Recebimento fictício reaberto para correção");
      await page.getByRole("dialog", { name: "Reabrir recebimento" }).getByRole("button", { name: "Confirmar" }).click();
      await page.getByRole("button", { name: "Voltar ao atendimento" }).click();
      await original.getByRole("button", { name: "Desfazer confirmação" }).click();
      await page.getByRole("dialog", { name: "Desfazer atendimento" }).getByLabel("Motivo").fill("Confirmação fictícia lançada incorretamente");
      await page.getByRole("dialog", { name: "Desfazer atendimento" }).getByRole("button", { name: "Confirmar" }).click();
      await original.locator(".status-scheduled").waitFor();
      await evidence("reversao-concluida");
      const transferRow = page.locator(".appointment").filter({ hasText: "09:00" });
      await transferRow.getByRole("combobox", { name: /Transferir/ }).selectOption("u2");
      assert.ok((await transferRow.innerText()).includes("Unidade II"));
      const absentRow = page.locator(".appointment").filter({ hasText: "11:00" });
      await absentRow.getByRole("button", { name: "Falta" }).click();
      await absentRow.locator(".status-absent").waitFor();
      await absentRow.getByRole("button", { name: "Desfazer falta" }).click();
      await page.getByRole("dialog", { name: "Desfazer atendimento" }).getByLabel("Motivo").fill("Falta fictícia corrigida pela recepção");
      await page.getByRole("dialog", { name: "Desfazer atendimento" }).getByRole("button", { name: "Confirmar" }).click();
      await absentRow.getByRole("button", { name: "Cancelar" }).click();
      await page.getByRole("dialog", { name: "Cancelar atendimento" }).getByLabel("Motivo").fill("Atendimento fictício cancelado pela recepção");
      await page.getByRole("dialog", { name: "Cancelar atendimento" }).getByRole("button", { name: "Confirmar" }).click();
      await absentRow.locator(".status-cancelled").waitFor();
      await evidence("recepcao-correcoes");

      await page.getByRole("button", { name: "+ Agendar" }).click();
      const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Criar agendamento" }) });
      await form.getByLabel("Paciente").selectOption("p3");
      await form.getByLabel("Horário").fill("18:30");
      await form.getByRole("button", { name: "Criar agendamento" }).click();
      const newRow = page.locator(".appointment").filter({ hasText: "18:30" });
      await newRow.getByRole("button", { name: "Confirmar" }).click();
      await go("Profissionais");
      await page.getByRole("combobox", { name: "Profissional" }).selectOption("pr1");
      await page.locator(".clinical-row").filter({ hasText: "18:30" }).click();
      await page.getByRole("heading", { name: "Evolução pendente" }).waitFor();
      await page.getByRole("textbox", { name: "Evolução fictícia" }).fill("Rascunho fictício inicial do novo atendimento.");
      await page.getByRole("button", { name: "Salvar rascunho" }).click();
      await page.getByRole("textbox", { name: "Evolução fictícia" }).fill("Rascunho fictício revisto antes da finalização.");
      await page.getByRole("button", { name: "Salvar rascunho" }).click();
      await page.getByRole("button", { name: "Finalizar", exact: true }).click();
      await page.getByRole("heading", { name: "Evolução finalizada" }).waitFor();
      await evidence("evolucao-finalizada");
      await go("Financeiro");
      assert.ok((await page.getByText("Produção gerada filtrada").locator("..").innerText()).includes("480,00"));
      await page.getByRole("combobox", { name: "Conta" }).selectOption("payable");
      await page.getByRole("combobox", { name: "Situação" }).selectOption("open");
      assert.ok((await page.getByText("A receber", { exact: true }).locator("..").innerText()).includes("0,00"));
      await evidence("contas-filtradas");
      await page.getByRole("combobox", { name: "Conta" }).selectOption("all");
      await page.getByRole("combobox", { name: "Situação" }).selectOption("all");
      const newEntry = page.locator(".ledger-item").filter({ hasText: "fin:a12" });
      await newEntry.getByRole("button", { name: "Marcar recebido" }).click();
      await newEntry.getByRole("button", { name: "Marcar pago" }).click();
      await newEntry.getByRole("button", { name: "Reabrir repasse" }).click();
      await page.getByRole("dialog", { name: "Reabrir repasse" }).getByLabel("Motivo").fill("Repasse fictício reaberto para conferência");
      await page.getByRole("dialog", { name: "Reabrir repasse" }).getByRole("button", { name: "Confirmar" }).click();
      await newEntry.getByRole("button", { name: "Marcar pago" }).waitFor();
      await evidence("conciliacao-e-reabertura");
      await go("Gestão");
      await page.getByRole("heading", { name: "Produção por profissional" }).waitFor();
      await page.getByRole("combobox", { name: "Filtrar profissional gestão" }).selectOption("pr1");
      await page.getByRole("heading", { name: "Painel de gestão" }).waitFor();
      await evidence("gestao-profissional");
      await page.getByRole("combobox", { name: "Filtrar profissional gestão" }).selectOption("");
      await page.getByRole("textbox", { name: "Perguntar à Maia" }).fill("receita e repasse");
      await page.getByRole("button", { name: "Perguntar" }).click();
      await page.getByText("Supervisão financeira demonstrativa", { exact: false }).waitFor();
      const exception = page.locator("form.exception").filter({ hasText: "Paciente Exemplo A" }).first();
      await exception.getByLabel("Justificativa").fill("Liberação excepcional fictícia da gestão");
      await exception.getByRole("button", { name: "Liberar" }).click();
      await page.getByText("Ação registrada na demonstração.").waitFor();
      await evidence("gestao-excecao-maia");
      await page.reload();
      await page.getByRole("heading", { name: "Agenda e atendimento" }).waitFor();
      assert.equal(await page.locator(".appointment").filter({ hasText: "18:30" }).locator(".status-confirmed").count(), 1);
      if (viewport.width <= 730) await page.getByRole("button", { name: "Abrir menu" }).click();
      await page.getByRole("button", { name: /Reiniciar cenário fictício/ }).click();
      await page.getByRole("dialog", { name: "Reiniciar cenário fictício" }).getByRole("button", { name: "Manter dados" }).click();
      assert.equal(await page.locator(".appointment").filter({ hasText: "18:30" }).count(), 1);
      await page.getByRole("button", { name: /Reiniciar cenário fictício/ }).click();
      await page.getByRole("dialog", { name: "Reiniciar cenário fictício" }).getByRole("button", { name: "Sim, reiniciar cenário" }).click();
      assert.equal(await page.locator(".appointment").filter({ hasText: "18:30" }).count(), 0);
      assert.deepEqual(errors, [], `${viewport.name}: erros no navegador`);
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 2, `${viewport.name}: overflow horizontal`);
      console.log(`PASS ${viewport.name}: bloqueios, retorno, clínica, financeiro, gestão, persistência e reset`);
    } finally {
      await context.tracing.stop({ path: `artifacts/visual/${viewport.name}-trace.zip` });
      await context.close();
    }
  }
} finally {
  await browser.close();
}
