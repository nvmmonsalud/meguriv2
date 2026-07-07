# Meguri Hackathon Next Steps

## Current position

Meguri is already a working hackathon prototype. It has the core loop judges need to understand in under two minutes:

1. Pick an AI spirit guide.
2. Receive a location-based quest around Shibuya.
3. Verify arrival using camera/GPS.
4. Earn an ukiyo-e postcard reward.
5. Continue with guide chat and social/party hooks.

The next work is demo reliability and judge clarity, not a broad feature expansion.

## Day 0: must-do before submitting

- [ ] Deploy the app publicly.
- [ ] Add `GEMINI_API_KEY` to the deployment environment.
- [ ] Set `APP_URL` to the deployed URL.
- [ ] Enable Firebase **Anonymous** sign-in for real player IDs.
- [ ] Verify `/healthz` returns `ok: true` on the live deployment.
- [ ] Run the full judge path once from a clean browser profile.
- [ ] Decide whether to present fallback mode as an intentional offline-safe demo feature.

## Demo script, 90 seconds

**Hook:**

> Tourists see Tokyo as a map. Meguri turns Tokyo into a living quest world, guided by AI spirits.

**Flow:**

1. Launch landing page.
2. Choose Kohaku, the kitsune guide.
3. Generate Shibuya quests.
4. Open the Hachiko quest.
5. Show the walk/scan step.
6. Use GPS fallback if camera permissions slow the demo.
7. Collect the postcard.
8. Ask the guide for a nearby recommendation.
9. Close with party mode and daily quests as retention loops.

## Highest-impact engineering tasks

1. **Production deploy polish**
   - Keep `render.yaml` working.
   - Confirm the deployed app uses `PORT` from the host.
   - Add the deployed URL to the GitHub repo homepage.

2. **Credentials/config**
   - Set `GEMINI_API_KEY` in Render.
   - Keep `.env.example` secret-free.
   - Do not commit real Firebase or Gemini secrets.

3. **Firestore hardening**
   - Current `firestore.rules` are demo-open.
   - Use `firestore.production.rules` as the lock-down starting point.
   - Before switching, verify cached-player boot still signs in anonymously before Firestore writes.

4. **Judge-proof fallback story**
   - If Gemini quota/API fails, fallback mode keeps the demo moving.
   - Label this as intentional graceful degradation, not a bug.

5. **Live QA checklist**
   - Landing page loads.
   - App launches.
   - Guide selection works.
   - Quest list appears.
   - Quest detail opens.
   - Camera permission denial does not kill the flow.
   - GPS fallback completes.
   - Postcard reward appears.
   - Guide chat returns a response.
   - No console errors on the golden path.

## Stretch goals

- Add shareable postcard URLs.
- Add one real Google Maps deep link per quest.
- Add a visible “AI mode: Live / Fallback” badge for transparent demo status.
- Add a seeded “Judge demo” button that resets local storage and jumps to the best route.
- Add lightweight analytics events for onboarding, quest start, check-in success, postcard earned, and guide chat.

## Risks to avoid

- Do not tighten Firestore rules right before demo without a full browser test.
- Do not rely on camera permissions for the live demo path; GPS fallback should remain available.
- Do not spend hackathon time building broad content inventory before the main loop is judge-proof.
