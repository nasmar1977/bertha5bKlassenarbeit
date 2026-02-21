import { useState, useEffect, useCallback, useRef } from "react";
import VOCAB from "../data/vocab.js";
import { shuffle, checkVocabAnswer } from "../utils/matching.js";
import { ProgressBar, Feedback, inputStyle, btnStyle } from "./ui.jsx";

export default function VocabTrainer({ onBack }) {
  const [cards, setCards] = useState([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [done, setDone] = useState(false);
  const [wrongOnes, setWrongOnes] = useState([]);
  const [round, setRound] = useState(1);
  const inputRef = useRef(null);

  const initCards = useCallback((pool = null) => {
    const source = pool || VOCAB;
    const selected = shuffle(source).slice(0, Math.min(15, source.length));
    const withDir = selected.map((v) => ({
      ...v,
      direction: Math.random() > 0.5 ? "de2en" : "en2de",
    }));
    setCards(withDir);
    setIdx(0);
    setInput("");
    setFeedback(null);
    setCorrect(0);
    setShowHint(false);
    setDone(false);
    setWrongOnes([]);
  }, []);

  useEffect(() => { initCards(); }, [initCards]);
  useEffect(() => { if (inputRef.current && !done) inputRef.current.focus(); }, [idx, feedback, done]);

  const card = cards[idx];

  const handleSubmit = () => {
    if (!input.trim() || feedback) return;
    const isCorrect = checkVocabAnswer(input, card);
    const dir = card.direction;
    let displayAnswer = dir === "de2en" ? card.en : card.de;
    const alts = dir === "de2en" ? (card.altEn || []) : (card.altDe || []);
    if (alts.length > 0) displayAnswer += ` (auch: ${alts.join(", ")})`;
    setFeedback({ correct: isCorrect, answer: displayAnswer });
    if (isCorrect) setCorrect((c) => c + 1);
    else setWrongOnes((w) => [...w, card]);
    setTimeout(() => {
      if (idx + 1 >= cards.length) setDone(true);
      else { setIdx((i) => i + 1); setInput(""); setFeedback(null); setShowHint(false); }
    }, 1800);
  };

  const handleRetryWrong = () => { setRound((r) => r + 1); initCards(wrongOnes); };

  if (!card && !done) return null;

  if (done) {
    const pct = Math.round((correct / cards.length) * 100);
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{pct >= 80 ? "🎉" : pct >= 50 ? "💪" : "📚"}</div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#e2e8f0", fontSize: 28, margin: "0 0 8px" }}>
          {round > 1 ? `Wiederholung ${round - 1} fertig!` : "Runde fertig!"}
        </h2>
        <p style={{ color: "#94a3b8", fontSize: 18 }}>{correct} von {cards.length} richtig ({pct}%)</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
          {wrongOnes.length > 0 && <button onClick={handleRetryWrong} style={btnStyle("#6366f1")}>🔄 Falsche wiederholen ({wrongOnes.length})</button>}
          <button onClick={() => { setRound(1); initCards(); }} style={btnStyle("#22d3ee")}>🆕 Neue Runde</button>
          <button onClick={onBack} style={btnStyle("#475569")}>← Zurück</button>
        </div>
      </div>
    );
  }

  const question = card.direction === "de2en" ? card.de : card.en;
  const direction = card.direction === "de2en" ? "🇩🇪 → 🇬🇧" : "🇬🇧 → 🇩🇪";
  const primaryAnswer = card.direction === "de2en" ? card.en : card.de;
  const hintText = primaryAnswer;

  return (
    <div>
      <ProgressBar current={idx} total={cards.length} correct={correct} />
      <div style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", borderRadius: 20, padding: "32px 28px", border: "1px solid rgba(99,102,241,0.2)", marginTop: 16 }}>
        <div style={{ fontSize: 12, color: "#6366f1", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>{direction} Übersetze</div>
        <div style={{ fontSize: 28, fontFamily: "'Space Grotesk', sans-serif", color: "#f1f5f9", marginBottom: 24, lineHeight: 1.3 }}>{question}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} placeholder="Deine Antwort..." disabled={!!feedback} style={inputStyle} />
          <button onClick={handleSubmit} disabled={!!feedback || !input.trim()} style={{ ...btnStyle("#6366f1"), opacity: feedback || !input.trim() ? 0.5 : 1, minWidth: 80 }}>✓</button>
        </div>
        {!feedback && (
          <button onClick={() => setShowHint(true)} style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 13, marginTop: 12, padding: 0 }}>
            {showHint ? `💡 ${hintText.slice(0, 3)}...` : "💡 Tipp anzeigen"}
          </button>
        )}
        <Feedback show={!!feedback} correct={feedback?.correct} correctAnswer={feedback?.answer} />
      </div>
    </div>
  );
}
