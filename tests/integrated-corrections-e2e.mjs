import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://localhost:3000";
await mkdir("artifacts/visual", { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined, args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.tracing.start({ screenshots: true, snapshots: true });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const nav = page.getByRole("navigation", { name: "Ambientes" });
const go = (name) => nav.getByRole("button", { name, exact: true }).click();
const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem("7clinic:spec00:demo:v1")));
try {
  await page.goto(base);
  await page.getByRole("heading", { name: "Agenda e atendimento" }).waitFor();
  const initialAlerts = await page.locator(".notification").getAttribute("aria-label");
  await page.getByRole("button", { name: "Abrir Central de Atendimento" }).click();
  await page.getByRole("textbox", { name: "Rascunho da conversa" }).fill("Rascunho sintético da validação integrada");
  await go("Recepção");

  await page.getByRole("button", { name: "+ Paciente" }).click();
  const patientForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Cadastrar" }) });
  await patientForm.getByLabel("Nome fictício").fill("Paciente Validação Integrada");
  await patientForm.getByLabel("Convênio fictício").fill("Convênio Sintético");
  await patientForm.getByLabel("Carteira fictícia").fill("DEMO-INT-03");
  await patientForm.getByRole("button", { name: "Cadastrar" }).click();
  const patient = (await stored()).patients.find((item) => item.name === "Paciente Validação Integrada");
  assert.ok(patient);

  async function schedule(time) {
    await page.getByRole("button", { name: "+ Agendar" }).click();
    const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Criar agendamento" }) });
    await form.getByLabel("Paciente").selectOption(patient.id);
    await form.getByLabel("Data").fill("2026-10-17");
    await form.getByLabel("Horário").fill(time);
    await form.getByRole("button", { name: "Criar agendamento" }).click();
    return page.locator(".appointment").filter({ hasText: "Paciente Validação Integrada" }).filter({ hasText: time });
  }
  const temporary = await schedule("11:30");
  await temporary.getByRole("button", { name: "Excluir agendamento" }).click();
  await page.getByRole("dialog", { name: "Excluir agendamento" }).getByRole("button", { name: "Manter agendamento" }).click();
  assert.equal(await temporary.count(), 1);
  await temporary.getByRole("button", { name: "Excluir agendamento" }).click();
  await page.getByRole("dialog", { name: "Excluir agendamento" }).getByRole("button", { name: "Sim, excluir agendamento" }).click();
  assert.equal(await temporary.count(), 0);

  const original = await schedule("09:30");
  await original.getByRole("button", { name: "Editar" }).click();
  const edit = original.locator("form");
  await edit.getByLabel("Horário").fill("10:30");
  await edit.getByLabel("Motivo").fill("Correção sintética da agenda integrada");
  await edit.getByRole("button", { name: "Salvar alteração" }).click();
  const row = page.locator(".appointment").filter({ hasText: "Paciente Validação Integrada" }).filter({ hasText: "10:30" });
  assert.equal(await row.count(), 1);
  assert.equal(await row.getByRole("button", { name: "Excluir agendamento" }).count(), 0);
  const before = await stored();
  await row.getByRole("button", { name: "Confirmar" }).click();
  const after = await stored();
  const confirmed = after.appointments.find((item) => item.patientId === patient.id);
  assert.equal(after.financial.length, before.financial.length + 1);
  assert.equal(after.financial.filter((item) => item.appointmentId === confirmed.id).length, 1);
  await page.screenshot({ path: "artifacts/visual/integrated-reception-desktop.png", fullPage: true });

  await page.locator(".notification").click();
  const clinicalAlert = page.locator(".notice-panel button").filter({ hasText: confirmed.id });
  assert.match(await clinicalAlert.innerText(), /Prontuário pendente/);
  await clinicalAlert.click();
  await page.getByRole("heading", { name: "Minha agenda" }).waitFor();
  await go("Profissionais");
  await page.getByRole("heading", { name: "Minha agenda" }).waitFor();
  assert.match(await page.locator(".clinical-row").filter({ hasText: patient.name }).innerText(), /10:30/);
  await go("Financeiro");
  const cards = page.locator(".stat-action");
  const values = await cards.locator("strong").allInnerTexts();
  assert.equal(values[0], "R$ 600,00");
  const entry = page.locator(".ledger-item").filter({ hasText: patient.name });
  await entry.getByRole("button", { name: "Marcar recebido" }).click();
  assert.equal(await cards.nth(2).locator("strong").innerText(), "R$ 360,00");
  await entry.getByRole("button", { name: "Marcar pago" }).click();
  assert.equal(await cards.nth(4).locator("strong").innerText(), "R$ 36,00");
  await page.screenshot({ path: "artifacts/visual/integrated-finance-desktop.png", fullPage: true });

  await go("Gestão");
  await page.getByRole("combobox", { name: "Auditoria operação" }).selectOption("SETTLE");
  const history = page.locator("section.surface").filter({ has: page.getByRole("heading", { name: "Histórico de operações" }) });
  const auditList = history.locator(".audit-list");
  await auditList.getByText("Recebimento conciliado", { exact: false }).waitFor();
  await auditList.getByText("Repasse conciliado", { exact: false }).waitFor();
  assert.match(await auditList.innerText(), /Paciente Validação Integrada/);
  assert.doesNotMatch(await auditList.innerText(), /payoutPaid|revenueReceived|fin:[\w-]+|R\$\s*\d+\.\d{2}/);
  await page.getByRole("combobox", { name: "Auditoria usuário" }).selectOption("Financeiro demonstrativo");
  assert.ok(await auditList.locator(":scope > div").count() >= 2);
  await page.getByRole("combobox", { name: "Auditoria usuário" }).selectOption("");
  await page.getByRole("spinbutton", { name: "Repasse por consulta (R$)" }).fill("20");
  await page.getByRole("button", { name: "Atualizar regra" }).click();
  await page.getByRole("combobox", { name: "Auditoria operação" }).selectOption("PAYOUT_RULE");
  await auditList.getByText("R$ 20,00", { exact: false }).waitFor();
  await page.screenshot({ path: "artifacts/visual/integrated-history-desktop.png", fullPage: true });

  await page.reload();
  await page.getByRole("heading", { name: "Agenda e atendimento" }).waitFor();
  assert.equal((await stored()).central.conversations.find((item) => item.id === "c1").draft, "Rascunho sintético da validação integrada");
  assert.ok((await stored()).patients.some((item) => item.id === patient.id));
  await page.getByRole("button", { name: /Reiniciar cenário fictício/ }).click();
  await page.getByRole("dialog", { name: "Reiniciar cenário fictício" }).getByRole("button", { name: "Manter dados" }).click();
  assert.ok((await stored()).patients.some((item) => item.id === patient.id));
  await page.getByRole("button", { name: /Reiniciar cenário fictício/ }).click();
  await page.getByRole("dialog", { name: "Reiniciar cenário fictício" }).getByRole("button", { name: "Sim, reiniciar cenário" }).click();
  assert.equal((await stored()).patients.some((item) => item.id === patient.id), false);
  await page.getByRole("button", { name: "Abrir Central de Atendimento" }).click();
  assert.equal(await page.getByRole("textbox", { name: "Rascunho da conversa" }).inputValue(), "");
  assert.equal(await page.locator(".notification").getAttribute("aria-label"), initialAlerts);
  assert.deepEqual(errors, []);
  console.log("PASS integrated corrections desktop: Central, cadastro, edição, exclusão, confirmação, prontuário, conciliações, auditoria, persistência e reset");
} finally {
  await context.tracing.stop({ path: "artifacts/visual/integrated-corrections-desktop-trace.zip" });
  await context.close();
  await browser.close();
}
