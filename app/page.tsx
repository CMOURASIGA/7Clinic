"use client";

import { useMemo, useState } from "react";

type Area = "recepcao" | "profissional" | "gestao";

const areas: { id: Area; label: string; icon: string }[] = [
  { id: "recepcao", label: "Recepção", icon: "◫" },
  { id: "profissional", label: "Profissional", icon: "♙" },
  { id: "gestao", label: "Gestão", icon: "◉" }
];

const content: Record<Area, { title: string; text: string; cards: [string,string,string][]; agenda: [string,string,string,string][]; pendencias: [string,string][] }> = {
  recepcao: {
    title: "Painel da Recepção",
    text: "Acompanhe a agenda, confirmações e pendências das duas unidades.",
    cards: [["Agenda de hoje","18","3 aguardando confirmação"],["Confirmados","12","+ 2 desde ontem"],["Pendências","4","2 exigem ação"],["Transferências","1","Sem duplicidade"]],
    agenda: [["08:00","Maria Oliveira","Fisioterapia · Unidade I","Confirmado"],["09:00","Rafael Santos","Pilates · Unidade I","A confirmar"],["10:00","Ana Beatriz","Fisioterapia · Unidade II","Confirmado"],["11:00","Carlos Mendes","Ortopedia · Unidade I","A confirmar"]],
    pendencias: [["Confirmações pendentes","2 atendimentos aguardam contato"],["Transferência para Unidade II","Paciente Rafael Santos, hoje às 09:00"],["Bloqueio de agenda","1 regra ativa para confirmação pendente"]]
  },
  profissional: {
    title: "Agenda da Profissional",
    text: "Visão individual de atendimentos liberados para evolução clínica.",
    cards: [["Atendimentos hoje","7","5 confirmados"],["Prontuários pendentes","2","Ação necessária"],["Evoluções concluídas","5","Hoje"],["Minha produção","R$ 126","7 consultas confirmadas"]],
    agenda: [["08:00","Maria Oliveira","Evolução disponível","Confirmado"],["09:30","Bruno Lima","Aguardando confirmação","A confirmar"],["10:30","Ana Beatriz","Evolução disponível","Confirmado"],["14:00","Fernanda Souza","Prontuário pendente","Confirmado"]],
    pendencias: [["Prontuário pendente","Maria Oliveira · atendimento de 15/10"],["Evolução a concluir","Fernanda Souza · atendimento de hoje"],["Acesso clínico","Somente pacientes vinculados à sua agenda"]]
  },
  gestao: {
    title: "Painel de Gestão",
    text: "Indicadores operacionais e financeiros consolidados da clínica.",
    cards: [["Atendimentos","36","18 por unidade"],["Receita prevista","R$ 5.760","Convênios no período"],["Repasses","R$ 648","R$ 18 por consulta"],["Pendências","6","3 clínicas, 3 operacionais"]],
    agenda: [["08:00","Unidade I","9 atendimentos confirmados","Em operação"],["09:00","Unidade II","7 atendimentos confirmados","Em operação"],["10:00","Financeiro","36 lançamentos de produção","Conferir"],["14:00","Pendências","3 prontuários sem evolução","Acompanhar"]],
    pendencias: [["Regra de bloqueio","Confirmação pendente ativa"],["Liberação excepcional","1 solicitação aguardando justificativa"],["Contas a receber","2 guias previstas para conciliação"]]
  }
};

export default function Home() {
  const [area, setArea] = useState<Area>("recepcao");
  const [unit, setUnit] = useState("Visão consolidada");
  const view = useMemo(() => content[area], [area]);

  return <main className="app">
    <aside className="side">
      <div className="brand"><div className="mark">7</div><div><b>7Clinic</b><small>Clínica Movimentar-se</small></div></div>
      <div className="role">Modo demonstrativo · dados sintéticos</div>
      <nav className="nav">
        {areas.map(item => <button key={item.id} onClick={() => setArea(item.id)} className={area === item.id ? "active" : ""}>{item.icon} &nbsp;{item.label}</button>)}
        <button>▦ &nbsp;Pacientes</button><button>◷ &nbsp;Pendências</button><button>⚙ &nbsp;Configurações</button>
      </nav>
      <div className="calendar"><h3>OUTUBRO 2026</h3><div className="week">{["D","S","T","Q","Q","S","S"].map((d,i)=><span key={i}>{d}</span>)}{Array.from({length:31},(_,i)=><span key={i} className={"day "+(i===15?"today":"")}>{i+1}</span>)}</div></div>
    </aside>
    <section className="main">
      <header className="top"><div className="crumb">7Clinic / {areas.find(a=>a.id===area)?.label} / Visão geral</div><div className="user"><span className="bell">♧<i className="badge">3</i></span><span className="avatar">CM</span><span>Christian Moura<br/><small>Administrador</small></span></div></header>
      <div className="content">
        <div className="heading"><div><h1>{view.title}</h1><p>{view.text}</p></div><select className="select" value={unit} onChange={e=>setUnit(e.target.value)}><option>Visão consolidada</option><option>Unidade I</option><option>Unidade II</option></select></div>
        <div className="cards">{view.cards.map(([label,value,trend])=><div className="card" key={label}><div className="label">{label}</div><div className="metric">{value}</div><div className="trend">{trend}</div></div>)}</div>
        <div className="grid"><div className="panel"><div className="panel-head"><h2>Agenda de hoje · 16 de outubro</h2><button className="link">Ver agenda completa</button></div><div className="rows">{view.agenda.map(([time,name,desc,status])=><div className="row" key={time+name}><div className="time">{time}</div><div><b>{name}</b><span className="sub">{desc}</span></div><div className="mini">{unit}</div><span className={"pill "+(status==="A confirmar"||status==="Acompanhar"?"warn":"")}>{status}</span></div>)}</div></div>
        <div className="panel"><div className="panel-head"><h2>Pendências</h2><button className="link">Central</button></div><div className="pending">{view.pendencias.map(([title,desc])=><div className="pending-item" key={title}><strong>{title}</strong><span className="mini">{desc}</span></div>)}<button className="maia"><small>MAIA · MODO DEMONSTRATIVO</small><strong>Posso resumir as pendências?</strong><span>Respostas simuladas, sem IA externa.</span></button></div></div></div>
      </div>
    </section>
  </main>;
}