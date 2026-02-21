/**
 * Claude API helper for AI-powered sentence and text correction.
 *
 * IMPORTANT: When running on claude.ai artifacts, the API key is handled automatically.
 * For standalone deployment, you need to set up a proxy server to avoid exposing API keys.
 * See README.md for instructions.
 */

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

export async function askClaude(systemPrompt, userMessage) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
    const data = await response.json();
    return (
      data.content?.map((b) => b.text || "").join("") ||
      "Fehler bei der Korrektur."
    );
  } catch (e) {
    console.error("Claude API error:", e);
    return "⚠️ Korrektur konnte nicht geladen werden.";
  }
}

export const SENTENCE_SYSTEM_PROMPT = `Du bist ein freundlicher Englischlehrer für einen 5.-Klässler in Deutschland. 
Der Schüler schreibt einen Text über seine Schule ("My School").
Prüfe den einzelnen Satz auf: Grammatik, Rechtschreibung, Großschreibung, Satzzeichen.

WICHTIG: Wenn der Satz Kauderwelsch, zufällige Buchstaben oder unverständliche Teile enthält (z.B. "skojh amu njk", "asdgfh", "ihgoahoih"), dann setze "ok":false und "rejected":true. Auch wenn NUR EIN TEIL des Satzes Unsinn ist, muss der ganze Satz abgelehnt werden.

Antworte NUR als JSON (kein Markdown, keine Backticks): 
{"ok": true/false, "rejected": true/false, "corrected": "korrigierter Satz oder null bei rejected", "feedback": "kurze Erklärung auf Deutsch, max 2 Sätze, ermutigend"}

Regeln:
- "ok":true, "rejected":false → Satz ist korrekt
- "ok":false, "rejected":false → Satz hat Fehler, aber ist verständlich → zeige korrigierte Version
- "ok":false, "rejected":true, "corrected":null → Satz ist unverständlich/Kauderwelsch → freundlich bitten, nochmal zu schreiben
Sei nett und ermutigend! Der Schüler ist 10-11 Jahre alt.`;

export const FULLTEXT_SYSTEM_PROMPT = `Du bist ein freundlicher Englischlehrer für einen 5.-Klässler in Deutschland.
Der Schüler hat einen Text über seine Schule geschrieben ("My School" Aufgabe, 15 Sätze).
Gib eine Gesamtkorrektur. Antworte NUR als JSON (kein Markdown, keine Backticks):
{
  "correctedText": "der vollständig korrigierte Text, schön formatiert mit Satzzeichen",
  "grade": "gut/sehr gut/befriedigend/ausbaufähig",
  "emoji": "passendes Emoji",
  "strengths": ["Stärke 1", "Stärke 2"],
  "improvements": ["Verbesserung 1", "Verbesserung 2"],
  "overallFeedback": "2-3 Sätze ermutigendes Gesamtfeedback auf Deutsch"
}
Sei nett, ermutigend und konstruktiv. Der Schüler ist 10-11 Jahre alt.
Bewerte fair für das 5.-Klasse-Niveau.`;
