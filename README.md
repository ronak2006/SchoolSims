# SchoolSims

Award-winning interactive simulation platform built at **YCP Hacks**. Learners navigate a branching leadership scenario across 7 slides, making decisions that shape the outcome. Fully localized in 7 languages with 5 selectable character avatars.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** Python 3.11+, FastAPI, Uvicorn
- **TTS:** ElevenLabs API (optional, with file-based caching)

## Architecture

```
Browser (React SPA)
  │
  ├─ GET /api/options          → available languages + ethnicities
  ├─ GET /api/simulation       → slide graph + media URLs for a session
  ├─ POST /api/tts/preload     → pre-generate narration audio
  └─ POST /api/review          → submit feedback
  │
FastAPI
  ├─ scenario.json             → linked-graph content for all 7 languages
  ├─ tts.py                    → ElevenLabs wrapper with SHA-256 cache keys
  └─ public/assets/            → photos, videos, VTT captions per locale
```

The frontend is a state machine that walks the slide graph returned by `/api/simulation`. Language and ethnicity are query params — ethnicity changes only the character photo and video, never the scenario text or outcomes. Decision slide branches to one of two outcome nodes; the summary slide reflects whichever path was chosen.

## Features

- 7-slide branching scenario (context, text+image, video, decision, outcome, summary)
- 7 languages: English, Spanish, Arabic, Chinese, Nepali, Swahili, Urdu
- 5 character ethnicities (visual only — no effect on text or outcomes)
- Optional text-to-speech with per-slide caching
- Post-simulation review form (star rating + open feedback)
- Keyboard shortcuts on the decision slide (`A` / `B`)

## Local Setup

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```

Optional TTS — copy `backend/.env.example` to `.env.local` at the repo root and add your ElevenLabs key. If no key is set, TTS is silently disabled.

### Frontend

```bash
npm install
```

### Run (development)

```bash
# Terminal 1
cd backend && uvicorn main:app --port 8000 --reload

# Terminal 2
npm run dev
```

Vite proxies `/api` and `/tts` to `:8000`. Open http://localhost:5173.

### Run (production)

```bash
npm run build
cd backend && uvicorn main:app --port 8000
```

FastAPI serves the built frontend from `dist/`. Open http://localhost:8000.

## Project Structure

```
backend/
  main.py             # API routes, scenario assembly, static serving
  tts.py              # ElevenLabs TTS with MP3 cache
  scenario.json       # Slide content graph (all languages)
  .env.example        # Required environment variables

src/
  App.tsx             # Root component and slide state machine
  components/         # One file per slide + shared UI (modals, layout)
  hooks/useSpeech.ts  # Audio playback hook
  types.ts            # Shared TypeScript interfaces

public/assets/        # Media: {ethnicity}.png, {ethnicity}_{lang}.mp4, captions_{lang}.vtt
```
