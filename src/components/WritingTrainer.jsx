import { useState, useEffect, useRef } from "react";
import { WRITING_PROMPTS } from "../data/exercises.js";
import { askClaude, SENTENCE_SYSTEM_PROMPT, FULLTEXT_SYSTEM_PROMPT } from "../utils/claude-api.js";
import { ProgressBar, inputStyle, btnStyle } from "./ui.jsx";

const categoryColors = { general: "#6366f1", building: "#22d3ee", subjects: "#eab308", day: "#10b981" };
const categoryLabels = { general: "Allgemein", building: "Gebäude", subjects: "Fächer", day: "Schultag" };

function formatSentence(text) {
  let s = text.trim();
  if (s && !/[.!?]$/.test(s)) s += ".";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Local gibberish / nonsense detection.
 * Catches random key-mashing before it ever reaches the API.
 */
function isGibberish(text) {
  const cleaned = text.replace(/[^a-zA-ZäöüÄÖÜß\s'´']/g, "").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;

  // Common English words a 5th grader would use
  const knownWords = new Set([
    "i", "my", "me", "we", "our", "you", "your", "he", "she", "it", "his", "her", "they", "their",
    "a", "an", "the", "is", "are", "am", "was", "were", "be", "been", "have", "has", "got", "had",
    "do", "don't", "does", "doesn't", "did", "can", "can't", "cannot", "will", "would", "could",
    "and", "or", "but", "not", "no", "yes", "so", "very", "really", "too", "also",
    "in", "on", "at", "to", "for", "of", "with", "from", "about", "after", "before",
    "school", "class", "classroom", "teacher", "pupil", "student", "friend", "friends",
    "big", "small", "old", "new", "nice", "good", "great", "fun", "cool", "boring", "difficult", "easy", "interesting",
    "like", "love", "don't", "think", "play", "start", "finish", "learn", "meet", "eat", "help",
    "there", "here", "this", "that", "what", "when", "where", "because", "called",
    "morning", "afternoon", "break", "lunch", "day", "time", "first", "second", "floor",
    "english", "maths", "math", "science", "art", "music", "pe", "history", "geography", "french", "german", "latin", "spanish",
    "favourite", "favorite", "subject", "subjects", "lesson", "lessons",
    "cafeteria", "library", "gym", "room", "garden", "playground",
    "o'clock", "half", "past", "quarter", "eight", "nine", "two", "three",
    "best", "worst", "happy", "glad", "sad",
  ]);

  // Count how many words are recognizable
  let recognized = 0;
  for (const w of words) {
    if (knownWords.has(w.toLowerCase()) || w.length <= 2) recognized++;
  }
  const ratio = recognized / words.length;

  // Check for consonant clusters (key-mashing detection)
  const consonantRuns = cleaned.match(/[^aeiouäöü\s]{5,}/gi);
  if (consonantRuns && consonantRuns.length >= 2) return true;

  // If less than 30% of words are recognized AND more than 4 words, likely gibberish
  if (words.length > 3 && ratio < 0.3) return true;

  // Single long unrecognizable word
  if (words.length === 1 && !knownWords.has(words[0].toLowerCase()) && words[0].length > 10) return true;

  return false;
}

export default function WritingTrainer({ onBack }) {
  const [idx, setIdx] = useState(0);
  const [sentences, setSentences] = useState([]);
  const [input, setInput] = useState("");
  const [done, setDone] = useState(false);
  const [showHelper, setShowHelper] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sentenceFeedback, setSentenceFeedback] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [loadingFinal, setLoadingFinal] = useState(false);
  const [rejected, setRejected] = useState(false); // sentence was rejected, allow retry
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current && !done && !checking && !sentenceFeedback) inputRef.current.focus();
  }, [idx, done, checking, sentenceFeedback]);

  const prompt = WRITING_PROMPTS[idx];

  const handleAdd = async () => {
    if (!input.trim() || checking) return;
    const formatted = formatSentence(input);

    // Local gibberish check BEFORE calling API
    if (isGibberish(formatted)) {
      setSentenceFeedback({
        ok: false,
        rejected: true,
        corrected: null,
        feedback: "Das sieht nicht nach einem englischen Satz aus. 😊 Versuche es nochmal! Du kannst auf '💡 Hilfe anzeigen' klicken, wenn du nicht weiterweißt.",
      });
      setRejected(true);
      return;
    }

    setChecking(true);
    setSentenceFeedback(null);
    setRejected(false);

    const fb = await askClaude(
      SENTENCE_SYSTEM_PROMPT,
      `Aufgabe: "${prompt.prompt}"\nSatz des Schülers: "${formatted}"`
    );
    let parsed;
    try {
      parsed = JSON.parse(fb.replace(/```json|```/g, "").trim());
    } catch {
      parsed = { ok: true, corrected: formatted, feedback: "Gut gemacht! Weiter so!" };
    }

    // API might also flag as unreadable/rejected
    if (parsed.rejected) {
      parsed.corrected = null;
      if (!parsed.feedback) parsed.feedback = "Das konnte ich leider nicht verstehen. Versuche es nochmal mit einem einfachen englischen Satz!";
      setRejected(true);
      setSentenceFeedback(parsed);
      setChecking(false);
      return;
    }

    setSentenceFeedback(parsed);
    setRejected(false);
    const finalText = parsed.ok ? formatted : (parsed.corrected || formatted);
    setSentences((s) => [...s, {
      prompt: prompt.prompt,
      original: formatted,
      corrected: finalText,
      ok: parsed.ok,
      category: prompt.category,
    }]);
    setChecking(false);
  };

  const handleRetry = () => {
    // Clear feedback, keep input so they can edit it
    setSentenceFeedback(null);
    setRejected(false);
    setInput("");
  };

  const handleNext = () => {
    setSentenceFeedback(null);
    setInput("");
    setShowHelper(false);
    setRejected(false);
    if (idx + 1 >= WRITING_PROMPTS.length) {
      setDone(true);
      requestFinalReview();
    } else {
      setIdx((i) => i + 1);
    }
  };

  const requestFinalReview = async () => {
    setLoadingFinal(true);
    const allSentences = [...sentences].map((s) => s.corrected).join(" ");
    const fb = await askClaude(FULLTEXT_SYSTEM_PROMPT, `Text des Schülers:\n${allSentences}`);
    try {
      setFinalResult(JSON.parse(fb.replace(/```json|```/g, "").trim()));
    } catch {
      setFinalResult({
        correctedText: allSentences,
        grade: "gut", emoji: "👍",
        strengths: ["Du hast 15 Sätze geschrieben!"],
        improvements: ["Übe weiter!"],
        overallFeedback: "Gut gemacht! Weiter so!",
      });
    }
    setLoadingFinal(false);
  };

  const resetAll = () => {
    setIdx(0); setSentences([]); setDone(false); setInput("");
    setFinalResult(null); setSentenceFeedback(null); setShowHelper(false);
  };

  // ── DONE SCREEN ──
  if (done) {
    const originalText = sentences.map((s) => s.original).join(" ");
    return (
      <div>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>{finalResult?.emoji || "✍️"}</div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#e2e8f0", fontSize: 28, margin: 0 }}>Dein Text: My School</h2>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>{sentences.length} Sätze geschrieben!</p>
        </div>

        {loadingFinal ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12, animation: "pulse 1.5s infinite" }}>🔍</div>
            <p style={{ color: "#94a3b8" }}>Dein Lehrer Claude korrigiert deinen Text...</p>
          </div>
        ) : finalResult ? (
          <div>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <span style={{
                display: "inline-block", padding: "8px 24px", borderRadius: 20,
                background: finalResult.grade === "sehr gut" ? "rgba(34,211,238,0.15)" : finalResult.grade === "gut" ? "rgba(99,102,241,0.15)" : "rgba(234,179,8,0.15)",
                color: finalResult.grade === "sehr gut" ? "#22d3ee" : finalResult.grade === "gut" ? "#6366f1" : "#eab308",
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 600,
              }}>
                Bewertung: {finalResult.grade}
              </span>
            </div>

            <div style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", borderRadius: 16, padding: "20px 24px", border: "1px solid rgba(99,102,241,0.2)", marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#6366f1", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>Dein Originaltext</div>
              <div style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.8 }}>{originalText}</div>
            </div>

            <div style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", borderRadius: 16, padding: "20px 24px", border: "1px solid rgba(34,211,238,0.2)", marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#22d3ee", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>Korrigierte Version</div>
              <div style={{ fontSize: 15, color: "#e2e8f0", lineHeight: 1.8 }}>{finalResult.correctedText}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 16, background: "rgba(16,185,129,0.06)", borderRadius: 12, border: "1px solid rgba(16,185,129,0.15)" }}>
                <div style={{ fontSize: 13, color: "#10b981", marginBottom: 8 }}>💪 Das war gut:</div>
                {(finalResult.strengths || []).map((s, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4 }}>✓ {s}</div>
                ))}
              </div>
              <div style={{ padding: 16, background: "rgba(249,115,22,0.06)", borderRadius: 12, border: "1px solid rgba(249,115,22,0.15)" }}>
                <div style={{ fontSize: 13, color: "#f97316", marginBottom: 8 }}>📝 Das kannst du üben:</div>
                {(finalResult.improvements || []).map((s, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4 }}>→ {s}</div>
                ))}
              </div>
            </div>

            <div style={{ padding: "16px 20px", background: "rgba(99,102,241,0.06)", borderRadius: 12, border: "1px solid rgba(99,102,241,0.15)", marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: "#e2e8f0", lineHeight: 1.6 }}>{finalResult.overallFeedback}</div>
            </div>
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
          <button onClick={() => navigator.clipboard?.writeText(finalResult?.correctedText || originalText)} style={btnStyle("#6366f1")}>📋 Text kopieren</button>
          <button onClick={resetAll} style={btnStyle("#22d3ee")}>🔄 Nochmal schreiben</button>
          <button onClick={onBack} style={btnStyle("#475569")}>← Zurück</button>
        </div>
      </div>
    );
  }

  // ── INPUT SCREEN ──
  return (
    <div>
      <ProgressBar current={idx} total={WRITING_PROMPTS.length} correct={sentences.length} />

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <span key={key} style={{
            padding: "4px 12px", borderRadius: 20, fontSize: 12,
            background: prompt.category === key ? `${categoryColors[key]}22` : "transparent",
            color: prompt.category === key ? categoryColors[key] : "#475569",
            border: `1px solid ${prompt.category === key ? categoryColors[key] + "44" : "#1e293b"}`,
          }}>{label}</span>
        ))}
      </div>

      <div style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", borderRadius: 20, padding: "32px 28px", border: `1px solid ${categoryColors[prompt.category]}33`, marginTop: 8 }}>
        <div style={{ fontSize: 12, color: categoryColors[prompt.category], letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>✍️ Schreibe einen Satz</div>
        <div style={{ fontSize: 22, fontFamily: "'Space Grotesk', sans-serif", color: "#f1f5f9", marginBottom: 20 }}>{prompt.prompt}</div>

        {showHelper && (
          <div style={{ marginBottom: 16, padding: "12px 16px", background: "rgba(99,102,241,0.08)", borderRadius: 10, fontSize: 14 }}>
            <div style={{ color: "#94a3b8" }}>Hilfe: <strong style={{ color: "#e2e8f0" }}>{prompt.helper}</strong></div>
            <div style={{ color: "#6366f1", fontSize: 13, marginTop: 4 }}>Beispiel: {prompt.example}</div>
          </div>
        )}

        {!sentenceFeedback ? (
          <>
            <div style={{ display: "flex", gap: 10 }}>
              <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} placeholder="Schreibe deinen Satz auf Englisch..." disabled={checking} style={{ ...inputStyle, opacity: checking ? 0.5 : 1 }} />
              <button onClick={handleAdd} disabled={!input.trim() || checking} style={{ ...btnStyle(categoryColors[prompt.category]), opacity: !input.trim() || checking ? 0.5 : 1, minWidth: 80 }}>
                {checking ? "..." : "✓"}
              </button>
            </div>
            {!showHelper && !checking && (
              <button onClick={() => setShowHelper(true)} style={{ background: "none", border: "none", color: categoryColors[prompt.category], cursor: "pointer", fontSize: 13, marginTop: 12, padding: 0 }}>
                💡 Hilfe anzeigen
              </button>
            )}
            {checking && <div style={{ marginTop: 12, fontSize: 13, color: "#94a3b8" }}>🔍 Claude prüft deinen Satz...</div>}
          </>
        ) : (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{
              padding: "14px 20px", borderRadius: 12, marginBottom: 12,
              background: sentenceFeedback.ok ? "rgba(34,211,238,0.1)" : sentenceFeedback.rejected ? "rgba(251,113,133,0.1)" : "rgba(249,115,22,0.1)",
              border: `1px solid ${sentenceFeedback.ok ? "rgba(34,211,238,0.25)" : sentenceFeedback.rejected ? "rgba(251,113,133,0.25)" : "rgba(249,115,22,0.25)"}`,
            }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: sentenceFeedback.ok ? "#22d3ee" : sentenceFeedback.rejected ? "#fb7185" : "#f97316", marginBottom: 6 }}>
                {sentenceFeedback.ok ? "✓ Super!" : sentenceFeedback.rejected ? "🤔 Das war kein richtiger Satz" : "📝 Fast richtig!"}
              </div>
              {!sentenceFeedback.ok && !sentenceFeedback.rejected && sentenceFeedback.corrected && (
                <div style={{ fontSize: 14, color: "#e2e8f0", marginBottom: 6 }}>Besser: <strong>{sentenceFeedback.corrected}</strong></div>
              )}
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>{sentenceFeedback.feedback}</div>
            </div>
            {sentenceFeedback.rejected ? (
              <button onClick={handleRetry} style={{ ...btnStyle("#fb7185"), width: "100%" }}>
                🔄 Nochmal versuchen
              </button>
            ) : (
              <button onClick={handleNext} style={{ ...btnStyle(categoryColors[prompt.category]), width: "100%" }}>
                {idx + 1 >= WRITING_PROMPTS.length ? "🎉 Text fertigstellen" : "→ Weiter zum nächsten Satz"}
              </button>
            )}
          </div>
        )}
      </div>

      {sentences.length > 0 && (
        <div style={{ marginTop: 20, padding: "16px 20px", background: "rgba(15,23,42,0.5)", borderRadius: 12, border: "1px solid #1e293b" }}>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 8 }}>Dein Text bisher ({sentences.length} Sätze):</div>
          <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8 }}>
            {sentences.map((s, i) => (
              <span key={i} style={{ color: s.ok ? "#94a3b8" : "#f97316" }}>{s.corrected} </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
