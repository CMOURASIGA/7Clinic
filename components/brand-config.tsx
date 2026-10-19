"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import { DEFAULT_BRAND, suggestBrandColors, type DemoBrand } from "../lib/branding";

export function BrandConfig({ brand, onSave, onRestore }: { brand: DemoBrand; onSave: (brand: DemoBrand) => void; onRestore: () => void }) {
  const [draft, setDraft] = useState(brand);
  const [fileName, setFileName] = useState("");
  const [feedback, setFeedback] = useState("");

  function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 1_000_000) {
      setFeedback("Use PNG, JPEG ou WebP de até 1 MB."); return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const logo = reader.result;
      setDraft((current) => ({ ...current, logo }));
      setFileName(file.name);
      setFeedback("Cores sugeridas pela imagem. Confira e salve para aplicar.");
      const image = new window.Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 48;
        const context = canvas.getContext("2d");
        if (!context) return;
        context.drawImage(image, 0, 0, 48, 48);
        const colors = suggestBrandColors(context.getImageData(0, 0, 48, 48).data);
        setDraft((current) => current.logo === logo ? { ...current, primary: colors.primary ?? current.primary, highlight: colors.highlight ?? current.highlight } : current);
      };
      image.src = logo;
    };
    reader.readAsDataURL(file);
  }

  return <section className="surface"><h2>Identidade visual do cliente</h2>
    <p className="muted">Padrão Consult Services. A Clínica Movimentar-se é a organização demonstrativa. A imagem sugere cores que podem ser ajustadas antes de salvar. A configuração vale somente neste navegador.</p>
    <div className="brand-preview"><Image src={draft.logo || DEFAULT_BRAND.logo} alt="Prévia da marca" width={100} height={65} unoptimized onError={(event) => { event.currentTarget.src = DEFAULT_BRAND.logo; }}/><span>{draft.name || "7Clinic"}</span></div>
    <div className="form-grid">
      <label>Nome da marca<input aria-label="Nome da marca" value={draft.name} maxLength={60} onChange={(event) => setDraft({ ...draft, name: event.target.value })}/></label>
      <label>Logo local<input aria-label="Logo local" type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadLogo}/>{fileName ? <small>{fileName}</small> : null}</label>
      <label>Cor principal<input aria-label="Cor principal" type="color" value={draft.primary} onChange={(event) => setDraft({ ...draft, primary: event.target.value })}/></label>
      <label>Cor de destaque<input aria-label="Cor de destaque" type="color" value={draft.highlight} onChange={(event) => setDraft({ ...draft, highlight: event.target.value })}/></label>
    </div>
    <div className="button-line"><button className="button button-primary" onClick={() => { onSave({ ...draft, name: draft.name.trim() || DEFAULT_BRAND.name }); setFeedback("Identidade aplicada e salva neste navegador."); }}>Salvar identidade</button><button className="button button-light" onClick={() => { onRestore(); setDraft(DEFAULT_BRAND); setFileName(""); setFeedback("Identidade Consult Services restaurada."); }}>Restaurar Consult Services</button></div>
    {feedback ? <p className="muted" role="status">{feedback}</p> : null}
  </section>;
}
