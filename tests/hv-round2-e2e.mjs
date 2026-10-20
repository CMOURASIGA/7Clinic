import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://localhost:3000";
await mkdir("artifacts/visual", { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined, args: ["--no-sandbox"] });
try {
  for (const size of [{ name: "desktop", width: 1440, height: 900 }, { name: "tablet", width: 768, height: 1024 }, { name: "mobile", width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport: { width: size.width, height: size.height } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const nav = page.getByRole("navigation", { name: "Ambientes" });
    async function menu() { if (size.width <= 730) await page.getByRole("button", { name: "Abrir menu" }).click(); }
    async function go(name) { await menu(); await nav.getByRole("button", { name, exact: true }).click(); }
    async function photo(label) { await page.screenshot({ path: `artifacts/visual/hv2-${size.name}-${label}.png`, fullPage: true }); }
    try {
      await page.goto(base);
      await page.getByRole("heading", { name: "Agenda e atendimento" }).waitFor();
      if (size.width > 730) {
        const sidebar = await page.locator(".sidebar").evaluate((element) => ({ scroll: element.scrollHeight, height: element.clientHeight }));
        const nav = await page.locator(".nav-links").evaluate((element) => ({ scroll: element.scrollHeight, height: element.clientHeight }));
        assert.ok(sidebar.scroll <= sidebar.height + 2, `${size.name}: sidebar não deveria rolar`);
        assert.ok(nav.scroll <= nav.height + 2, `${size.name}: menu não deveria ter rolagem interna`);
        for (const label of ["Recepção", "Profissionais", "Gestão", "Financeiro"]) assert.equal(await page.getByRole("navigation", { name: "Ambientes" }).getByRole("button", { name: label, exact: true }).isVisible(), true);
        assert.equal(await page.locator(".calendar-box").isVisible(), true);
        await page.locator(".sidebar").screenshot({ path: `artifacts/visual/hv2-${size.name}-sidebar-depois.png` });
      }
      await menu();
      assert.equal(await page.getByRole("img", { name: "Logo Consult Services" }).isVisible(), true);
      await page.getByRole("button", { name: "Selecionar 2026-10-17" }).click();
      if (size.width <= 730) await page.getByRole("button", { name: "Fechar menu lateral" }).click();
      await page.getByText("Nenhum atendimento para os filtros selecionados.").waitFor();
      await menu();
      await page.getByRole("button", { name: "Selecionar 2026-10-16" }).click();
      if (size.width <= 730) await page.getByRole("button", { name: "Fechar menu lateral" }).click();
      await page.getByRole("button", { name: "+ Agendar" }).click();
      const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Criar agendamento" }) });
      await form.getByLabel("Paciente").selectOption("p3");
      await form.getByLabel("Horário").fill("18:30");
      await form.getByRole("button", { name: "Criar agendamento" }).click();
      const row = page.locator(".appointment").filter({ hasText: "18:30" });
      await row.getByRole("button", { name: "Excluir agendamento" }).click();
      await page.getByRole("dialog", { name: "Excluir agendamento" }).getByRole("button", { name: "Manter agendamento" }).click();
      assert.equal(await row.count(), 1);
      await row.getByRole("button", { name: "Excluir agendamento" }).click();
      await page.getByRole("dialog", { name: "Excluir agendamento" }).getByRole("button", { name: "Sim, excluir agendamento" }).click();
      assert.equal(await row.count(), 0);
      const blocked = page.locator(".appointment").filter({ hasText: "15:00" });
      await blocked.getByText("Confirmação bloqueada", { exact: false }).waitFor();
      assert.match(await blocked.innerText(), /atendimento anterior deste paciente, agendado para 16\/10\/2026 às 08:00/);
      assert.doesNotMatch(await blocked.innerText(), /\ba\d+\b/);
      await blocked.getByRole("button", { name: "Ver atendimento das 08:00" }).click();
      await page.locator(".appointment-focused").filter({ hasText: "08:00" }).waitFor();
      await photo("recepcao-calendario-bloqueio");
      await go("Profissionais");
      await page.getByRole("button", { name: "Selecionar 2026-10-17" }).count();
      await page.getByRole("heading", { name: "Minha agenda" }).waitFor();
      await go("Financeiro");
      const cards = page.locator(".stat-action");
      const initial = await cards.locator("strong").allInnerTexts();
      assert.deepEqual(initial.slice(0, 5), ["R$ 480,00", "R$ 240,00", "R$ 240,00", "R$ 54,00", "R$ 18,00"]);
      for (let index = 0; index < 6; index++) {
        await cards.nth(index).click();
        assert.equal(await cards.nth(index).getAttribute("aria-pressed"), "true");
        assert.equal(await page.getByRole("combobox", { name: "Conta" }).inputValue(), "all");
        assert.equal(await page.getByRole("combobox", { name: "Situação" }).inputValue(), "all");
        assert.deepEqual(await cards.locator("strong").allInnerTexts(), initial, `card ${index} alterou indicadores`);
        await page.getByRole("button", { name: "Limpar indicador selecionado" }).click();
      }
      await page.getByRole("combobox", { name: "Conta" }).selectOption("receivable");
      await page.getByRole("combobox", { name: "Situação" }).selectOption("open");
      assert.equal(await cards.nth(1).locator("strong").innerText(), "R$ 240,00");
      await page.getByRole("combobox", { name: "Conta" }).selectOption("all");
      await page.getByRole("combobox", { name: "Situação" }).selectOption("all");
      await page.getByRole("heading", { name: "Histórico financeiro" }).waitFor();
      await photo("financeiro-indicadores");
      await go("Gestão");
      const prompt = page.getByRole("textbox", { name: "Perguntar à Maia" });
      for (const [question, result] of [
        ["Qual profissional possui mais prontuários pendentes?", "Profissional Exemplo 2"],
        ["Quantos atendimentos estão aguardando confirmação?", "5 atendimento"],
        ["Qual unidade possui mais pendências?", "Unidade I"],
        ["Qual é a produção por profissional?", "Profissional Exemplo 1"],
        ["Quais recebimentos estão pendentes?", "2 recebimento"],
        ["Previsão do tempo?", "Ainda não consigo responder"],
      ]) {
        await prompt.fill(question);
        await page.getByRole("button", { name: "Perguntar" }).click();
        await page.locator(".maia-answer").getByText(result, { exact: false }).waitFor();
      }
      await page.getByRole("spinbutton", { name: "Repasse por consulta (R$)" }).fill("30");
      await page.getByRole("button", { name: "Atualizar regra" }).click();
      await page.getByText("Vigente: R$ 30,00", { exact: false }).waitFor();
      await page.getByRole("combobox", { name: "Auditoria operação" }).selectOption("DELETE_APPOINTMENT");
      await page.getByText("Agendamento lançado indevidamente excluído", { exact: false }).waitFor();
      await page.getByRole("textbox", { name: "Nome da marca" }).fill("Marca Fictícia");
      await page.getByRole("button", { name: "Salvar identidade" }).click();
      await page.getByRole("img", { name: "Logo Marca Fictícia" }).waitFor();
      await page.reload();
      await go("Gestão");
      await page.getByRole("img", { name: "Logo Marca Fictícia" }).waitFor();
      await page.getByRole("button", { name: "Restaurar Consult Services" }).click();
      await page.getByRole("img", { name: "Logo Consult Services" }).waitFor();
      await photo("gestao-maia-auditoria-marca");
      await page.reload();
      await page.getByRole("heading", { name: "Agenda e atendimento" }).waitFor();
      await go("Financeiro");
      await page.getByText("Valor para novas confirmações: R$ 30,00", { exact: false }).waitFor();
      assert.deepEqual(errors, []);
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 2, `${size.name}: overflow`);
      console.log(`PASS HV02 ${size.name}: calendário, exclusão, bloqueio, financeiro, Maia, auditoria, marca e persistência`);
    } finally {
      await context.tracing.stop({ path: `artifacts/visual/hv2-${size.name}-trace.zip` });
      await context.close();
    }
  }
  const short = await browser.newContext({ viewport: { width: 1280, height: 600 } });
  try {
    const page = await short.newPage();
    await page.goto(base);
    await page.getByRole("heading", { name: "Agenda e atendimento" }).waitFor();
    assert.equal(await page.locator(".nav-links").evaluate((element) => element.scrollHeight <= element.clientHeight + 2), true);
    await page.locator(".sidebar").evaluate((element) => { element.scrollTop = element.scrollHeight; });
    assert.equal(await page.locator(".calendar-box").isVisible(), true);
    assert.equal(await page.getByRole("navigation", { name: "Ambientes" }).getByRole("button", { name: "Financeiro" }).isVisible(), true);
    await page.locator(".sidebar").screenshot({ path: "artifacts/visual/hv2-desktop-baixa-altura-sidebar-depois.png" });
  } finally { await short.close(); }
} finally { await browser.close(); }
