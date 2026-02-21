import { useState } from "react";
import VOCAB from "./data/vocab.js";
import { GENITIVE_EXERCISES, IMPERATIVE_EXERCISES, CAN_EXERCISES } from "./data/exercises.js";
import VocabTrainer from "./components/VocabTrainer.jsx";
import GrammarTrainer from "./components/GrammarTrainer.jsx";
import WritingTrainer from "./components/WritingTrainer.jsx";

// ── Grammar module configurations ──

const genitiveConfig = {
  color: "#eab308",
  title: "Genitiv ('s)",
  icon: "📝",
  placeholder: "z.B. Tom's book",
  getPrompt: (ex) => ex.prompt,
  getLabel: () => "Genitiv ('s) – Bilde den Besitz",
  getHint: (ex) => ex.hint,
  ruleBox: (
    <div style={{ marginTop: 20, padding: "16px 20px", background: "rgba(234,179,8,0.06)", borderRadius: 12, border: "1px solid rgba(234,179,8,0.15)" }}>
      <div style={{ fontSize: 13, color: "#eab308", marginBottom: 6 }}>📖 Regel:</div>
      <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
        <strong style={{ color: "#e2e8f0" }}>Singular:</strong> Tom<strong style={{ color: "#eab308" }}>'s</strong> book (Toms Buch)<br />
        <strong style={{ color: "#e2e8f0" }}>Plural auf -s:</strong> the pupil<strong style={{ color: "#eab308" }}>s'</strong> classroom<br />
        <strong style={{ color: "#e2e8f0" }}>Unregelmäßiger Plural:</strong> the children<strong style={{ color: "#eab308" }}>'s</strong> lunchbox
      </div>
    </div>
  ),
};

const imperativeConfig = {
  color: "#10b981",
  title: "Imperativ",
  icon: "📣",
  placeholder: "z.B. Open your book!",
  getPrompt: (ex) => ex.situation,
  getLabel: () => "Imperativ – Gib eine Anweisung!",
  getHint: (ex) => `Beginne mit: ${ex.answer.split(" ")[0]}...`,
  ruleBox: (
    <div style={{ marginTop: 20, padding: "16px 20px", background: "rgba(16,185,129,0.06)", borderRadius: 12, border: "1px solid rgba(16,185,129,0.15)" }}>
      <div style={{ fontSize: 13, color: "#10b981", marginBottom: 6 }}>📖 Regel:</div>
      <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
        <strong style={{ color: "#e2e8f0" }}>Positiv:</strong> Verb am Anfang → <strong style={{ color: "#10b981" }}>Open</strong> your book!<br />
        <strong style={{ color: "#e2e8f0" }}>Negativ:</strong> Don't + Verb → <strong style={{ color: "#10b981" }}>Don't talk</strong> in class!
      </div>
    </div>
  ),
};

const canConfig = {
  color: "#f97316",
  title: "Can / Can't",
  icon: "💪",
  placeholder: "Deine Antwort...",
  getPrompt: (ex) => {
    if (ex.type === "translate") return ex.de;
    if (ex.type === "negative") return `Mache den Satz negativ: "${ex.sentence}"`;
    if (ex.type === "question") return `Mache eine Frage: "${ex.sentence}"`;
    return "";
  },
  getLabel: (ex) => {
    if (ex.type === "translate") return "Can / Can't – Übersetze";
    if (ex.type === "negative") return "Can / Can't – Verneine den Satz";
    if (ex.type === "question") return "Can / Can't – Bilde eine Frage";
    return "Can / Can't";
  },
  getHint: (ex) => ex.hint,
  ruleBox: (
    <div style={{ marginTop: 20, padding: "16px 20px", background: "rgba(249,115,22,0.06)", borderRadius: 12, border: "1px solid rgba(249,115,22,0.15)" }}>
      <div style={{ fontSize: 13, color: "#f97316", marginBottom: 6 }}>📖 Regel:</div>
      <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
        <strong style={{ color: "#e2e8f0" }}>Positiv:</strong> I/you/he/she/it/we/they <strong style={{ color: "#f97316" }}>can</strong> swim.<br />
        <strong style={{ color: "#e2e8f0" }}>Negativ:</strong> I <strong style={{ color: "#f97316" }}>can't</strong> swim. (= cannot)<br />
        <strong style={{ color: "#e2e8f0" }}>Frage:</strong> <strong style={{ color: "#f97316" }}>Can</strong> you swim? → "can" wandert nach vorne!
      </div>
    </div>
  ),
};

// ── Module menu definitions ──

const modules = [
  { id: "vocab", icon: "📚", title: "Vokabeln", desc: "Zufällige Abfrage DE ↔ EN", color: "#6366f1", count: `${VOCAB.length} Wörter` },
  { id: "genitive", icon: "📝", title: "Genitiv ('s)", desc: "Tom's book, the pupils' room", color: "#eab308", count: `${GENITIVE_EXERCISES.length} Übungen` },
  { id: "imperative", icon: "📣", title: "Imperativ", desc: "Open! Don't talk!", color: "#10b981", count: `${IMPERATIVE_EXERCISES.length} Übungen` },
  { id: "can", icon: "💪", title: "Can / Can't", desc: "I can swim. Can you help?", color: "#f97316", count: `${CAN_EXERCISES.length} Übungen` },
  { id: "writing", icon: "✍️", title: "My School", desc: "Schreibe 15 Sätze mit KI-Korrektur", color: "#22d3ee", count: "KI-Feedback" },
];

export default function App() {
  const [view, setView] = useState("menu");

  const goBack = () => setView("menu");

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #0c1220 0%, #111827 50%, #0c1220 100%)",
      padding: "20px",
    }}>
      <div style={{ maxWidth: 600, margin: "0 auto", position: "relative" }}>

        {/* Header */}
        <div style={{ textAlign: "center", paddingTop: 20, marginBottom: view === "menu" ? 32 : 16 }}>
          {view !== "menu" && (
            <button onClick={goBack} style={{
              position: "absolute", left: 0, top: 24,
              background: "none", border: "1px solid #334155", borderRadius: 10,
              color: "#94a3b8", padding: "8px 14px", fontSize: 13,
              cursor: "pointer",
            }}>← Menü</button>
          )}
          <div style={{ fontSize: 14, letterSpacing: 3, color: "#6366f1", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
            Klassenarbeit Trainer
          </div>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: view === "menu" ? 36 : 24,
            fontWeight: 700,
            color: "#f1f5f9",
            margin: 0,
            letterSpacing: -0.5,
            transition: "font-size 0.3s",
          }}>
            English 5b 🇬🇧
          </h1>
          {view === "menu" && (
            <p style={{ color: "#64748b", fontSize: 15, marginTop: 8 }}>
              Bertha-von-Suttner · Klasse 5b · Camden Town
            </p>
          )}
        </div>

        {/* Menu */}
        {view === "menu" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn 0.4s ease" }}>
            {modules.map((m) => (
              <button key={m.id} onClick={() => setView(m.id)} style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "20px 24px",
                background: "linear-gradient(135deg, #1e293b, #0f172a)",
                border: `1px solid ${m.color}22`,
                borderRadius: 16,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: `${m.color}15`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, flexShrink: 0,
                }}>{m.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 600, color: "#f1f5f9" }}>{m.title}</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{m.desc}</div>
                </div>
                <div style={{
                  fontSize: 11, color: m.color, padding: "4px 10px",
                  background: `${m.color}15`, borderRadius: 20,
                  fontWeight: 600, whiteSpace: "nowrap",
                }}>{m.count}</div>
              </button>
            ))}
          </div>
        )}

        {/* Module views */}
        <div style={{ animation: "fadeIn 0.4s ease" }}>
          {view === "vocab" && <VocabTrainer onBack={goBack} />}
          {view === "genitive" && <GrammarTrainer onBack={goBack} exercises={GENITIVE_EXERCISES} config={genitiveConfig} />}
          {view === "imperative" && <GrammarTrainer onBack={goBack} exercises={IMPERATIVE_EXERCISES} config={imperativeConfig} />}
          {view === "can" && <GrammarTrainer onBack={goBack} exercises={CAN_EXERCISES} config={canConfig} />}
          {view === "writing" && <WritingTrainer onBack={goBack} />}
        </div>
      </div>
    </div>
  );
}
