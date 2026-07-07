import express from "express";
import type { Request, Response } from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import fs from "fs";

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = Number(process.env.PORT || 3000);
const DEMO_MODE = process.env.DEMO_MODE === "true" || process.env.VITE_DEMO_MODE === "true";

function getAiMode() {
  return ai ? "live-gemini" : "fallback-demo";
}

// Increase payload size limit to accept base64 camera images
app.use(express.json({ limit: "15mb" }));

// Initialize Gemini API Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

// Lightweight readiness check for deploy platforms and smoke tests.
app.get("/healthz", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: "meguri",
    aiMode: getAiMode(),
    demoMode: DEMO_MODE,
    timestamp: new Date().toISOString()
  });
});

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not defined. AI verification will operate in fallback mode.");
}

// Landmark verification map for detailed prompts
const landmarkDescriptions: { [key: string]: { title: string; landmark: string; details: string } } = {
  hachiko: {
    title: "The Loyal Guardian",
    landmark: "Hachiko Bronze Statue",
    details: "A bronze statue of a dog (Akita Inu) sitting on a pedestal, located near Shibuya Station Hachiko exit."
  },
  neon_shrine: {
    title: "The Neon Shrine",
    landmark: "Nonbei Yokocho Vermilion Torii Gate",
    details: "A small traditional red/vermilion wooden torii gate located amidst narrow Tokyo alleys with lanterns."
  },
  moyai: {
    title: "The Wind-Swept Monolith",
    landmark: "Shibuya Moyai Statue",
    details: "A large stone statue representing a face (similar to Easter Island Moai, but with wild wavy hair on one side) located near Shibuya Station West Exit."
  }
};

// API Route: Verify Landmark
app.post("/api/verify-landmark", async (req, res) => {
  const { 
    base64Image, 
    questId, 
    guideId, 
    forceCheckIn, 
    locationName, 
    questDescription, 
    latitude, 
    longitude, 
    targetLatitude, 
    targetLongitude 
  } = req.body;

  if (!questId) {
    return res.status(400).json({ error: "Missing questId" });
  }

  const landmarkInfo = landmarkDescriptions[questId] || {
    title: "Unknown Quest",
    landmark: "Landmark",
    details: "A landmark in Shibuya, Tokyo."
  };

  // If GPS check-in or force check-in is requested, bypass camera verification and check distance
  if (forceCheckIn) {
    let distance: number | null = null;
    if (latitude !== undefined && longitude !== undefined && targetLatitude !== undefined && targetLongitude !== undefined) {
      // Haversine formula to compute distance in meters
      const R = 6371000; // Radius of the earth in meters
      const dLat = (targetLatitude - latitude) * Math.PI / 180;
      const dLon = (targetLongitude - longitude) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(latitude * Math.PI / 180) * Math.cos(targetLatitude * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      distance = R * c;
    }

    if (distance !== null && distance > 40) {
      return res.json({
        verified: false,
        errorType: "DISTANCE_EXCEEDED",
        distance: Math.round(distance),
        spiritMessage: `Ah, my compass spins wildly! You are currently ${Math.round(distance)} meters away from this location. You must venture within 40 meters to check in.`
      });
    }

    const messages = {
      kohaku: `Ah! The physical coordinates align! I'll wave my sleeves and let the spirit-winds confirm you're here. You've discovered ${locationName || landmarkInfo.title}!`,
      sen: `Indeed, your steps have brought you to this very ground. I can feel the quiet presence of the guardian here. Welcome to ${locationName || landmarkInfo.title}.`,
      riku: `GPS locked! You're right on the spot, friend! The crowd is high and you're officially checked in at ${locationName || landmarkInfo.title}!`
    };
    
    const selectedMsg = messages[guideId as "kohaku" | "sen" | "riku"] || messages.kohaku;

    return res.json({
      verified: true,
      spiritMessage: selectedMsg,
      verifiedAt: new Date().toISOString()
    });
  }

  // Camera capture verification
  if (!base64Image) {
    return res.status(400).json({ error: "Missing camera image data" });
  }

  // Clean base64 string
  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

  if (!ai) {
    // If Gemini client is not initialized due to missing API key, fallback to automatic verification so user's game doesn't break
    console.warn("Gemini client is not initialized. Falling back to automatic approval.");
    return res.json({
      verified: true,
      spiritMessage: `[Fallback Mode: No API Key Defined] Ah! I see you there in spirit near the ${locationName || landmarkInfo.landmark}! The guide lets you pass. Welcome to ${locationName || landmarkInfo.title}!`,
      verifiedAt: new Date().toISOString()
    });
  }

  try {
    const place = locationName || landmarkInfo.landmark;
    const refDesc = questDescription || landmarkInfo.details;

    const prompt = `Does this image plausibly show ${place}?
Reference description of the place: ${refDesc}

Reply JSON: {match: boolean, confidence: 0-1, observation: string}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: cleanBase64
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            match: { type: Type.BOOLEAN },
            confidence: { type: Type.NUMBER },
            observation: { type: Type.STRING }
          },
          required: ["match", "confidence", "observation"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from Gemini API");
    }

    const verificationResult = JSON.parse(resultText);
    const match = verificationResult.match === true;
    const confidence = verificationResult.confidence !== undefined ? verificationResult.confidence : 0.0;
    const observation = verificationResult.observation || "";

    const verified = match && confidence > 0.6;

    // Generate custom in-character message surfacing the observation as flavor
    let spiritMessage = "";
    if (verified) {
      const messages = {
        kohaku: `Kyu! My fox ears twitch! I see it clearly in your snapshot: ${observation}. You have completed this step!`,
        sen: `Ah, yes. I observe ${observation}. A truly peaceful moment. You have completed this step successfully.`,
        riku: `Whoa, cool! I spot ${observation} right there in your camera! Step complete! Let's go!`
      };
      spiritMessage = messages[guideId as "kohaku" | "sen" | "riku"] || messages.kohaku;
    } else {
      spiritMessage = `The spirits peer closely but are uncertain (Confidence: ${Math.round(confidence * 100)}%). They whispered: "${observation}". Let's check in via GPS fallback instead!`;
    }

    return res.json({
      verified,
      match,
      confidence,
      observation,
      spiritMessage,
      verifiedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("Gemini landmark verification error:", error);
    // Graceful verification failure: fallback to immediate approval to maintain great UX
    return res.json({
      verified: true,
      spiritMessage: `Ah, my eyes are playing tricks in this electric haze! But I hear your footsteps clear enough. You've reached ${locationName || landmarkInfo.title}! Let's add the postcard to your passport.`,
      verifiedAt: new Date().toISOString(),
      fallbackApproved: true
    });
  }
});

// API Route: Generate Quests (Quest Master Managed Agent)
app.post("/api/generate-quests", async (req, res) => {
  const { latitude, longitude, level, completedPlaceIds, guidePersona, partyIds } = req.body;
  const lat = latitude || 35.6580;
  const lng = longitude || 139.7013;
  const lvl = level || 1;
  const completedList = completedPlaceIds || [];
  const persona = guidePersona || "kohaku";
  const parties = partyIds || [];

  // Read the Quest Master and scale-difficulty definitions dynamically from filesystem files
  let agentsInstruction = "";
  let difficultySkill = "";
  try {
    agentsInstruction = fs.readFileSync(path.join(process.cwd(), "AGENTS.md"), "utf8");
    difficultySkill = fs.readFileSync(path.join(process.cwd(), "SKILL.md"), "utf8");
  } catch (err) {
    console.warn("Failed to read AGENTS.md or SKILL.md, using static definitions:", err);
    agentsInstruction = `
# Quest Master
Role: Generate and orchestrate location quests for a player in Tokyo.
Inputs: player {lat, lng, level, completedPlaceIds, guidePersona, partyIds?}
Tools: google_maps_grounding, maps_routing_sar, google_search
Behavior:
- Generate 3–5 quests within 1.5km, anchored to real places (return placeId).
- Order them into a walkable route from the player's position (SAR).
- Never repeat a place in completedPlaceIds. Scale difficulty to level.
- Each quest: in-character hook (match guidePersona), 2–3 objective steps,
  one verifiable arrival step, a lore snippet, a postcard image prompt.
- Output: strict JSON array matching the Quest schema. No prose.
    `;
    difficultySkill = `
# scale-difficulty
Given player level, set walking distance, step count, and obscurity of the
place: L1–3 easy (≤400m, famous), L4–7 medium (≤900m, semi-hidden),
L8+ hard (≤1.5km, genuinely off the tourist path).
    `;
  }

  // Apply scale-difficulty skill rules
  let maxDistance = 1500;
  let obscurityPrompt = "genuinely off the tourist path, local gems";
  let difficultyLabel = "hard";
  if (lvl <= 3) {
    maxDistance = 400;
    obscurityPrompt = "extremely famous, highly popular landmarks";
    difficultyLabel = "easy";
  } else if (lvl <= 7) {
    maxDistance = 900;
    obscurityPrompt = "semi-hidden, slightly obscured places of interest";
    difficultyLabel = "medium";
  }

  if (!ai) {
    console.warn("Gemini client is not initialized. Returning high-quality fallback quests.");
    return res.json({
      quests: [
        {
          questId: "hachiko_gen",
          id: "hachiko_gen",
          title: "The Loyal Guardian",
          description: "Meet the faithful one who still keeps vigil at the gates of the modern world. Open daily, 24/7. Crowded in the evenings around 18:00 - 20:00.",
          lore: "Meet the faithful one who still keeps vigil at the gates of the modern world. Open daily, 24/7. Crowded in the evenings around 18:00 - 20:00.",
          guideIntro: "There's a bronze companion waiting where the crowds flow deepest. Look beneath the sakura trees.",
          guideHook: "There's a bronze companion waiting where the crowds flow deepest. Look beneath the sakura trees.",
          difficulty: difficultyLabel,
          coop: parties.length > 0,
          startPlace: { name: "Current Location", lat, lng },
          targetPlace: {
            name: "Shibuya Crossing Plaza",
            placeId: "ChIJ_yV8N6KMGARREw_65GvL-AI",
            lat: 35.6585,
            lng: 139.7013,
            referenceDescription: "Bronze Hachiko Dog Statue"
          },
          locationName: "Shibuya Crossing Plaza",
          latitude: 35.6585,
          longitude: 139.7013,
          placeId: "ChIJ_yV8N6KMGARREw_65GvL-AI",
          steps: [
            "Walk to the Shibuya Station Hachiko Exit Plaza",
            "Find the bronze statue of Hachiko near the old green train car",
            "Scan Hachiko (or use GPS check-in) to earn your postcard"
          ],
          newSteps: [
            { instruction: "Walk to the Shibuya Station Hachiko Exit Plaza", verifyType: "checkin", hint: "Look for the green train car" },
            { instruction: "Find the bronze statue of Hachiko near the old green train car", verifyType: "checkin", hint: "It is close to the crossing" },
            { instruction: "Scan Hachiko (or use GPS check-in) to earn your postcard", verifyType: "vision", hint: "Align Hachiko in the camera reticle" }
          ],
          route: {
            mode: "walking",
            etaMinutes: 1,
            distanceMeters: 50
          },
          walkTime: "1 min walk",
          distance: "50m",
          reward: {
            shards: 100,
            postcardPrompt: "ukiyo-e print of Hachiko dog statue, cherry blossoms",
            badge: "Shibuya Initiate"
          },
          rewardXp: 100,
          rewardKakera: 100,
          postcardUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDCKYAUsXR5C0nygzc1yq37u6zQtX2frcUqg-MPD_4cLk0f2bKdSh0cdA6abmMVKW34E-1X5sIf7XcThToDV6f2gbOTfsCYbIzmBGpL99sgwI5MrhNEQfbqQEDn34Sh0YnW8OqKVv8VfhTL8oRK5B0bhZ9RWyEj04dY8QEA41B-Ik92fqtUevTp6_e6pry715Jkkyc3t0JRUHJq_8igbn42cYRspbSUTMNw8ihCLODQTXUMX3U6SEN4EHIgjm3Bveiu3X9fSi8GWTct",
          markerOffsetLeft: 45,
          markerOffsetTop: 55
        },
        {
          questId: "neon_shrine_gen",
          id: "neon_shrine_gen",
          title: "The Neon Shrine",
          description: "Hidden between the glow of digital billboards lies a sanctuary of old spirits. Open daily. Peak hours are 19:00 - 23:00.",
          lore: "Hidden between the glow of digital billboards lies a sanctuary of old spirits. Open daily. Peak hours are 19:00 - 23:00.",
          guideIntro: "Smell that? Curry pan, three streets over. There's a shrine behind that shop...",
          guideHook: "Smell that? Curry pan, three streets over. There's a shrine behind that shop...",
          difficulty: difficultyLabel,
          coop: parties.length > 0,
          startPlace: { name: "Current Location", lat, lng },
          targetPlace: {
            name: "Nonbei Yokocho (Drunkard's Alley)",
            placeId: "ChIJ8yMKN6KMGARRE_vW4qgS9fE",
            lat: 35.6596,
            lng: 139.7019,
            referenceDescription: "Vermilion torii gate of the small shrine"
          },
          locationName: "Nonbei Yokocho (Drunkard's Alley)",
          latitude: 35.6596,
          longitude: 139.7019,
          placeId: "ChIJ8yMKN6KMGARRE_vW4qgS9fE",
          steps: [
            "Walk to Nonbei Yokocho (Drunkard's Alley)",
            "Navigate the narrow lane to find the hidden vermilion torii gate",
            "Point your camera to scan the torii gate (or use GPS check-in)"
          ],
          newSteps: [
            { instruction: "Walk to Nonbei Yokocho (Drunkard's Alley)", verifyType: "checkin", hint: "Walk north from Hachiko under the train tracks" },
            { instruction: "Navigate the narrow lane to find the hidden vermilion torii gate", verifyType: "checkin", hint: "Look inside the tiny side corridor" },
            { instruction: "Point your camera to scan the torii gate (or use GPS check-in)", verifyType: "vision", hint: "Aim at the bright red wooden gate" }
          ],
          route: {
            mode: "walking",
            etaMinutes: 2,
            distanceMeters: 150
          },
          walkTime: "2 min walk",
          distance: "150m",
          reward: {
            shards: 150,
            postcardPrompt: "traditional alley lanterns ukiyo-e print",
            badge: "Shrine Seeker"
          },
          rewardXp: 150,
          rewardKakera: 150,
          postcardUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBaNV4LE0_wSZWaiMFTWJ-hKkie0kmxmliDZcWb9q50RzlMn3vR0uB1DgZ0GJYH9mRPriH6mnbMcPtOiBVYaRhX3oE7JnzELGbV2LwOiiZTFGZTMftx2_ZEFIQ1L8RCM75UbJgVQYm7OgKEZ9MzIgpp86m5qfeqSk0vh6AGgJ2P-Lv3jv87pUrNQig59KOdEdiMVZQFzlCiRzTsccnr8yhckr0wAe1SJHJAodzgGcsz2FSSxhlKBw5awPbjdaWFOiujmIp8wD1ncJ6p",
          markerOffsetLeft: 55,
          markerOffsetTop: 45
        }
      ]
    });
  }

  try {
    // 1. Google Maps Grounding to locate landmarks conforming to scale-difficulty rules
    const mapsPrompt = `Find 3 to 5 real landmarks, temples, parks, or historical points of interest in Shibuya, Tokyo within ${maxDistance}m of latitude ${lat}, longitude ${lng} that are ${obscurityPrompt} and suitable for a level ${lvl} player.
    Ensure that none of their placeIds are in this completed list: ${JSON.stringify(completedList)}.
    For each location, return its exact latitude, longitude, official name, and placeId.`;

    const mapsResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: mapsPrompt,
      config: {
        tools: [{ googleMaps: {} }],
      }
    });

    const searchEntryPoint = mapsResponse.candidates?.[0]?.groundingMetadata?.searchEntryPoint;
    const mapsContextToken = searchEntryPoint?.renderedContent || searchEntryPoint?.sdkBlob || "";
    const placesContext = mapsResponse.text || "Shibuya Crossing, Miyashita Park, Nonbei Yokocho";

    // 2. Google Search Grounding to find live facts and generate structured Quest Master response
    const searchPrompt = `You are the Quest Master, a Managed Agent as defined below:

${agentsInstruction}

Using this scale-difficulty skill rules:
${difficultySkill}

We discovered these locations near Shibuya:
${placesContext}

Current Player State:
- Start Latitude: ${lat}, Start Longitude: ${lng}
- Player Level: ${lvl} (Map to difficulty: ${difficultyLabel})
- Active Guide Persona: ${persona}
- Completed Place IDs: ${JSON.stringify(completedList)}
- Party Members IDs: ${JSON.stringify(parties)}

Your task is to:
1. Use Google Search Grounding to obtain live details: hours today, events today, sunset times, or interesting facts for each place.
2. Order them into a walkable route from the player's position (${lat}, ${lng}).
3. Generate 3 to 5 quests. Include a custom narrative hook in-character for guide persona "${persona}".
   Persona guidelines:
   - kohaku: Mischievous, warm-hearted ancient fox-spirit (kitsune). Speaks in short, vivid, slightly playful lines with folklore.
   - sen: Wise, calm, elderly Tea-Master. Quiet, traditional, zen, slow.
   - riku: Shibuya cyber-kid. High-energy, slang, neon, hip, hyped.
4. Scale rewards dynamically according to level ${lvl} and difficulty "${difficultyLabel}" (e.g. 100-200 Kakera/XP).

Return a strict JSON object containing a "quests" array. Each object in "quests" must EXACTLY match the following combined schema to satisfy both the React frontend and the new JSON Quest schema:
{
  "quests": [
    {
      "questId": "string (unique ID, e.g. miyashita_roof)",
      "id": "string (matches questId exactly)",
      "title": "string (creative, thematic title)",
      "description": "string (immersive narrative including the live details and lore found via Google Search)",
      "lore": "string (matches description exactly)",
      "guideIntro": "string (in-character hook dialogue based on persona ${persona})",
      "guideHook": "string (matches guideIntro exactly)",
      "difficulty": "${difficultyLabel}",
      "coop": ${parties.length > 0},
      "startPlace": { "name": "Current Location", "lat": ${lat}, "lng": ${lng} },
      "targetPlace": {
        "name": "string (official landmark name)",
        "placeId": "string (placeId)",
        "lat": number,
        "lng": number,
        "referenceDescription": "string (brief description of physical appearance for vision matching)"
      },
      "locationName": "string (matches targetPlace.name)",
      "latitude": number (matches targetPlace.lat),
      "longitude": number (matches targetPlace.lng),
      "placeId": "string (matches targetPlace.placeId)",
      "steps": [
        "string (Step 1: Walk to targetPlace.name)",
        "string (Step 2: Look for physical landmark)",
        "string (Step 3: Point camera to verify)"
      ],
      "newSteps": [
        { "instruction": "string (Walk to targetPlace.name)", "verifyType": "checkin", "hint": "string" },
        { "instruction": "string (Look for physical landmark)", "verifyType": "checkin", "hint": "string" },
        { "instruction": "string (Point camera to verify)", "verifyType": "vision", "hint": "string" }
      ],
      "route": {
        "mode": "walking",
        "etaMinutes": number (estimated minutes),
        "distanceMeters": number (estimated meters)
      },
      "walkTime": "string (e.g. '5 min walk')",
      "distance": "string (e.g. '300m')",
      "reward": {
        "shards": number (100 to 200),
        "postcardPrompt": "string (thematic prompt describing a serene ukiyo-e woodblock print of this location)",
        "badge": "string or null"
      },
      "rewardXp": number (matches reward.shards),
      "rewardKakera": number (matches reward.shards),
      "postcardUrl": "string (MUST pick from this list of options:
        - https://lh3.googleusercontent.com/aida-public/AB6AXuBaNV4LE0_wSZWaiMFTWJ-hKkie0kmxmliDZcWb9q50RzlMn3vR0uB1DgZ0GJYH9mRPriH6mnbMcPtOiBVYaRhX3oE7JnzELGbV2LwOiiZTFGZTMftx2_ZEFIQ1L8RCM75UbJgVQYm7OgKEZ9MzIgpp86m5qfeqSk0vh6AGgJ2P-Lv3jv87pUrNQig59KOdEdiMVZQFzlCiRzTsccnr8yhckr0wAe1SJHJAodzgGcsz2FSSxhlKBw5awPbjdaWFOiujmIp8wD1ncJ6p
        - https://lh3.googleusercontent.com/aida-public/AB6AXuDCKYAUsXR5C0nygzc1yq37u6zQtX2frcUqg-MPD_4cLk0f2bKdSh0cdA6abmMVKW34E-1X5sIf7XcThToDV6f2gbOTfsCYbIzmBGpL99sgwI5MrhNEQfbqQEDn34Sh0YnW8OqKVv8VfhTL8oRK5B0bhZ9RWyEj04dY8QEA41B-Ik92fqtUevTp6_e6pry715Jkkyc3t0JRUHJq_8igbn42cYRspbSUTMNw8ihCLODQTXUMX3U6SEN4EHIgjm3Bveiu3X9fSi8GWTct
        - https://lh3.googleusercontent.com/aida-public/AB6AXuCyvk3rtmTyES-O160613-N60k-3DruRjXWjzI_uZyKROaTQ-LzXp6GGqSAFR2lKMD8MYbKW4uLDl1O04FWQtOp_W5iKU9QzLfNRupUNG3BNBRxrJSuMd2AfSP0lVUQav9rKeancjubdT9dlqQrwnEVPbPHdFuW5jfQEN5ZI_HK_zKalGcG71je8lZAvVcly3LJ7-QbmUt8pfPFsETIpsvZ0LujQR8udKunO1YnJXzK44a2lrOCo3AjvLF0rMYMbVaBtcXtDAxwUjrg
      )",
      "markerOffsetLeft": number (between 10 and 90),
      "markerOffsetTop": number (between 10 and 90)
    }
  ]
}

Return ONLY the raw, valid JSON conforming to this schema. DO NOT include any markdown code blocks or additional text.`;

    const searchResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: searchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quests: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  questId: { type: Type.STRING },
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  lore: { type: Type.STRING },
                  guideIntro: { type: Type.STRING },
                  guideHook: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  coop: { type: Type.BOOLEAN },
                  startPlace: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      lat: { type: Type.NUMBER },
                      lng: { type: Type.NUMBER }
                    },
                    required: ["name", "lat", "lng"]
                  },
                  targetPlace: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      placeId: { type: Type.STRING },
                      lat: { type: Type.NUMBER },
                      lng: { type: Type.NUMBER },
                      referenceDescription: { type: Type.STRING }
                    },
                    required: ["name", "placeId", "lat", "lng", "referenceDescription"]
                  },
                  locationName: { type: Type.STRING },
                  latitude: { type: Type.NUMBER },
                  longitude: { type: Type.NUMBER },
                  placeId: { type: Type.STRING },
                  steps: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  newSteps: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        instruction: { type: Type.STRING },
                        verifyType: { type: Type.STRING },
                        hint: { type: Type.STRING }
                      },
                      required: ["instruction", "verifyType", "hint"]
                    }
                  },
                  route: {
                    type: Type.OBJECT,
                    properties: {
                      mode: { type: Type.STRING },
                      etaMinutes: { type: Type.INTEGER },
                      distanceMeters: { type: Type.INTEGER }
                    },
                    required: ["mode", "etaMinutes", "distanceMeters"]
                  },
                  walkTime: { type: Type.STRING },
                  distance: { type: Type.STRING },
                  reward: {
                    type: Type.OBJECT,
                    properties: {
                      shards: { type: Type.INTEGER },
                      postcardPrompt: { type: Type.STRING },
                      badge: { type: Type.STRING }
                    },
                    required: ["shards", "postcardPrompt"]
                  },
                  rewardXp: { type: Type.INTEGER },
                  rewardKakera: { type: Type.INTEGER },
                  postcardUrl: { type: Type.STRING },
                  markerOffsetLeft: { type: Type.INTEGER },
                  markerOffsetTop: { type: Type.INTEGER }
                },
                required: [
                  "questId", "id", "title", "description", "lore", 
                  "guideIntro", "guideHook", "difficulty", "coop", 
                  "startPlace", "targetPlace", "locationName", 
                  "latitude", "longitude", "placeId", "steps", 
                  "newSteps", "route", "walkTime", "distance", 
                  "reward", "rewardXp", "rewardKakera", "postcardUrl", 
                  "markerOffsetLeft", "markerOffsetTop"
                ]
              }
            }
          },
          required: ["quests"]
        }
      }
    });

    const textResult = searchResponse.text;
    if (!textResult) {
      throw new Error("Empty search response text");
    }

    const parsedData = JSON.parse(textResult);

    // Inject mapsContextToken into every generated quest so details screen can display interactive maps widget
    if (parsedData.quests && Array.isArray(parsedData.quests)) {
      parsedData.quests = parsedData.quests.map((q: any) => ({
        ...q,
        mapsContextToken: mapsContextToken || ""
      }));
    }

    return res.json(parsedData);

  } catch (error) {
    console.error("Error generating maps-grounded quests:", error);
    // Graceful fallback to static list
    return res.json({
      quests: [
        {
          questId: "hachiko_fallback",
          id: "hachiko_fallback",
          title: "The Loyal Guardian",
          description: "Meet the faithful one who still keeps vigil at the gates of the modern world. Open daily, 24/7. Crowded in the evenings around 18:00 - 20:00.",
          lore: "Meet the faithful one who still keeps vigil at the gates of the modern world. Open daily, 24/7. Crowded in the evenings around 18:00 - 20:00.",
          guideIntro: "There's a companion waiting where the crowds flow deepest. Look beneath the sakura trees.",
          guideHook: "There's a companion waiting where the crowds flow deepest. Look beneath the sakura trees.",
          difficulty: difficultyLabel,
          coop: parties.length > 0,
          startPlace: { name: "Current Location", lat, lng },
          targetPlace: {
            name: "Shibuya Crossing Plaza",
            placeId: "ChIJ_yV8N6KMGARREw_65GvL-AI",
            lat: 35.6585,
            lng: 139.7013,
            referenceDescription: "Bronze Hachiko Dog Statue"
          },
          locationName: "Shibuya Crossing Plaza",
          latitude: 35.6585,
          longitude: 139.7013,
          placeId: "ChIJ_yV8N6KMGARREw_65GvL-AI",
          steps: [
            "Walk to the Shibuya Station Hachiko Exit Plaza",
            "Find the bronze statue of Hachiko near the old green train car",
            "Scan Hachiko (or use GPS check-in) to earn your postcard"
          ],
          newSteps: [
            { instruction: "Walk to the Shibuya Station Hachiko Exit Plaza", verifyType: "checkin", hint: "Look for the green train car" },
            { instruction: "Find the bronze statue of Hachiko near the old green train car", verifyType: "checkin", hint: "It is close to the crossing" },
            { instruction: "Scan Hachiko (or use GPS check-in) to earn your postcard", verifyType: "vision", hint: "Align Hachiko in the camera reticle" }
          ],
          route: {
            mode: "walking",
            etaMinutes: 1,
            distanceMeters: 50
          },
          walkTime: "1 min walk",
          distance: "50m",
          reward: {
            shards: 100,
            postcardPrompt: "ukiyo-e print of Hachiko dog statue, cherry blossoms",
            badge: "Shibuya Initiate"
          },
          rewardXp: 100,
          rewardKakera: 100,
          postcardUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDCKYAUsXR5C0nygzc1yq37u6zQtX2frcUqg-MPD_4cLk0f2bKdSh0cdA6abmMVKW34E-1X5sIf7XcThToDV6f2gbOTfsCYbIzmBGpL99sgwI5MrhNEQfbqQEDn34Sh0YnW8OqKVv8VfhTL8oRK5B0bhZ9RWyEj04dY8QEA41B-Ik92fqtUevTp6_e6pry715Jkkyc3t0JRUHJq_8igbn42cYRspbSUTMNw8ihCLODQTXUMX3U6SEN4EHIgjm3Bveiu3X9fSi8GWTct",
          markerOffsetLeft: 45,
          markerOffsetTop: 55
        },
        {
          questId: "neon_shrine_fallback",
          id: "neon_shrine_fallback",
          title: "The Neon Shrine",
          description: "Hidden between the glow of digital billboards lies a sanctuary of old spirits. Open daily. Peak hours are 19:00 - 23:00.",
          lore: "Hidden between the glow of digital billboards lies a sanctuary of old spirits. Open daily. Peak hours are 19:00 - 23:00.",
          guideIntro: "Smell that? Curry pan, three streets over. There's a shrine behind that shop...",
          guideHook: "Smell that? Curry pan, three streets over. There's a shrine behind that shop...",
          difficulty: difficultyLabel,
          coop: parties.length > 0,
          startPlace: { name: "Current Location", lat, lng },
          targetPlace: {
            name: "Nonbei Yokocho (Drunkard's Alley)",
            placeId: "ChIJ8yMKN6KMGARRE_vW4qgS9fE",
            lat: 35.6596,
            lng: 139.7019,
            referenceDescription: "Vermilion torii gate of the small shrine"
          },
          locationName: "Nonbei Yokocho (Drunkard's Alley)",
          latitude: 35.6596,
          longitude: 139.7019,
          placeId: "ChIJ8yMKN6KMGARRE_vW4qgS9fE",
          steps: [
            "Walk to Nonbei Yokocho (Drunkard's Alley)",
            "Navigate the narrow lane to find the hidden vermilion torii gate",
            "Point your camera to scan the torii gate (or use GPS check-in)"
          ],
          newSteps: [
            { instruction: "Walk to Nonbei Yokocho (Drunkard's Alley)", verifyType: "checkin", hint: "Walk north from Hachiko under the train tracks" },
            { instruction: "Navigate the narrow lane to find the hidden vermilion torii gate", verifyType: "checkin", hint: "Look inside the tiny side corridor" },
            { instruction: "Point your camera to scan the torii gate (or use GPS check-in)", verifyType: "vision", hint: "Aim at the bright red wooden gate" }
          ],
          route: {
            mode: "walking",
            etaMinutes: 2,
            distanceMeters: 150
          },
          walkTime: "2 min walk",
          distance: "150m",
          reward: {
            shards: 150,
            postcardPrompt: "traditional alley lanterns ukiyo-e print",
            badge: "Shrine Seeker"
          },
          rewardXp: 150,
          rewardKakera: 150,
          postcardUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBaNV4LE0_wSZWaiMFTWJ-hKkie0kmxmliDZcWb9q50RzlMn3vR0uB1DgZ0GJYH9mRPriH6mnbMcPtOiBVYaRhX3oE7JnzELGbV2LwOiiZTFGZTMftx2_ZEFIQ1L8RCM75UbJgVQYm7OgKEZ9MzIgpp86m5qfeqSk0vh6AGgJ2P-Lv3jv87pUrNQig59KOdEdiMVZQFzlCiRzTsccnr8yhckr0wAe1SJHJAodzgGcsz2FSSxhlKBw5awPbjdaWFOiujmIp8wD1ncJ6p",
          markerOffsetLeft: 55,
          markerOffsetTop: 45
        }
      ]
    });
  }
});

// API Route: Generate Postcard (Native Image Generation)
app.post("/api/generate-postcard", async (req, res) => {
  const { place, district } = req.body;
  if (!place) {
    return res.status(400).json({ error: "Missing place parameter" });
  }

  const resolvedDistrict = district || "Shibuya";
  const prompt = `A serene ukiyo-e woodblock print of ${place} in ${resolvedDistrict}, Tokyo. Traditional Japanese aesthetic, indigo and vermilion palette, lantern light, no text.`;

  if (!ai) {
    console.warn("Gemini client is not initialized. Returning fallback postcard image.");
    return res.json({
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBaNV4LE0_wSZWaiMFTWJ-hKkie0kmxmliDZcWb9q50RzlMn3vR0uB1DgZ0GJYH9mRPriH6mnbMcPtOiBVYaRhX3oE7JnzELGbV2LwOiiZTFGZTMftx2_ZEFIQ1L8RCM75UbJgVQYm7OgKEZ9MzIgpp86m5qfeqSk0vh6AGgJ2P-Lv3jv87pUrNQig59KOdEdiMVZQFzlCiRzTsccnr8yhckr0wAe1SJHJAodzgGcsz2FSSxhlKBw5awPbjdaWFOiujmIp8wD1ncJ6p"
    });
  }

  try {
    // Generate ukiyo-e collectible using gemini-2.5-flash-image (Nano Banana image model)
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    let imageUrl = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          imageUrl = `data:image/png;base64,${base64EncodeString}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      throw new Error("No image data found in response parts");
    }

    return res.json({ imageUrl });

  } catch (error) {
    console.error("Error generating native ukiyo-e postcard:", error);
    // Fallback to static ukiyo-e list to ensure graceful UX
    return res.json({
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDCKYAUsXR5C0nygzc1yq37u6zQtX2frcUqg-MPD_4cLk0f2bKdSh0cdA6abmMVKW34E-1X5sIf7XcThToDV6f2gbOTfsCYbIzmBGpL99sgwI5MrhNEQfbqQEDn34Sh0YnW8OqKVv8VfhTL8oRK5B0bhZ9RWyEj04dY8QEA41B-Ik92fqtUevTp6_e6pry715Jkkyc3t0JRUHJq_8igbn42cYRspbSUTMNw8ihCLODQTXUMX3U6SEN4EHIgjm3Bveiu3X9fSi8GWTct"
    });
  }
});

// API Route: Dynamic Quest Generation for a Place
app.post("/api/generate-quest-for-place", async (req, res) => {
  const { placeName, latitude, longitude, description, placeId } = req.body;
  
  if (!placeName) {
    return res.status(400).json({ error: "Missing placeName" });
  }

  if (!ai) {
    return res.json({
      quest: {
        id: "dynamic_" + Date.now(),
        title: `Venture to ${placeName}`,
        description: description || `Discover the mystical presence hidden at ${placeName}.`,
        locationName: placeName,
        latitude: latitude || 35.6580,
        longitude: longitude || 139.7013,
        guideHook: `My senses are tingling... there is something ancient waiting for us at ${placeName}.`,
        steps: [
          `Navigate towards ${placeName}`,
          `Find the entrance or main gate of the location`,
          `Scan the landmark with your camera to complete`
        ],
        walkTime: "5 min walk",
        distance: "300m",
        rewardXp: 120,
        rewardKakera: 125,
        postcardUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBaNV4LE0_wSZWaiMFTWJ-hKkie0kmxmliDZcWb9q50RzlMn3vR0uB1DgZ0GJYH9mRPriH6mnbMcPtOiBVYaRhX3oE7JnzELGbV2LwOiiZTFGZTMftx2_ZEFIQ1L8RCM75UbJgVQYm7OgKEZ9MzIgpp86m5qfeqSk0vh6AGgJ2P-Lv3jv87pUrNQig59KOdEdiMVZQFzlCiRzTsccnr8yhckr0wAe1SJHJAodzgGcsz2FSSxhlKBw5awPbjdaWFOiujmIp8wD1ncJ6p",
        placeId: placeId || ""
      }
    });
  }

  try {
    const prompt = `Generate a creative location-based game quest for the location: "${placeName}".
Coordinates: Lat ${latitude || 35.6580}, Lng ${longitude || 139.7013}.
Description/Context: ${description || "A recommended landmark in Tokyo"}.

Generate a complete, structured Quest JSON object conforming exactly to this schema:
{
  "title": "creative thematic title of the quest",
  "description": "immersive description of the quest incorporating historical lore or interesting facts",
  "guideHook": "a short mystical hook/hint from the spirit guide",
  "steps": [
    "Step 1: Walk to X",
    "Step 2: Find Y",
    "Step 3: Scan Z with camera to complete"
  ],
  "walkTime": "e.g. '8 min walk'",
  "distance": "e.g. '500m'",
  "rewardXp": 150,
  "rewardKakera": 150
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            guideHook: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            walkTime: { type: Type.STRING },
            distance: { type: Type.STRING },
            rewardXp: { type: Type.INTEGER },
            rewardKakera: { type: Type.INTEGER }
          },
          required: ["title", "description", "guideHook", "steps", "walkTime", "distance", "rewardXp", "rewardKakera"]
        }
      }
    });

    const result = JSON.parse(response.text);

    const postcards = [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBaNV4LE0_wSZWaiMFTWJ-hKkie0kmxmliDZcWb9q50RzlMn3vR0uB1DgZ0GJYH9mRPriH6mnbMcPtOiBVYaRhX3oE7JnzELGbV2LwOiiZTFGZTMftx2_ZEFIQ1L8RCM75UbJgVQYm7OgKEZ9MzIgpp86m5qfeqSk0vh6AGgJ2P-Lv3jv87pUrNQig59KOdEdiMVZQFzlCiRzTsccnr8yhckr0wAe1SJHJAodzgGcsz2FSSxhlKBw5awPbjdaWFOiujmIp8wD1ncJ6p",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDCKYAUsXR5C0nygzc1yq37u6zQtX2frcUqg-MPD_4cLk0f2bKdSh0cdA6abmMVKW34E-1X5sIf7XcThToDV6f2gbOTfsCYbIzmBGpL99sgwI5MrhNEQfbqQEDn34Sh0YnW8OqKVv8VfhTL8oRK5B0bhZ9RWyEj04dY8QEA41B-Ik92fqtUevTp6_e6pry715Jkkyc3t0JRUHJq_8igbn42cYRspbSUTMNw8ihCLODQTXUMX3U6SEN4EHIgjm3Bveiu3X9fSi8GWTct",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCyvk3rtmTyES-O160613-N60k-3DruRjXWjzI_uZyKROaTQ-LzXp6GGqSAFR2lKMD8MYbKW4uLDl1O04FWQtOp_W5iKU9QzLfNRupUNG3BNBRxrJSuMd2AfSP0lVUQav9rKeancjubdT9dlqQrwnEVPbPHdFuW5jfQEN5ZI_HK_zKalGcG71je8lZAvVcly3LJ7-QbmUt8pfPFsETIpsvZ0LujQR8udKunO1YnJXzK44a2lrOCo3AjvLF0rMYMbVaBtcXtDAxwUjrg"
    ];
    const randPostcard = postcards[Math.floor(Math.random() * postcards.length)];

    return res.json({
      quest: {
        id: "dynamic_" + Date.now(),
        title: result.title,
        description: result.description,
        locationName: placeName,
        latitude: latitude || 35.6580,
        longitude: longitude || 139.7013,
        guideHook: result.guideHook,
        steps: result.steps,
        walkTime: result.walkTime,
        distance: result.distance,
        rewardXp: result.rewardXp,
        rewardKakera: result.rewardKakera,
        postcardUrl: randPostcard,
        placeId: placeId || ""
      }
    });

  } catch (error) {
    console.error("Error generating quest dynamically:", error);
    return res.status(500).json({ error: "Failed to generate dynamic quest" });
  }
});

// API Route: Guide Chat
app.post("/api/guide-chat", async (req, res) => {
  const { message, guideId, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Missing message parameter" });
  }

  if (!ai) {
    const lowerMessage = String(message).toLowerCase();
    const isRamen = lowerMessage.includes("ramen") || lowerMessage.includes("food") || lowerMessage.includes("eat");
    const isSanctuary = lowerMessage.includes("shrine") || lowerMessage.includes("sanctuary") || lowerMessage.includes("quiet");
    const recommendation = isRamen
      ? {
          title: "Ichiran Shibuya",
          label: "LEGENDARY RAMEN",
          rating: "4.4",
          votes: "10k+ travelers",
          distance: "450m away",
          description: "A focused tonkotsu ramen booth experience near the Shibuya flow — perfect for a quick food quest.",
          latitude: 35.6609,
          longitude: 139.6999,
          placeId: "demo-ichiran-shibuya"
        }
      : isSanctuary
        ? {
            title: "Konno Hachimangu Shrine",
            label: "QUIET SANCTUARY",
            rating: "4.3",
            votes: "1k+ pilgrims",
            distance: "900m away",
            description: "A calmer shrine tucked beyond Shibuya's neon pressure, ideal for a reflective spirit quest.",
            latitude: 35.6556,
            longitude: 139.7045,
            placeId: "demo-konno-hachimangu"
          }
        : null;

    return res.json({
      reply: recommendation
        ? `[Fallback Mode] My live Maps thread is sleeping, but Kohaku still has a judge-safe lead: ${recommendation.title}. I can shape this into a quest right now.`
        : `[Fallback Mode] Oh, my ethereal voice is a bit muffled without our key connection! But I hear you whisper: "${message}". Keep walking, traveler!`,
      recommendation
    });
  }

  try {
    const selectedGuideId = guideId || "kohaku";
    const guideName = selectedGuideId === "sen" ? "Sen" : selectedGuideId === "riku" ? "Riku" : "Kohaku";
    
    let baseInstruction = "";
    if (selectedGuideId === "sen") {
      baseInstruction = "You are Sen, a wise, calm, elderly Tea-Master guide of Tokyo. You speak slowly, poetically, and focus on zen, mindfulness, traditional gardens, tea ceremonies, and quiet hidden places. Keep your answers brief, warm, and highly visual.";
    } else if (selectedGuideId === "riku") {
      baseInstruction = "You are Riku, a high-energy cyber-kid guide who lives in Shibuya. You speak with high hype, slang, tech references, and love neon, arcade spots, underground music, and fast food. Keep your answers brief, hyped, and interactive.";
    } else {
      baseInstruction = "You are Kohaku, a playful, mischievous ancient fox-spirit (kitsune) guide of Shibuya. You love food (especially curry pan and inari sushi), secrets, and playful teasing of the traveler. You are incredibly knowledgeable about Shibuya's history, secret alleys, and spiritual energy. Keep your answers brief, playful, and charming.";
    }

    const systemInstruction = `${baseInstruction}

Your task is to engage in a friendly, immersive conversation with the traveler.
You are grounded in Google Maps. If the user asks for recommendations of places, foods, shrines, or spots, you MUST recommend exactly ONE real place in Tokyo.
Return a structured JSON object containing your conversational reply and the recommended place details.

Output MUST conform strictly to this JSON schema:
{
  "reply": "Your in-character spoken response (1-3 sentences) introducing or describing the recommendation or answering the user.",
  "recommendation": null // Or set to an object if recommending a place
}

If recommending a place, the recommendation object must look like this:
{
  "title": "Official name of the place",
  "label": "e.g. SPIRITUAL SANCTUARY, LEGENDARY RAMEN, RETRO ARCADE, ZEN GARDEN",
  "rating": "e.g. 4.7",
  "votes": "e.g. 1.1k souls",
  "distance": "e.g. 350m away",
  "description": "Short flavor text recommending the place",
  "latitude": 35.6580, // Real or estimated latitude
  "longitude": 139.7013, // Real or estimated longitude
  "placeId": "ChIJ..." // Real place ID or estimated
}

Do not include any markdown format or surrounding text outside of the raw JSON.`;

    // Format simple history for chat
    const formattedContents = [];
    if (history && Array.isArray(history)) {
      for (const item of history) {
        // Guard against objects
        const textVal = typeof item.text === "string" ? item.text : JSON.stringify(item.text);
        formattedContents.push({
          role: item.role === "user" ? "user" : "model",
          parts: [{ text: textVal }]
        });
      }
    }
    // Add current message
    formattedContents.push({
      role: "user",
      parts: [{ text: message }]
    });

    // Run Gemini 3.5 Flash with googleMaps grounding tool!
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
        maxOutputTokens: 600,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            recommendation: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                label: { type: Type.STRING },
                rating: { type: Type.STRING },
                votes: { type: Type.STRING },
                distance: { type: Type.STRING },
                description: { type: Type.STRING },
                latitude: { type: Type.NUMBER },
                longitude: { type: Type.NUMBER },
                placeId: { type: Type.STRING }
              },
              required: ["title", "label", "rating", "description", "latitude", "longitude", "placeId"]
            }
          },
          required: ["reply"]
        },
        tools: [{ googleMaps: {} }]
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text from Gemini");
    }

    const parsedResult = JSON.parse(resultText);

    // Extract Maps grounding links if any
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    let mapsUri = "";
    if (groundingChunks && Array.isArray(groundingChunks)) {
      for (const chunk of groundingChunks) {
        if (chunk.maps?.uri) {
          mapsUri = chunk.maps.uri;
          break;
        }
      }
    }

    // Attach mapsUri if present
    if (parsedResult.recommendation && mapsUri) {
      parsedResult.recommendation.mapsUri = mapsUri;
    }

    return res.json(parsedResult);

  } catch (error) {
    console.error("Guide chat error with maps grounding:", error);
    return res.json({
      reply: `My ethereal pathways are a bit cluttered by digital noise right now, but I'm still right here with you! Let's keep exploring!`,
      recommendation: null
    });
  }
});

// Vite & Static file handler
async function startServer() {
  // 1. Serve landing page at "/"
  app.get("/", (req, res) => {
    if (process.env.NODE_ENV !== "production") {
      res.sendFile(path.join(process.cwd(), "public/landing.html"));
    } else {
      res.sendFile(path.join(process.cwd(), "dist/landing.html"));
    }
  });

  // 2. App routing for "/app"
  app.get("/app", (req, res, next) => {
    if (process.env.NODE_ENV !== "production") {
      // In development, let Vite's dev server handle serving the SPA
      next();
    } else {
      // In production, serve the compiled index.html
      res.sendFile(path.join(process.cwd(), "dist/index.html"));
    }
  });

  if (process.env.NODE_ENV !== "production") {
    // Development Mode using Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode serving compiled static files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { index: false }));
    
    app.get("/app*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Meguri Express server running on port ${PORT}`);
  });
}

startServer();
