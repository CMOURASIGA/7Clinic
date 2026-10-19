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
    try {
      await page.goto(base);
      await page.getByRole("heading", { name: "Agenda e atendimento" }).waitFor();
      await page.getByRole("button", { name: "Abrir Central de Atendimento" }).click();
      await page.getByRole("heading", { name: "Central de Atendimento" }).waitFor();
      const list = page.getByRole("region", { name: "Lista de conversas" });
      const chat = page.getByRole("region", { name: /Conversa ativa/ });
      const operation = page.getByRole("region", { name: /Operação contextual/ });
      if (size.name === "desktop") {
        assert.equal(await list.isVisible(), true);
        assert.equal(await chat.isVisible(), true);
        assert.equal(await operation.isVisible(), true);
      }
      const listButton = page.getByRole("button", { name: "Conversas", exact: true });
      async function showList() { if (size.width <= 1050 && !await list.isVisible()) { if (await operation.isVisible()) await operation.getByRole("button", { name: "Voltar à conversa" }).click(); await listButton.click(); } }
      async function showChat() { if (size.width <= 1050 && await operation.isVisible()) await operation.getByRole("button", { name: "Voltar à conversa" }).click(); }
      async function select(id) { await showList(); await list.locator(".central-conversation").filter({ hasText: id }).click(); }
      await showList();
      assert.equal(await list.locator(".central-conversation").count(), 4);
      await list.getByRole("textbox", { name: "Buscar conversas" }).fill("Paciente Exemplo A");
      assert.equal(await list.locator(".central-conversation").count(), 1);
      await list.getByRole("textbox", { name: "Buscar conversas" }).fill("");
      await list.getByRole("combobox", { name: "Filtrar conversas" }).selectOption("AGUARDANDO_PACIENTE");
      assert.equal(await list.locator(".central-conversation").count(), 1);
      await list.getByRole("combobox", { name: "Filtrar conversas" }).selectOption("all");
      await select("c1");
      await chat.getByRole("textbox", { name: "Rascunho da conversa" }).fill("Rascunho reservado à conversa A");
      if (size.width <= 1050) await chat.getByRole("button", { name: "Cadastro e agenda" }).click();
      await operation.getByRole("textbox", { name: "Contato fictício" }).fill("CONTATO-CORRIGIDO-A");
      await operation.getByRole("button", { name: "Agenda contextual" }).click();
      const options = operation.locator(".central-slot:not([disabled])");
      assert.ok(await options.count() > 0);
      await options.first().click();
      const chosen = await operation.locator(".central-choice strong").innerText();
      assert.equal(await operation.getByRole("checkbox", { name: "Paciente escolheu esta opção" }).isChecked(), false);
      await select("c2");
      assert.equal(await chat.getByRole("textbox", { name: "Rascunho da conversa" }).inputValue(), "");
      await select("c3");
      await select("c1");
      await showChat();
      assert.equal(await chat.getByRole("textbox", { name: "Rascunho da conversa" }).inputValue(), "Rascunho reservado à conversa A");
      if (size.width <= 1050) await chat.getByRole("button", { name: "Cadastro e agenda" }).click();
      assert.equal(await operation.locator(".central-choice strong").innerText(), chosen);
      await operation.getByRole("button", { name: "Cadastro e documentos" }).click();
      assert.equal(await operation.getByRole("textbox", { name: "Contato fictício" }).inputValue(), "CONTATO-CORRIGIDO-A");
      await operation.getByRole("button", { name: "Carteirinha fictícia A" }).click();
      await page.getByRole("dialog", { name: "Anexo Carteirinha fictícia A" }).getByText("DOCUMENTO SINTÉTICO").waitFor();
      await page.getByRole("button", { name: "Fechar anexo" }).click();
      await page.screenshot({ path: `artifacts/visual/central-${size.name}-contexto.png`, fullPage: true });
      await page.reload();
      await page.getByRole("button", { name: "Abrir Central de Atendimento" }).click();
      await showChat();
      assert.equal(await chat.getByRole("textbox", { name: "Rascunho da conversa" }).inputValue(), "Rascunho reservado à conversa A");
      if (size.width <= 1050) await chat.getByRole("button", { name: "Cadastro e agenda" }).click();
      assert.equal(await operation.getByRole("textbox", { name: "Contato fictício" }).inputValue(), "CONTATO-CORRIGIDO-A");
      await select("c3");
      if (size.width <= 1050) await chat.getByRole("button", { name: "Cadastro e agenda" }).click();
      await operation.getByRole("button", { name: "Agenda contextual" }).click();
      await operation.locator(".central-slot:not([disabled])").first().click();
      await operation.getByRole("checkbox", { name: "Paciente escolheu esta opção" }).check();
      await operation.getByRole("button", { name: "Criar pré-agendamento" }).click();
      const contextBanner = operation.locator(".context-banner");
      await contextBanner.getByText("Pré-agendado", { exact: false }).waitFor();
      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("7clinic:spec00:demo:v1")));
      const id = stored.central.conversations.find((c) => c.id === "c3").appointmentId;
      assert.ok(id);
      assert.equal(stored.appointments.find((a) => a.id === id).status, "prebooked");
      assert.equal(stored.financial.some((entry) => entry.appointmentId === id), false);
      await page.screenshot({ path: `artifacts/visual/central-${size.name}-reserva.png`, fullPage: true });
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 2, `${size.name}: rolagem horizontal`);
      assert.deepEqual(errors, []);
      console.log(`PASS SPEC 00.1 V3 ${size.name}: HV-14 a HV-20, contexto, persistência e pré-agendamento sem produção`);
    } finally {
      await context.tracing.stop({ path: `artifacts/visual/central-${size.name}-trace.zip` });
      await context.close();
    }
  }
} finally { await browser.close(); }
