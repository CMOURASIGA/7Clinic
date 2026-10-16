import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined, args: ["--no-sandbox"] });
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.getByRole("heading", { name: "Agenda e atendimento" }).waitFor();
    const nav = page.getByRole("navigation", { name: "Ambientes" });
    const mobileMenu = viewport.width <= 730;
    async function go(name) {
      if (mobileMenu) await page.getByRole("button", { name: "Abrir menu" }).click();
      await nav.getByRole("button", { name, exact: true }).click();
    }
    if (mobileMenu) {
      await page.getByRole("button", { name: "Abrir menu" }).click();
      assert.equal(await page.getByLabel("Data da agenda no menu").isVisible(), true);
      await nav.getByRole("button", { name: "Recepção" }).click();
    }
    const before = await page.locator(".appointment").count();
    assert.ok(before >= 9, `${viewport.name}: massa incompleta`);
    const a1 = page.locator(".appointment").filter({ hasText: "08:00" });
    await a1.getByRole("button", { name: "Confirmar" }).click();
    await page.getByText("Ação registrada na demonstração.").waitFor();
    await go("Financeiro");
    assert.ok((await page.getByText("Receita prevista filtrada").locator("..").innerText()).includes("480,00"));
    await page.getByRole("combobox", { name: "Convênio" }).selectOption({ label: "Convênio Fictício Azul" });
    assert.ok((await page.getByText("Receita prevista filtrada").locator("..").innerText()).includes("240,00"));
    await go("Profissionais");
    const clinical = page.locator(".clinical-row").filter({ hasText: "08:00" });
    await clinical.click();
    await page.getByRole("textbox", { name: "Evolução fictícia" }).fill("Evolução totalmente fictícia para teste responsivo.");
    await page.getByRole("button", { name: "Salvar rascunho" }).click();
    await page.getByRole("button", { name: "Finalizar", exact: true }).click();
    await page.getByRole("heading", { name: "Evolução finalizada" }).waitFor();
    await page.reload();
    await page.getByRole("heading", { name: "Agenda e atendimento" }).waitFor();
    await go("Financeiro");
    assert.ok((await page.getByText("Receita prevista filtrada").locator("..").innerText()).includes("480,00"));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 2, `${viewport.name}: overflow horizontal ${overflow}px`);
    assert.deepEqual(errors, [], `${viewport.name}: erro no browser`);
    console.log(`PASS ${viewport.name}: confirmação, filtros, prontuário, persistência e largura ${viewport.width}px`);
    await context.close();
  }
} finally {
  await browser.close();
}
