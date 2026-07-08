# Meguri 巡り

**Tokyo is hiding something. Let's go find it.**

Meguri is a mobile-web location quest game for tourists in Tokyo. An AI spirit guide turns real places into walkable quests, verifies arrival with camera/GPS, and rewards each discovery with an ukiyo-e postcard for the player's Tokyo Passport.

Built for the **Entertainment / Experimental AI** hackathon track: interactive AI, multimodal camera/GPS/maps, storytelling, voice, and consumer entertainment.

## Golden demo path

Use this path for judges:

1. Open the landing page.
2. Click **Judge Demo Mode** or visit `/app?demo=true`.
3. Show the Shibuya quest map and **Gemini + Maps Ready** badge.
4. Open **Guide** and ask for a ramen/shrine recommendation.
5. Use **Quest Me There** to create a quest from the recommendation.
6. Start the quest, use camera/GPS check-in, then show the postcard reward.
7. Open **Archive** to show the Tokyo Passport.

Demo mode is deterministic and judge-safe. It does not require Firebase auth to succeed before showing the core game loop.

## How it works

- **Frontend:** React 19 + Vite + Tailwind v4 + Motion.
- **Server:** Express routes in `server.ts`, bundled into `dist/server.mjs`.
- **AI:** Google Gemini via `@google/genai`.
  - `/api/generate-quests` uses Gemini + Google Maps/Search grounding when `GEMINI_API_KEY` is configured.
  - `/api/verify-landmark` uses Gemini vision for camera landmark verification.
  - `/api/generate-postcard` uses Gemini image generation for ukiyo-e rewards.
  - `/api/guide-chat` uses persona prompts and Maps grounding for recommendations.
- **Persistence:** Firebase Auth + Firestore for players, passport items, and parties; local fallback keeps demos resilient.
- **Multimodal:** camera, GPS, voice synthesis, maps grounding, image generation.

## Local run

```bash
npm ci
cp .env.example .env
# edit .env if you want live Gemini/Firebase mode
npm run dev
```

Open:

- Landing: <http://localhost:3000/>
- App: <http://localhost:3000/app>
- Judge demo: <http://localhost:3000/app?demo=true>
- Health: <http://localhost:3000/healthz>

## Verification

```bash
npm run lint
npm run build
PORT=3001 NODE_ENV=production npm run start
curl http://127.0.0.1:3001/healthz
```

Expected `/healthz` shape:

```json
{
  "ok": true,
  "service": "meguri",
  "aiMode": "live-gemini | fallback-demo",
  "demoMode": false
}
```

## Render deploy

This repo includes `render.yaml` for Render Blueprint deploys.

1. Push this repo/branch to GitHub.
2. In Render: **New + → Blueprint**.
3. Select `nvmmonsalud/meguriv2`.
4. Add environment variables:
   - `GEMINI_API_KEY` — required for live AI mode.
   - `APP_URL` — Render service URL after first deploy.
   - `VITE_FIREBASE_*` — Firebase web app values for live Auth + Firestore persistence.
5. Deploy.
6. Smoke test `/healthz`, `/`, `/app`, and `/app?demo=true`.

## Firebase setup

For live persistence and party mode:

1. Firebase Console → Authentication → Sign-in method.
2. Enable **Anonymous** provider.
3. Create or choose a Firestore database.
4. Deploy `firestore.rules` after verifying the app uses Firebase Auth successfully.

If Firebase env vars are unset, the app uses a non-secret local demo fallback and stores player state in `localStorage`. Enable Firebase Anonymous Auth for live persistence.

## Demo artifacts

- Pitch deck: `pitch/index.html`
- Static deck PDF: `pitch/meguri-pitch-deck.pdf` — verified PDF 1.4, 1.6 MB
- Short demo video: `assets/meguri-demo.mp4` — verified MP4, 412×892, 25 fps, 71.32 seconds, 3.5 MB
- Hackathon plan + judge script: `docs/HACKATHON_NEXT_STEPS.md`

## Current known constraints

- Without `GEMINI_API_KEY`, AI routes return polished fallback responses.
- Strict Firestore rules require Firebase Anonymous Auth to be enabled before live writes work.
- Camera/GPS access requires HTTPS on deployed hosts or localhost in development.
