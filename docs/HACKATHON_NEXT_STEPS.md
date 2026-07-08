# Meguri v2 — Hackathon next steps

## Verdict

Continue Meguri for the next Entertainment / Experimental AI hackathon. The strongest angle is:

> Pokémon GO meets a Tokyo spirit-guide, powered by Gemini Maps, vision, and image generation.

## Judge-proof 90-second script

**0–10s — Hook**
- Open landing page.
- Say: “Tokyo is full of hidden stories. Meguri turns a walk into an AI-guided quest.”
- Click **Judge Demo Mode**.

**10–25s — Persona**
- Show Kohaku loaded as the fox-spirit guide.
- Point out guide voice/personality and the Shibuya map.

**25–45s — AI quest generation**
- Hit **Find Quests**.
- Explain: “With a Gemini key, this uses Maps/Search grounding to find real nearby places and write lore.”
- Open a quest and show route, checklist, rewards.

**45–65s — Guide chat → quest**
- Go to **Guide**.
- Ask: “Is there any legendary ramen nearby?” or “Where is a quiet sanctuary here?”
- Use **Quest Me There** on the recommendation card.

**65–80s — Multimodal verification**
- Start the quest.
- Show camera/GPS check-in.
- Explain Gemini vision verifies landmarks; GPS fallback keeps the stage demo reliable.

**80–90s — Reward loop**
- Show ukiyo-e postcard generation and **Archive** / Tokyo Passport.
- Close: “Tokyo today, every city tomorrow.”

## Day 0 checklist

- [ ] Deploy Render Blueprint from `render.yaml`.
- [ ] Add `GEMINI_API_KEY` on Render.
- [ ] Set `APP_URL` to the deployed URL.
- [ ] Enable Firebase Anonymous Auth.
- [ ] Set Firebase `VITE_FIREBASE_*` env vars for live Auth + Firestore persistence; otherwise Meguri uses local demo fallback state.
- [ ] Smoke test `/healthz`, `/`, `/app`, `/app?demo=true` on mobile.
- [ ] Keep one browser tab logged into demo mode before presentation.
- [ ] Keep `assets/meguri-demo.mp4` ready as backup if venue Wi-Fi fails.

## Stretch goals after reliability

1. **Voice polish** — Japanese/English guide voices and replay controls.
2. **QR party mode** — share a party code/QR with another judge.
3. **Three curated Tokyo routes** — Shibuya, Asakusa, Shimokitazawa.
4. **AI provenance cards** — show “Gemini chose this because…” on each quest.
5. **Postcard wall** — a more visual passport gallery for the final wow moment.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Gemini key missing | `/healthz` exposes fallback mode; demo mode still works |
| Firebase anonymous auth disabled | app falls back to local player; docs show console fix |
| Venue Wi-Fi blocks camera/maps | use local demo mode + bundled MP4 backup |
| API returns odd quest | keep curated static Shibuya quests as fallback |
| Firestore rules block demo writes | localStorage fallback preserves core loop |

## Success metric

A judge can understand the product in 15 seconds, interact with the AI in 45 seconds, and see a collectible reward before 90 seconds.
