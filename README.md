# Meguri 巡り

Meguri is a Tokyo location-quest prototype: choose an AI spirit guide, receive a Shibuya walking quest, verify arrival with camera/GPS, and collect a generated ukiyo-e postcard in your passport.

## Demo loop

1. Open the landing page.
2. Launch the app and choose a guide: Kohaku, Sen, or Riku.
3. Generate or select a Shibuya quest.
4. Walk to the target and verify by camera or GPS fallback.
5. Collect the postcard reward and continue via guide chat or party mode.

## What is implemented

- React 19 + Vite mobile-first app shell.
- Express API server for quest generation, guide chat, landmark verification, and postcard generation.
- Gemini-powered flows when `GEMINI_API_KEY` is present.
- Fallback mode when no Gemini key is configured, so the demo still works.
- Firebase anonymous auth + Firestore integration for player/passport/party state.
- Static landing page, pitch deck PDF, and short demo video.

## Run locally

Prerequisites: Node.js 20+.

```bash
npm ci
cp .env.example .env
# Edit .env and set GEMINI_API_KEY for real AI mode, or leave it blank for fallback demo mode.
npm run dev
```

Open:

- Landing page: http://localhost:3000/
- App: http://localhost:3000/app
- Health check: http://localhost:3000/healthz

## Production build

```bash
npm run lint
npm run build
NODE_ENV=production npm run start
```

The server reads `PORT`, so Render/Railway/Fly can inject the public port automatically.

## Deploy on Render

This repo now includes `render.yaml`.

1. Push the repo to GitHub.
2. In Render: **New + → Blueprint**.
3. Select this repo.
4. Add environment variables:
   - `GEMINI_API_KEY`: required for real Gemini quest/chat/vision/image flows.
   - `APP_URL`: your deployed app URL after Render creates it.
5. In Firebase Console, enable **Authentication → Sign-in method → Anonymous** for real player IDs.
6. Deploy.

If `GEMINI_API_KEY` is missing, the app intentionally runs in fallback demo mode.

## Hackathon assets

- Pitch deck: `pitch/meguri-pitch-deck.pdf`
- Demo video: `assets/meguri-demo.mp4`
- Continuation plan: `docs/HACKATHON_NEXT_STEPS.md`

## Security notes

The checked-in `firestore.rules` are permissive for a low-friction hackathon demo. Do **not** deploy them unchanged for production. Use `firestore.production.rules` as the starting point for locked-down anonymous-user ownership rules.
