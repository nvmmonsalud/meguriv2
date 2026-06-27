export interface Quest {
  id: string;
  title: string;
  description: string;
  locationName: string;
  latitude: number;
  longitude: number;
  guideHook: string;
  steps: string[];
  walkTime: string;
  distance: string;
  rewardXp: number;
  rewardKakera: number;
  postcardUrl: string;
  markerOffsetLeft: number; // For rendering on custom interactive stylized map
  markerOffsetTop: number;
  mapsContextToken?: string;
  placeId?: string;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  targetType: "complete_quest" | "chat_guide" | "visit_any" | "generate_quest";
  targetId?: string; // e.g., Associated standard quest ID
  rewardXp: number;
  rewardKakera: number;
  completed: boolean;
}

export interface Player {
  id: string;
  name: string;
  guideId: string;
  xp: number;
  level: number;
  kakera: number;
  partyId?: string;
  visitedLocations: string[]; // List of completed quest IDs
  lastActive: string;
  latitude: number;
  longitude: number;
  lastDailyReset?: string; // ISO 8601 string
  dailyQuests?: DailyQuest[];
}

export interface PassportItem {
  id: string;
  questId: string;
  title: string;
  locationName: string;
  imageUrl: string;
  unlockedAt: string;
  spiritMessage: string;
}

export interface PartyMember {
  id: string;
  name: string;
  avatar: string;
  guideId: string;
  lat: number;
  lng: number;
  isHost: boolean;
  status: "idle" | "in-quest" | "completed";
}

export interface Party {
  id: string;
  name: string;
  leaderId: string;
  members: PartyMember[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderAvatar: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Guide {
  id: string;
  name: string;
  title: string;
  avatar: string;
  description: string;
  voice: string;
  quote: string;
}
