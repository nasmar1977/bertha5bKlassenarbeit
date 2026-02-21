# 🇬🇧 English 5b – Klassenarbeit Trainer

Interactive web app for 5th graders to prepare for their English test. Built with React + Vite.

![Screenshot](screenshot.png)

## Features

| Module | Description |
|--------|-------------|
| 📚 **Vokabeln** | Flashcard-style vocabulary quiz (DE ↔ EN) with typo tolerance, retry wrong answers |
| 📝 **Genitiv ('s)** | Practice possessive 's (singular, plural, irregular plural) |
| 📣 **Imperativ** | Form commands from situations (positive & negative with "Don't") |
| 💪 **Can / Can't** | Translate, negate, and form questions with "can" |
| ✍️ **My School** | Guided 15-sentence writing task with AI correction via Claude API |

### Smart Answer Matching
- **Typo tolerance**: Levenshtein distance (1 char for short words, 2 for longer)
- **German keyboard support**: Accepts ´ ` ' ' as apostrophes
- **Multiple correct answers**: Each vocab entry has alternative accepted answers
- **Flexible verbs**: "help" and "to help" both accepted
- **Umlaut normalization**: ä→ae, ö→oe, ü→ue, ß→ss

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Deploy to GitHub Pages

1. Create a GitHub repository (e.g., `english-5b-trainer`)

2. Update `vite.config.js` with your repo name:
   ```js
   base: '/your-repo-name/',
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

4. In your GitHub repo settings → Pages → Source: set to `gh-pages` branch.

Your app will be live at `https://yourusername.github.io/your-repo-name/`

## AI Writing Correction (Claude API)

The "My School" writing module uses the Anthropic Claude API for:
- **Per-sentence feedback**: Grammar, spelling, capitalization checks after each sentence
- **Full-text review**: Overall grade, strengths, improvements, and corrected version

### How it works
- When running as a **Claude.ai artifact**, the API key is handled automatically
- For **standalone deployment**, you'll need to set up a proxy server:

#### Option A: Serverless proxy (recommended for GitHub Pages)
Create a Cloudflare Worker or Vercel Edge Function that proxies requests to the Anthropic API with your key. Then update `src/utils/claude-api.js`:

```js
const API_URL = "https://your-proxy.workers.dev/v1/messages";
```

#### Option B: Environment variable (for server-hosted deployments)
Set `VITE_ANTHROPIC_API_KEY` in your environment and update the fetch call to include the header.

> ⚠️ **Never commit API keys to your repository!**

## Customization

### Add/change vocabulary
Edit `src/data/vocab.js`. Each entry:
```js
{ de: "German word", en: "English word", altDe: ["alternatives"], altEn: ["alternatives"] }
```

### Add/change exercises  
Edit `src/data/exercises.js` – straightforward arrays of exercise objects.

### Change school info
Update the header in `src/App.jsx`:
```jsx
<p>Your School Name · Klasse 5x · Your Textbook</p>
```

## Tech Stack

- **React 18** – UI framework
- **Vite 6** – Build tool
- **Anthropic Claude API** – AI-powered writing correction
- **GitHub Pages** via `gh-pages` – Hosting

## Project Structure

```
src/
├── main.jsx                  # Entry point
├── index.css                 # Global styles
├── App.jsx                   # Main app with menu & routing
├── components/
│   ├── ui.jsx                # Shared UI (ProgressBar, Feedback, styles)
│   ├── VocabTrainer.jsx      # Vocabulary flashcards
│   ├── GrammarTrainer.jsx    # Generic grammar exercise runner
│   └── WritingTrainer.jsx    # AI-powered writing module
├── data/
│   ├── vocab.js              # Vocabulary data with alternatives
│   └── exercises.js          # Grammar & writing exercise data
└── utils/
    ├── matching.js           # Fuzzy matching, normalization, shuffle
    └── claude-api.js         # Claude API integration
```

## License

MIT
