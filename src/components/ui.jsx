export function ProgressBar({ current, total, correct }) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div style={{ margin: "16px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#7a8b9a", marginBottom: 6 }}>
        <span>Frage {Math.min(current + 1, total)} / {total}</span>
        <span>✓ {correct} richtig</span>
      </div>
      <div style={{ height: 8, background: "#1a2332", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #22d3ee, #6366f1)", borderRadius: 4, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

export function Feedback({ show, correct, correctAnswer }) {
  if (!show) return null;
  return (
    <div style={{
      padding: "12px 20px",
      borderRadius: 12,
      marginTop: 12,
      background: correct ? "rgba(34,211,238,0.12)" : "rgba(251,113,133,0.12)",
      border: correct ? "1px solid rgba(34,211,238,0.3)" : "1px solid rgba(251,113,133,0.3)",
      color: correct ? "#22d3ee" : "#fb7185",
      fontSize: 15,
      animation: "fadeIn 0.3s ease",
    }}>
      {correct
        ? "✓ Richtig! Super!"
        : `✗ Leider falsch. Richtig wäre: ${correctAnswer}`}
    </div>
  );
}

export const inputStyle = {
  flex: 1,
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#f1f5f9",
  fontSize: 16,
  fontFamily: "'DM Sans', sans-serif",
  outline: "none",
};

export const btnStyle = (color) => ({
  padding: "12px 20px",
  borderRadius: 12,
  border: "none",
  background: color,
  color: "#fff",
  fontSize: 15,
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s",
});
