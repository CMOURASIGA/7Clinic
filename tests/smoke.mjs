import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
  args: ["--no-sandbox"],
});
const base = process.env.BASE_URL ?? "http://localhost:3000";

try {
  for (const viewport of [{ name: "desktop", width: 1440, height: 900 }, { name: "mobile", width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    await context.addInitScript(() => {
      if (!sessionStorage.getItem("7clinic:smoke:started")) {
        localStorage.removeItem("7clinic:spec00:demo:v1");
        sessionStorage.setItem("7clinic:smoke:started", "true");
      }
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const nav = page.getByRole("navigation", { name: "Ambientes" });
    async function go(name) {
      if (viewport.name === "mobile") await page.getByRole("button", { name: "Abrir menu" }).click();
      await nav.getByRole("button", { name, exact: true }).click();
    }
    await page.goto(base);
    await page.getByRole("heading", { name: "Agenda e atendimento" }).waitFor();
    if (viewport.name === "mobile") {
      await page.getByRole("button", { name: "Abrir menu" }).click();
      assert.equal(await page.getByLabel("Mini calendário da agenda").isVisible(), true);
      await nav.getByRole("button", { name: "Recepção" }).click();
    }
    await page.getByRole("button", { name: "+ Agendar" }).click();
    const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Criar agendamento" }) });
    await form.getByLabel("Paciente").selectOption("p3");
    await form.getByLabel("Horário").fill("18:30");
    await page.getByRole("button", { name: "Criar agendamento" }).click();
    const row = page.locator(".appointment").filter({ hasText: "18:30" });
    await row.getByRole("button", { name: "Confirmar" }).click();
    await page.getByText("Ação registrada na demonstração.").waitFor();
    await go("Profissionais");
    await page.getByRole("heading", { name: "Minha agenda" }).waitFor();
    await page.locator(".clinical-row").filter({ hasText: "18:30" }).click();
    await page.getByRole("heading", { name: "Evolução pendente" }).waitFor();
    await go("Financeiro");
    await page.getByText("Produção gerada filtrada").waitFor();
    assert.ok((await page.getByText("Produção gerada filtrada").locator("..").innerText()).includes("600,00"));
    await go("Gestão");
    await page.getByRole("heading", { name: "Painel de gestão" }).waitFor();
    await go("Recepção");
    await page.getByLabel("Filtrar data").fill("2026-10-17");
    await page.getByText("Nenhum atendimento para os filtros selecionados.").waitFor();
    await page.getByLabel("Filtrar data").fill("2026-10-16");
    await page.reload();
    await page.getByRole("heading", { name: "Agenda e atendimento" }).waitFor();
    assert.equal(await page.locator(".status-confirmed").count(), 5);
    assert.deepEqual(errors, []);
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 2);
    console.log(`PASS smoke ${viewport.name}: quatro ambientes, agendamento, confirmação, calendário, financeiro, persistência e sem erro crítico`);
    await context.close();
  }
} finally {
  await browser.close();
}
