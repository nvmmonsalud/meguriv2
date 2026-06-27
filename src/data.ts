import { Guide, Quest } from "./types";

export const GUIDES: Guide[] = [
  {
    id: "kohaku",
    name: "Kohaku",
    title: "Fox-Spirit",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuClmCybrszQq5EkH6eywFNsqr3D6_U0RNA846sv3Lv9LMF5QXiJeQka-POlsINFSwFbLmwPpRFCgETYtKKK55gd6VcYG6ZzlwWbNXTiMEwWUSoMi10zcvtUAeiAKFgXawtE_fA-anWPYmWIi1r98qgwScsAgjT0CSZGxPgvLbg1G7-C4yIjZ0cak21xSLSP1mjtRb6qmnk5lO3h5alEQzt8trFsT28TZgICafWjLHd_FRVQm-OhnmnsFoiJ61OCgCWspR08j5EdGYmo",
    description: "Playful, mischievous, knows every hidden alley.",
    voice: "PLAYFUL",
    quote: "Smell that? Curry pan, three streets over. There's a shrine behind that shop..."
  },
  {
    id: "sen",
    name: "Sen",
    title: "Tea-Master",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgsDTAz60XUo1dvlJVnyd61O3jWULakrKy7z9yy-K20Zfvd6xr5nYli7YjBWmpQTY_CYAWrJxWUqL74QoK0ZqiYZH_-L6hsnmiq3efOb1QBTEIBTK1wUXRN7qGZz48K4X37KpFs3y0KWqwEuvBBLiQDg59l9RmIvKCxqSD5a5GO-mcQ_3nz1p9vIONv5FXvlncWyWp21ZAtqMcNReovwMAKaQRSJ-IgnNtL5hXYrFueZW0fxWj0Jijqj0FETEV5i3GEpJUlTyhojL_",
    description: "Calm, slow, finds beauty in quiet corners.",
    voice: "ZEN",
    quote: "Pouring tea is like watching time flow. Walk slowly; the pavement has stories to tell."
  },
  {
    id: "riku",
    name: "Riku",
    title: "Shibuya Kid",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBK4neR4QOwKmKWbEPv4uf_7n09Us7UInkdlHjUT2-qfrGRIKQNQqDm8pha8W1TrfYgkJjKIwqzGwNMBb7kwmN20lEp7oisCyRVa_UTVq8hJE-NjtbLfXchOz1FnkvT7QokKzZlt3SxmEt37_Ba7DUfKJB4MQHgKMY5eMwXCllwEpflJoZ-3PEpaCMRc62_i2Hcf29icfMBbd-cnzrtL1yX5l60qYRLISBOG3IM8DRKMGnbkOU9h2fbvtDq7Ca-COEn8QS8KLkXgevL",
    description: "Hype, fast, lives for neon and nightlife.",
    voice: "HYPE",
    quote: "Listen to that beat! This city is breathing and it wants us to run!"
  }
];

export const QUESTS: Quest[] = [
  {
    id: "hachiko",
    title: "The Loyal Guardian",
    description: "Meet the faithful one who still keeps vigil at the gates of the modern world. Stand where millions cross, but see the single faithful heart.",
    locationName: "Shibuya Crossing Plaza",
    latitude: 35.6585,
    longitude: 139.7013,
    guideHook: "There's a bronze companion waiting where the crowds flow deepest. Look beneath the sakura trees.",
    steps: [
      "Walk to the Shibuya Station Hachiko Exit Plaza",
      "Find the bronze statue of Hachiko near the old green train car",
      "Scan Hachiko (or use GPS check-in) to earn your postcard"
    ],
    walkTime: "1 min walk",
    distance: "50m",
    rewardXp: 100,
    rewardKakera: 100,
    postcardUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDCKYAUsXR5C0nygzc1yq37u6zQtX2frcUqg-MPD_4cLk0f2bKdSh0cdA6abmMVKW34E-1X5sIf7XcThToDV6f2gbOTfsCYbIzmBGpL99sgwI5MrhNEQfbqQEDn34Sh0YnW8OqKVv8VfhTL8oRK5B0bhZ9RWyEj04dY8QEA41B-Ik92fqtUevTp6_e6pry715Jkkyc3t0JRUHJq_8igbn42cYRspbSUTMNw8ihCLODQTXUMX3U6SEN4EHIgjm3Bveiu3X9fSi8GWTct",
    markerOffsetLeft: 45,
    markerOffsetTop: 55
  },
  {
    id: "neon_shrine",
    title: "The Neon Shrine",
    description: "Hidden between the glow of digital billboards lies a sanctuary of old spirits. Find the torii that pulses with electric light.",
    locationName: "Nonbei Yokocho (Drunkard's Alley)",
    latitude: 35.6596,
    longitude: 139.7019,
    guideHook: "Smell that? Curry pan, three streets over. There's a shrine behind that shop...",
    steps: [
      "Walk to Nonbei Yokocho (Drunkard's Alley)",
      "Navigate the narrow lane to find the hidden vermilion torii gate",
      "Point your camera to scan the torii gate (or use GPS check-in)"
    ],
    walkTime: "2 min walk",
    distance: "150m",
    rewardXp: 150,
    rewardKakera: 150,
    postcardUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBaNV4LE0_wSZWaiMFTWJ-hKkie0kmxmliDZcWb9q50RzlMn3vR0uB1DgZ0GJYH9mRPriH6mnbMcPtOiBVYaRhX3oE7JnzELGbV2LwOiiZTFGZTMftx2_ZEFIQ1L8RCM75UbJgVQYm7OgKEZ9MzIgpp86m5qfeqSk0vh6AGgJ2P-Lv3jv87pUrNQig59KOdEdiMVZQFzlCiRzTsccnr8yhckr0wAe1SJHJAodzgGcsz2FSSxhlKBw5awPbjdaWFOiujmIp8wD1ncJ6p",
    markerOffsetLeft: 55,
    markerOffsetTop: 45
  },
  {
    id: "moyai",
    title: "The Wind-Swept Monolith",
    description: "On the western plazas of Shibuya, a giant stone face carved by wind and sea watches commuters pass. Find the island spirit in the concrete canyon.",
    locationName: "Shibuya Station West Plaza",
    latitude: 35.6580,
    longitude: 139.7005,
    guideHook: "On the western shore, a massive stone face carved by sea breeze is waiting. Look for the Easter Island spirit.",
    steps: [
      "Walk to the Shibuya Station West Exit Plaza",
      "Locate the giant stone Moyai Statue",
      "Scan the face of the monolith with your camera (or check in)"
    ],
    walkTime: "3 min walk",
    distance: "220m",
    rewardXp: 120,
    rewardKakera: 120,
    postcardUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCyvk3rtmTyES-O160613-N60k-3DruRjXWjzI_uZyKROaTQ-LzXp6GGqSAFR2lKMD8MYbKW4uLDl1O04FWQtOp_W5iKU9QzLfNRupUNG3BNBRxrJSuMd2AfSP0lVUQav9rKeancjubdT9dlqQrwnEVPbPHdFuW5jfQEN5ZI_HK_zKalGcG71je8lZAvVcly3LJ7-QbmUt8pfPFsETIpsvZ0LujQR8udKunO1YnJXzK44a2lrOCo3AjvLF0rMYMbVaBtcXtDAxwUjrg",
    markerOffsetLeft: 20,
    markerOffsetTop: 65
  }
];
