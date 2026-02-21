import { useState, useEffect, useRef } from "react";
import { shuffle, checkAnswer } from "../utils/matching.js";
import { ProgressBar, Feedback, inputStyle, btnStyle } from "./ui.jsx";

/**
 * Generic grammar trainer used for Genitive, Imperative, and Can/Can't.
 * Configured via props.
 */
export default function GrammarTrainer({ onBack, exercises: rawExercises, config }) {
  const { color, title, icon, getPrompt, getLabel, placeholder, ruleBox, getHint } = config;
  const [exercises, setExercises] = useState([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef(null);

  const reset = () => {
    setExercises(shuffle(rawExercises));
    setIdx(0);
    setCorrect(0);
    setDone(false);
    setInput("");
    setFeedback(null);
    setShowHint(false);
  };

  useEffect(() => { reset(); }, []); // eslint-disable-line
  useEffect(() => { if (inputRef.current && !done) inputRef.current.focus(); }, [idx, feedback, done]);

  const ex = exercises[idx];

  const handleSubmit = () => {
    if (!input.trim() || feedback) return;
    const isCorrect = checkAnswer(input, ex.answer, ex.alt || []);
    setFeedback({ correct: isCorrect, answer: ex.answer });
    if (isCorrect) setCorrect((c) => c + 1);
    setTimeout(() => {
      if (idx + 1 >= exercises.length) setDone(true);
      else { setIdx((i) => i + 1); setInput(""); setFeedback(null); setShowHint(false); }
    }, 2000);
  };

  if (!ex && !done) return null;

  if (done) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{icon}</div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#e2e8f0", fontSize: 28 }}>{title} fertig!</h2>
        <p style={{ color: "#94a3b8", fontSize: 18 }}>{correct} von {exercises.length} richtig</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
          <button onClick={reset} style={btnStyle(color)}>🔄 Nochmal</button>
          <button onClick={onBack} style={btnStyle("#475569")}>← Zurück</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ProgressBar current={idx} total={exercises.length} correct={correct} />
      <div style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", borderRadius: 20, padding: "32px 28px", border: `1px solid ${color}33`, marginTop: 16 }}>
        <div style={{ fontSize: 12, color, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
          {getLabel ? getLabel(ex) : title}
        </div>
        <div style={{ fontSize: 22, fontFamily: "'Space Grotesk', sans-serif", color: "#f1f5f9", marginBottom: 24, lineHeight: 1.4 }}>
          {getPrompt(ex)}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} placeholder={placeholder || "Deine Antwort..."} disabled={!!feedback} style={inputStyle} />
          <button onClick={handleSubmit} disabled={!!feedback || !input.trim()} style={{ ...btnStyle(color), opacity: feedback || !input.trim() ? 0.5 : 1, minWidth: 80 }}>✓</button>
        </div>
        {!feedback && (
          <button onClick={() => setShowHint(true)} style={{ background: "none", border: "none", color, cursor: "pointer", fontSize: 13, marginTop: 12, padding: 0 }}>
            {showHint ? `💡 ${getHint(ex)}` : "💡 Tipp anzeigen"}
          </button>
        )}
        <Feedback show={!!feedback} correct={feedback?.correct} correctAnswer={feedback?.answer} />
      </div>
      {ruleBox}
    </div>
  );
}
