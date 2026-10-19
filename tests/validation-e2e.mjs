import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined, args: ["--no-sandbox"] });
try {
  for (const viewport of [{ name: "desktop", width: 1440, height: 900 }, { name: "tablet", width: 768, height: 1024 }, { name: "mobile", width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const nav = page.getByRole("navigation", { name: "Ambientes" });
    async function go(name) {
      if (viewport.width <= 730) await page.getByRole("button", { name: "Abrir menu" }).click();
      await nav.getByRole("button", { name, exact: true }).click();
    }
    await page.goto(base);
    await page.getByRole("heading", { name: "Agenda e atendimento" }).waitFor();
    const confirmed = page.locator(".appointment").filter({ hasText: "14:00" });
    await confirmed.getByRole("button", { name: "Desfazer confirmação" }).click();
    await page.getByRole("dialog", { name: "Operação bloqueada" }).getByRole("button", { name: "Voltar" }).click();
    await go("Profissionais");
    await page.getByRole("combobox", { name: "Profissional" }).selectOption("pr2");
    await page.locator(".clinical-row").filter({ hasText: "18:00" }).click();
    await page.getByRole("heading", { name: "Histórico clínico do atendimento, somente leitura" }).waitFor();
    await page.getByText("Evolução fictícia invalidada para consulta histórica.").waitFor();
    await go("Financeiro");
    await page.getByText("Produção gerada filtrada").waitFor();
    await page.getByRole("combobox", { name: "Conta" }).selectOption("payable");
    await page.getByText("Repassado", { exact: true }).waitFor();
    await go("Gestão");
    await page.getByRole("heading", { name: "Produção por profissional" }).waitFor();
    await page.getByRole("combobox", { name: "Filtrar profissional gestão" }).selectOption("pr1");
    assert.ok((await page.getByText("Confirmados", { exact: true }).first().locator("..").innerText()).includes("1"));
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 2, `${viewport.name} overflow`);
    assert.deepEqual(errors, [], `${viewport.name} browser errors`);
    console.log(`PASS ${viewport.name}: bloqueio, histórico invalidado, contas, gestão e largura`);
    await context.close();
  }
} finally {
  await browser.close();
}
