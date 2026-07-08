import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Map, Compass, BookOpen, Sparkles, Users } from "lucide-react";

import { Player, Quest, Guide, PassportItem, Party, DailyQuest } from "./types";
import { GUIDES, QUESTS } from "./data";
import { db, initializeUserAuth, handleFirestoreError, OperationType } from "./lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs, addDoc } from "firebase/firestore";
import LevelUpModal from "./components/LevelUpModal";

const DAILY_QUEST_TEMPLATES = [
  {
    id: "dq_hachiko",
    title: "Vigil of Hachiko",
    description: "Pay respects at the bronze Hachiko Statue near Shibuya Crossing Plaza",
    targetType: "complete_quest" as const,
    targetId: "hachiko",
    rewardXp: 80,
    rewardKakera: 50
  },
  {
    id: "dq_neon_shrine",
    title: "Neon Sanctuaries",
    description: "Scan the glowing torii at the hidden Neon Shrine in Nonbei Yokocho",
    targetType: "complete_quest" as const,
    targetId: "neon_shrine",
    rewardXp: 80,
    rewardKakera: 50
  },
  {
    id: "dq_moyai",
    title: "Western Face",
    description: "Locate the wind-swept stone Moyai monolith on Shibuya's west plaza",
    targetType: "complete_quest" as const,
    targetId: "moyai",
    rewardXp: 80,
    rewardKakera: 50
  },
  {
    id: "dq_chat_guide",
    title: "Guide's Counsel",
    description: "Seek direction by chatting with your AI Spirit Guide",
    targetType: "chat_guide" as const,
    rewardXp: 50,
    rewardKakera: 30
  },
  {
    id: "dq_generate_quest",
    title: "Weave the Unseen",
    description: "Whisper to your guide to find or carve a new location quest",
    targetType: "generate_quest" as const,
    rewardXp: 60,
    rewardKakera: 40
  },
  {
    id: "dq_visit_any",
    title: "Wandering Soul",
    description: "Safely check-in at any Shibuya mystery point",
    targetType: "visit_any" as const,
    rewardXp: 70,
    rewardKakera: 40
  }
];

function generateDailyQuests(): DailyQuest[] {
  const shuffled = [...DAILY_QUEST_TEMPLATES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3).map(q => ({
    ...q,
    completed: false
  }));
}

function shouldResetDailyQuests(lastResetStr?: string): boolean {
  if (!lastResetStr) return true;
  const lastReset = new Date(lastResetStr).getTime();
  const now = new Date().getTime();
  const diffHours = (now - lastReset) / (1000 * 60 * 60);
  return diffHours >= 24;
}

// UI Modular Screen Imports
import GuideOnboarding from "./components/GuideOnboarding";
import ShibuyaMap from "./components/ShibuyaMap";
import QuestDetails from "./components/QuestDetails";
import ActiveQuestCam from "./components/ActiveQuestCam";
import QuestComplete from "./components/QuestComplete";
import TokyoPassport from "./components/TokyoPassport";
import SocialHub from "./components/SocialHub";
import GuideChat from "./components/GuideChat";

type ScreenTab = "map" | "quests" | "archive" | "guide" | "social";

function isDemoModeEnabled() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("demo") === "true" || import.meta.env.VITE_DEMO_MODE === "true";
}

export default function App() {
  const demoMode = isDemoModeEnabled();
  const [onboarded, setOnboarded] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [guide, setGuide] = useState<Guide | null>(null);
  
  // Navigation & Details States
  const [currentTab, setCurrentTab] = useState<ScreenTab>("map");
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [showActiveCam, setShowActiveCam] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  
  // Realtime Database / State variables
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);
  const [passportItems, setPassportItems] = useState<PassportItem[]>([]);
  const [currentParty, setCurrentParty] = useState<Party | null>(null);
  
  // Dynamic generated quests state
  const [quests, setQuests] = useState<Quest[]>(QUESTS);
  const [isGeneratingQuests, setIsGeneratingQuests] = useState(false);
  const [isGeneratingPostcard, setIsGeneratingPostcard] = useState(false);
  const [dynamicPostcardUrl, setDynamicPostcardUrl] = useState<string | null>(null);

  // Daily quests toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Level Up modal state
  const [levelUpToShow, setLevelUpToShow] = useState<number | null>(null);
  const prevLevelRef = useRef<number | null>(null);

  useEffect(() => {
    if (player) {
      if (prevLevelRef.current !== null && player.level > prevLevelRef.current) {
        setLevelUpToShow(player.level);
      }
      prevLevelRef.current = player.level;
    }
  }, [player?.level]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(prev => prev === message ? null : prev);
    }, 4500);
  };

  // Read player profile from local cache first for instant boot feeling
  useEffect(() => {
    const cachedName = localStorage.getItem("meguri_player_name");
    const cachedGuideId = localStorage.getItem("meguri_player_guide_id");

    if (demoMode) {
      const selectedGuide = GUIDES[0];
      const demoPlayer: Player = {
        id: "demo-judge",
        name: "Judge",
        guideId: selectedGuide.id,
        xp: 450,
        level: 12,
        kakera: 128,
        visitedLocations: [],
        lastActive: new Date().toISOString(),
        latitude: 35.6580,
        longitude: 139.7013,
        lastDailyReset: new Date().toISOString(),
        dailyQuests: generateDailyQuests()
      };
      setGuide(selectedGuide);
      setPlayer(demoPlayer);
      setCompletedQuests([]);
      setPassportItems([]);
      setQuests(QUESTS);
      setOnboarded(true);
      showToast("Demo Mode: judge-safe route loaded with Kohaku and Shibuya quests.");
      return;
    }
    
    if (cachedName && cachedGuideId) {
      const selectedGuide = GUIDES.find(g => g.id === cachedGuideId) || GUIDES[0];
      setGuide(selectedGuide);
      
      const mockPlayer: Player = {
        id: localStorage.getItem("meguri_local_player_id") || "guest",
        name: cachedName,
        guideId: cachedGuideId,
        xp: parseInt(localStorage.getItem("meguri_player_xp") || "450", 10),
        level: parseInt(localStorage.getItem("meguri_player_level") || "12", 10),
        kakera: parseInt(localStorage.getItem("meguri_player_kakera") || "128", 10),
        visitedLocations: JSON.parse(localStorage.getItem("meguri_player_completed") || "[]"),
        lastActive: new Date().toISOString(),
        latitude: 35.6580,
        longitude: 139.7013,
        lastDailyReset: localStorage.getItem("meguri_player_last_daily_reset") || undefined,
        dailyQuests: localStorage.getItem("meguri_player_daily_quests") ? JSON.parse(localStorage.getItem("meguri_player_daily_quests")!) : undefined
      };
      
      setPlayer(mockPlayer);
      setCompletedQuests(mockPlayer.visitedLocations);
      setOnboarded(true);
      
      // Load real Firestore sync asynchronously
      syncFirestoreData(mockPlayer.id, mockPlayer);
    }
  }, []);

  // Async Firestore Profile Fetch and Synchronization
  const syncFirestoreData = async (playerId: string, defaultPlayer: Player) => {
    try {
      const playerDocRef = doc(db, "players", playerId);
      let docSnap;
      try {
        docSnap = await getDoc(playerDocRef);
      } catch (getErr) {
        handleFirestoreError(getErr, OperationType.GET, `players/${playerId}`);
      }

      let firestorePlayer: Player;
      if (docSnap && docSnap.exists()) {
        firestorePlayer = docSnap.data() as Player;
      } else {
        firestorePlayer = defaultPlayer;
      }

      // Check and refresh daily quests
      if (!firestorePlayer.lastDailyReset || shouldResetDailyQuests(firestorePlayer.lastDailyReset)) {
        firestorePlayer.lastDailyReset = new Date().toISOString();
        firestorePlayer.dailyQuests = generateDailyQuests();
        
        try {
          await setDoc(playerDocRef, firestorePlayer);
        } catch (setErr) {
          handleFirestoreError(setErr, OperationType.WRITE, `players/${playerId}`);
        }
      }

      setPlayer(firestorePlayer);
      setCompletedQuests(firestorePlayer.visitedLocations || []);
      
      // Cache locally for fast boots
      localStorage.setItem("meguri_player_xp", firestorePlayer.xp.toString());
      localStorage.setItem("meguri_player_level", firestorePlayer.level.toString());
      localStorage.setItem("meguri_player_kakera", firestorePlayer.kakera.toString());
      localStorage.setItem("meguri_player_completed", JSON.stringify(firestorePlayer.visitedLocations || []));
      if (firestorePlayer.lastDailyReset) {
        localStorage.setItem("meguri_player_last_daily_reset", firestorePlayer.lastDailyReset);
      }
      if (firestorePlayer.dailyQuests) {
        localStorage.setItem("meguri_player_daily_quests", JSON.stringify(firestorePlayer.dailyQuests));
      }

      // Sync passport subcollection postcards
      let passportSnap;
      try {
        passportSnap = await getDocs(collection(db, "players", playerId, "passport"));
      } catch (listErr) {
        handleFirestoreError(listErr, OperationType.LIST, `players/${playerId}/passport`);
      }
      
      const items: PassportItem[] = [];
      if (passportSnap) {
        passportSnap.forEach((doc) => {
          items.push(doc.data() as PassportItem);
        });
      }
      setPassportItems(items);

    } catch (err) {
      console.warn("Firestore sync deferred (operating securely on local state):", err);
    }
  };

  const fetchQuests = async (lat?: number, lng?: number) => {
    setIsGeneratingQuests(true);
    try {
      const targetLat = lat || player?.latitude || 35.6580;
      const targetLng = lng || player?.longitude || 139.7013;
      
      const response = await fetch("/api/generate-quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: targetLat,
          longitude: targetLng,
          level: player?.level || 1,
          completedPlaceIds: completedQuests || [],
          guidePersona: guide?.id || "kohaku",
          partyIds: currentParty ? [currentParty.id] : []
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate quests");
      }
      
      const data = await response.json();
      if (data.quests && Array.isArray(data.quests) && data.quests.length > 0) {
        setQuests(data.quests);
        localStorage.setItem("meguri_dynamic_quests", JSON.stringify(data.quests));
        
        if (player) {
          const playerDocRef = doc(db, "players", player.id);
          await setDoc(playerDocRef, { ...player, currentQuests: data.quests }, { merge: true });
        }
      }
    } catch (err) {
      console.error("Failed to fetch maps-grounded quests:", err);
    } finally {
      setIsGeneratingQuests(false);
    }
  };

  // Sync / generate quests when onboarded
  useEffect(() => {
    if (onboarded && player) {
      const cachedQuests = localStorage.getItem("meguri_dynamic_quests");
      if (cachedQuests) {
        try {
          setQuests(JSON.parse(cachedQuests));
        } catch (e) {
          console.error("Failed to parse cached quests", e);
          fetchQuests(player.latitude, player.longitude);
        }
      } else {
        fetchQuests(player.latitude, player.longitude);
      }
    }
  }, [onboarded, player?.id]);

  // Perform onboarding complete sequence
  const handleOnboardingComplete = async (playerName: string, guideId: string) => {
    const selectedGuide = GUIDES.find(g => g.id === guideId) || GUIDES[0];
    setGuide(selectedGuide);

    // Initialise anonymous Auth
    const authenticatedId = await initializeUserAuth();

    const newPlayer: Player = {
      id: authenticatedId,
      name: playerName,
      guideId: guideId,
      xp: 450,
      level: 12,
      kakera: 128,
      visitedLocations: [],
      lastActive: new Date().toISOString(),
      latitude: 35.6580,
      longitude: 139.7013,
      lastDailyReset: new Date().toISOString(),
      dailyQuests: generateDailyQuests()
    };

    setPlayer(newPlayer);
    setCompletedQuests([]);
    setOnboarded(true);

    // Persist profile locally
    localStorage.setItem("meguri_player_name", playerName);
    localStorage.setItem("meguri_player_guide_id", guideId);
    localStorage.setItem("meguri_local_player_id", authenticatedId);
    localStorage.setItem("meguri_player_xp", "450");
    localStorage.setItem("meguri_player_level", "12");
    localStorage.setItem("meguri_player_kakera", "128");
    localStorage.setItem("meguri_player_completed", "[]");
    if (newPlayer.lastDailyReset) {
      localStorage.setItem("meguri_player_last_daily_reset", newPlayer.lastDailyReset);
    }
    if (newPlayer.dailyQuests) {
      localStorage.setItem("meguri_player_daily_quests", JSON.stringify(newPlayer.dailyQuests));
    }

    // Write asynchronous profile directly to Firestore
    try {
      await setDoc(doc(db, "players", authenticatedId), newPlayer);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `players/${authenticatedId}`);
    }
  };

  // Quest Verification Complete Action Flow
  const handleVerifySuccess = async (spiritMessage: string) => {
    if (!selectedQuest || !player) return;

    setVerificationMessage(spiritMessage);
    setShowActiveCam(false);
    setShowComplete(true);

    // Prevent duplicate reward awardings
    if (completedQuests.includes(selectedQuest.id)) return;

    const updatedCompleted = [...completedQuests, selectedQuest.id];
    let earnedKakera = player.kakera + selectedQuest.rewardKakera;
    let earnedXp = player.xp + selectedQuest.rewardXp;
    
    // Process Daily Quest completions atomically
    let dqUpdated = false;
    let dqXpGained = 0;
    let dqKakeraGained = 0;
    let dqCompletedTitle = "";

    const updatedDailyQuests = player.dailyQuests?.map(dq => {
      if (!dq.completed) {
        const matchesCompleteQuest = dq.targetType === "complete_quest" && dq.targetId === selectedQuest.id;
        const matchesVisitAny = dq.targetType === "visit_any";
        if (matchesCompleteQuest || matchesVisitAny) {
          dqUpdated = true;
          dqXpGained += dq.rewardXp;
          dqKakeraGained += dq.rewardKakera;
          dqCompletedTitle = dq.title;
          return { ...dq, completed: true };
        }
      }
      return dq;
    }) || [];

    let perfectBonusMsg = "";
    if (dqUpdated) {
      earnedXp += dqXpGained;
      earnedKakera += dqKakeraGained;

      const allCompletedBefore = player.dailyQuests?.every(q => q.completed) || false;
      const allCompletedNow = updatedDailyQuests.every(q => q.completed);
      if (!allCompletedBefore && allCompletedNow) {
        earnedXp += 100;
        earnedKakera += 100;
        perfectBonusMsg = " 🌟 Perfect 3/3 Daily Bonus (+100 XP, +100 Kakera) unlocked!";
      }
    }

    // Level up calculation (simple formula)
    let finalLevel = player.level;
    let finalXp = earnedXp;
    while (finalXp >= 1000) {
      finalLevel += 1;
      finalXp = finalXp - 1000;
    }

    const updatedPlayer: Player = {
      ...player,
      visitedLocations: updatedCompleted,
      kakera: earnedKakera,
      xp: finalXp,
      level: finalLevel,
      dailyQuests: updatedDailyQuests
    };

    setPlayer(updatedPlayer);
    setCompletedQuests(updatedCompleted);

    // Sync postcard to state
    const newPostcard: PassportItem = {
      id: selectedQuest.id + "_card",
      questId: selectedQuest.id,
      title: selectedQuest.title,
      locationName: selectedQuest.locationName,
      imageUrl: selectedQuest.postcardUrl,
      unlockedAt: new Date().toISOString(),
      spiritMessage: spiritMessage
    };

    setPassportItems(prev => [newPostcard, ...prev]);

    // LocalStorage Write-through caching
    localStorage.setItem("meguri_player_completed", JSON.stringify(updatedCompleted));
    localStorage.setItem("meguri_player_kakera", earnedKakera.toString());
    localStorage.setItem("meguri_player_xp", finalXp.toString());
    localStorage.setItem("meguri_player_level", finalLevel.toString());
    if (updatedPlayer.dailyQuests) {
      localStorage.setItem("meguri_player_daily_quests", JSON.stringify(updatedPlayer.dailyQuests));
    }

    // Trigger toast notification
    if (dqUpdated) {
      setTimeout(() => {
        showToast(`Daily Quest Complete: "${dqCompletedTitle}"! +${dqXpGained} XP, +${dqKakeraGained} Kakera.${perfectBonusMsg}`);
      }, 1000);
    }

    // Firestore Write-through sync
    try {
      await setDoc(doc(db, "players", player.id), updatedPlayer);
      await setDoc(doc(db, "players", player.id, "passport", newPostcard.id), newPostcard);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `players/${player.id}`);
    }

    // Launch background custom ukiyo-e woodblock print postcard generation
    setIsGeneratingPostcard(true);
    setDynamicPostcardUrl(null);

    (async () => {
      let finalPostcardUrl = selectedQuest.postcardUrl;
      try {
        const res = await fetch("/api/generate-postcard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            place: selectedQuest.locationName,
            district: "Shibuya"
          })
        });
        if (res.ok) {
          const postcardData = await res.json();
          if (postcardData.imageUrl) {
            finalPostcardUrl = postcardData.imageUrl;
            setDynamicPostcardUrl(finalPostcardUrl);
          }
        }
      } catch (err) {
        console.error("Failed to generate dynamic postcard artwork:", err);
      } finally {
        setIsGeneratingPostcard(false);
        
        // Rewrite postcard item in state and Firestore with the bespoke ukiyo-e masterpiece
        const generatedPostcard: PassportItem = {
          id: selectedQuest.id + "_card",
          questId: selectedQuest.id,
          title: selectedQuest.title,
          locationName: selectedQuest.locationName,
          imageUrl: finalPostcardUrl,
          unlockedAt: new Date().toISOString(),
          spiritMessage: spiritMessage
        };

        setPassportItems(prev => prev.map(item => item.id === generatedPostcard.id ? generatedPostcard : item));
        
        try {
          await setDoc(doc(db, "players", player.id, "passport", generatedPostcard.id), generatedPostcard);
        } catch (dbErr) {
          console.warn("Deferred postcard rewrite to Firestore:", dbErr);
        }
      }
    })();
  };

  const triggerDailyQuestProgress = async (type: "complete_quest" | "chat_guide" | "visit_any" | "generate_quest", targetId?: string) => {
    if (!player) return;

    let updated = false;
    let xpGained = 0;
    let kakeraGained = 0;
    let completedQuestTitle = "";

    const updatedDailyQuests = player.dailyQuests?.map(dq => {
      if (!dq.completed) {
        const matchesType = dq.targetType === type;
        const matchesTarget = !dq.targetId || dq.targetId === targetId;
        if (matchesType && matchesTarget) {
          updated = true;
          xpGained += dq.rewardXp;
          kakeraGained += dq.rewardKakera;
          completedQuestTitle = dq.title;
          return { ...dq, completed: true };
        }
      }
      return dq;
    }) || [];

    if (updated) {
      // Calculate level up
      let newXp = player.xp + xpGained;
      let newLevel = player.level;
      while (newXp >= 1000) {
        newXp -= 1000;
        newLevel += 1;
      }

      // Check for Perfect Daily Bonus
      const allCompletedBefore = player.dailyQuests?.every(q => q.completed) || false;
      const allCompletedNow = updatedDailyQuests.every(q => q.completed);
      let perfectBonusMsg = "";
      if (!allCompletedBefore && allCompletedNow) {
        const bonusXp = 100;
        const bonusKakera = 100;
        newXp += bonusXp;
        while (newXp >= 1000) {
          newXp -= 1000;
          newLevel += 1;
        }
        kakeraGained += bonusKakera;
        perfectBonusMsg = " 🌟 Perfect 3/3 Daily Bonus (+100 XP, +100 Kakera) unlocked!";
      }

      const updatedPlayer: Player = {
        ...player,
        xp: newXp,
        level: newLevel,
        kakera: player.kakera + kakeraGained,
        dailyQuests: updatedDailyQuests
      };

      setPlayer(updatedPlayer);

      // Cache locally
      localStorage.setItem("meguri_player_xp", updatedPlayer.xp.toString());
      localStorage.setItem("meguri_player_level", updatedPlayer.level.toString());
      localStorage.setItem("meguri_player_kakera", updatedPlayer.kakera.toString());
      localStorage.setItem("meguri_player_daily_quests", JSON.stringify(updatedDailyQuests));

      // Trigger custom UI notification toast
      showToast(`Daily Quest Complete: "${completedQuestTitle}"! +${xpGained} XP, +${kakeraGained} Kakera.${perfectBonusMsg}`);

      // Sync Firestore
      try {
        await setDoc(doc(db, "players", player.id), updatedPlayer);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `players/${player.id}`);
      }
    }
  };

  const handleForceResetDailyQuests = async () => {
    if (!player) return;

    const updatedPlayer: Player = {
      ...player,
      lastDailyReset: new Date().toISOString(),
      dailyQuests: generateDailyQuests()
    };

    setPlayer(updatedPlayer);
    
    localStorage.setItem("meguri_player_last_daily_reset", updatedPlayer.lastDailyReset);
    localStorage.setItem("meguri_player_daily_quests", JSON.stringify(updatedPlayer.dailyQuests));

    showToast("Daily Quests refreshed! 🌸 New tasks carved by old spirits.");

    try {
      await setDoc(doc(db, "players", player.id), updatedPlayer);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `players/${player.id}`);
    }
  };

  const handleTestLevelUp = async () => {
    if (!player) return;

    const updatedPlayer: Player = {
      ...player,
      level: player.level + 1,
      xp: 0
    };

    setPlayer(updatedPlayer);

    localStorage.setItem("meguri_player_level", updatedPlayer.level.toString());
    localStorage.setItem("meguri_player_xp", "0");

    showToast(`Level up simulated! Welcome to level ${updatedPlayer.level}. 🌟`);

    try {
      await setDoc(doc(db, "players", player.id), updatedPlayer);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `players/${player.id}`);
    }
  };

  const handleActivateDynamicQuest = (quest: Quest) => {
    // Add to local quests list
    if (!quests.some(q => q.id === quest.id)) {
      const updated = [quest, ...quests];
      setQuests(updated);
    }
    setSelectedQuest(quest);
    setCurrentTab("map");
  };

  const handleAddToPassport = () => {
    setShowComplete(false);
    setSelectedQuest(null);
    setCurrentTab("archive"); // Jump to passport tab
  };

  // Guide Chat activated quest redirection
  const handleActivateQuest = (questId: string) => {
    const found = QUESTS.find(q => q.id === questId);
    if (found) {
      setSelectedQuest(found);
      setCurrentTab("map");
    }
  };

  const handleJoinParty = (code: string) => {
    // Generate a quick mock join with bot teammates inside
    const mockParty: Party = {
      id: code,
      name: `Tokyo Explorers`,
      leaderId: "teammate_ren",
      members: [
        {
          id: player?.id || "player_1",
          name: player?.name || "Player",
          avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDFmfaExnZ9uJYWiWSn-MyxiXGLmjhhHP8diQ3kznBq0fafzxyP-xzux9u5obY_XVf7JQZtId7J1fcHkMGP85TXecFykw3GcJ-HnbHGU6XHJWbIjzq4VYgCZ_6m6yUiMuX8y2ybTI_XS57KkqjnJFepFgw7JndaW9B16qnSPq1x8Vdme6TQDY2nSStzcnw9PyVNRQj2-dGBdlTBJ7nsv4vLZQdZdG_ycXU8kOBZHadI7Mw-POe3qVeezeqxAbYyHZGcaj6MELETHKfb",
          guideId: player?.guideId || "kohaku",
          lat: 35.6580,
          lng: 139.7013,
          isHost: false,
          status: "in-quest"
        },
        {
          id: "ren",
          name: "Ren",
          avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhI6N1oUxJzXSbTF-P3DdNLWq1Bed99M07VHrru6Jhc_fyLSTNbW_7Eyudntwhd1RZ9ur7xjF-vuGXcXQ3zfiokMPPJjmCuKdicug-44PmB4yH-oqA4tua0_I3ykpMHm3HV1nqy4IYAfgVA5BRGvEUdvMkuhQu7-Sssi3Xfpp5mOiEzUlNgKzIbYIZUQqusrgUL1MnR1ewyD2llnuGweTTjP6jL3lG_VcElMMsaPyqwWK7uIKFl_M3aBFFD3P0ctXAJNkXrtxc_3wQ",
          guideId: "sen",
          lat: 35.6585,
          lng: 139.7018,
          isHost: true,
          status: "completed"
        }
      ],
      createdAt: new Date().toISOString()
    };
    setCurrentParty(mockParty);
  };

  // If not onboarded, show Onboarding selection screen
  if (!onboarded || !player || !guide) {
    return <GuideOnboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-dark-bg washi-texture flex flex-col justify-between overflow-hidden text-cream font-sans">
      
      {/* ACTIVE SCREEN ROUTER FRAME */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {currentTab === "map" && (
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <ShibuyaMap
                player={player}
                guide={guide}
                completedQuests={completedQuests}
                onSelectQuest={(q) => setSelectedQuest(q)}
                quests={quests}
                onFindQuests={() => fetchQuests(player.latitude, player.longitude)}
                isGeneratingQuests={isGeneratingQuests}
                onDailyQuestTrigger={triggerDailyQuestProgress}
                onForceResetDailyQuests={handleForceResetDailyQuests}
                onTestLevelUp={handleTestLevelUp}
                demoMode={demoMode}
              />
            </motion.div>
          )}

          {currentTab === "quests" && (
            <motion.div
              key="quests"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              {/* Show detail map with selected quest or default to Hachiko */}
              <ShibuyaMap
                player={player}
                guide={guide}
                completedQuests={completedQuests}
                onSelectQuest={(q) => setSelectedQuest(q)}
                quests={quests}
                onFindQuests={() => fetchQuests(player.latitude, player.longitude)}
                isGeneratingQuests={isGeneratingQuests}
                onDailyQuestTrigger={triggerDailyQuestProgress}
                onForceResetDailyQuests={handleForceResetDailyQuests}
                onTestLevelUp={handleTestLevelUp}
                demoMode={demoMode}
              />
              <QuestDetails
                quest={selectedQuest || quests[1] || quests[0] || QUESTS[1]}
                guide={guide}
                isCompleted={completedQuests.includes(selectedQuest?.id || quests[1]?.id || quests[0]?.id || QUESTS[1].id)}
                onClose={() => setCurrentTab("map")}
                onStartSolo={() => setShowActiveCam(true)}
                onStartParty={() => setCurrentTab("social")}
              />
            </motion.div>
          )}

          {currentTab === "archive" && (
            <motion.div
              key="archive"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 overflow-hidden"
            >
              <TokyoPassport player={player} passportItems={passportItems} />
            </motion.div>
          )}

          {currentTab === "guide" && (
            <motion.div
              key="guide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 overflow-hidden"
            >
              <GuideChat
                player={player}
                guide={guide}
                onActivateQuest={handleActivateQuest}
                onActivateDynamicQuest={handleActivateDynamicQuest}
                onDailyQuestTrigger={triggerDailyQuestProgress}
              />
            </motion.div>
          )}

          {currentTab === "social" && (
            <motion.div
              key="social"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 overflow-hidden"
            >
              <SocialHub
                player={player}
                currentParty={currentParty}
                onJoinParty={handleJoinParty}
                onPartyCreated={(p) => setCurrentParty(p)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* OVERLAY SLIDING BOTTOM SHEETS (Spring transitions) */}
      <AnimatePresence>
        {selectedQuest && currentTab === "map" && (
          <QuestDetails
            quest={selectedQuest}
            guide={guide}
            isCompleted={completedQuests.includes(selectedQuest.id)}
            onClose={() => setSelectedQuest(null)}
            onStartSolo={() => setShowActiveCam(true)}
            onStartParty={() => setCurrentTab("social")}
          />
        )}

        {showActiveCam && selectedQuest && (
          <ActiveQuestCam
            quest={selectedQuest}
            guide={guide}
            onClose={() => setShowActiveCam(false)}
            onVerifySuccess={handleVerifySuccess}
          />
        )}

        {showComplete && selectedQuest && (
          <QuestComplete
            quest={selectedQuest}
            guide={guide}
            spiritMessage={verificationMessage}
            onAddToPassport={handleAddToPassport}
            dynamicPostcardUrl={dynamicPostcardUrl}
            isGeneratingPostcard={isGeneratingPostcard}
          />
        )}
      </AnimatePresence>

      {/* GLOBAL HUD SYSTEM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 w-full z-20 flex justify-around items-center px-4 pb-safe h-20 bg-dark-panel/90 backdrop-blur-md border-t border-gold/20 shadow-[0_-4px_25px_rgba(215,38,61,0.15)] rounded-t-2xl pointer-events-auto">
        <button
          onClick={() => { setCurrentTab("map"); setSelectedQuest(null); }}
          className={`flex flex-col items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl transition-all focus:outline-none active:scale-95 ${
            currentTab === "map"
              ? "bg-crimson/15 text-crimson border border-crimson/20 shadow-[0_0_15px_rgba(215,38,61,0.25)] font-bold"
              : "text-gold/60 hover:text-gold"
          }`}
        >
          <Map className="w-5.5 h-5.5" />
          <span className="text-[10px] tracking-wider uppercase font-semibold">Map</span>
        </button>

        <button
          onClick={() => { if (!selectedQuest) setSelectedQuest(quests[1] || quests[0] || QUESTS[1]); setCurrentTab("quests"); }}
          className={`flex flex-col items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl transition-all focus:outline-none active:scale-95 ${
            currentTab === "quests"
              ? "bg-crimson/15 text-crimson border border-crimson/20 shadow-[0_0_15px_rgba(215,38,61,0.25)] font-bold"
              : "text-gold/60 hover:text-gold"
          }`}
        >
          <Compass className="w-5.5 h-5.5" />
          <span className="text-[10px] tracking-wider uppercase font-semibold">Quests</span>
        </button>

        <button
          onClick={() => setCurrentTab("archive")}
          className={`flex flex-col items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl transition-all focus:outline-none active:scale-95 ${
            currentTab === "archive"
              ? "bg-crimson/15 text-crimson border border-crimson/20 shadow-[0_0_15px_rgba(215,38,61,0.25)] font-bold"
              : "text-gold/60 hover:text-gold"
          }`}
        >
          <BookOpen className="w-5.5 h-5.5" />
          <span className="text-[10px] tracking-wider uppercase font-semibold">Archive</span>
        </button>

        <button
          onClick={() => setCurrentTab("guide")}
          className={`flex flex-col items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl transition-all focus:outline-none active:scale-95 ${
            currentTab === "guide"
              ? "bg-crimson/15 text-crimson border border-crimson/20 shadow-[0_0_15px_rgba(215,38,61,0.25)] font-bold"
              : "text-gold/60 hover:text-gold"
          }`}
        >
          <Sparkles className="w-5.5 h-5.5" />
          <span className="text-[10px] tracking-wider uppercase font-semibold">Guide</span>
        </button>

        <button
          onClick={() => setCurrentTab("social")}
          className={`flex flex-col items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl transition-all focus:outline-none active:scale-95 ${
            currentTab === "social"
              ? "bg-crimson/15 text-crimson border border-crimson/20 shadow-[0_0_15px_rgba(215,38,61,0.25)] font-bold"
              : "text-gold/60 hover:text-gold"
          }`}
        >
          <Users className="w-5.5 h-5.5" />
          <span className="text-[10px] tracking-wider uppercase font-semibold">Social</span>
        </button>
      </nav>

      {/* TOAST SYSTEM */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 p-4 bg-dark-panel/95 backdrop-blur-md border border-gold/40 rounded-xl shadow-[0_10px_30px_rgba(218,165,32,0.25)] flex items-start gap-3 pointer-events-auto font-sans"
          >
            <div className="p-2 bg-gold/10 text-gold rounded-lg border border-gold/20 flex-shrink-0 animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-mono font-bold tracking-widest text-gold uppercase mb-0.5">Spirit Revelation</h4>
              <p className="text-xs text-cream/90 leading-relaxed font-sans">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEVEL UP OVERLAY MODAL */}
      <AnimatePresence>
        {levelUpToShow !== null && (
          <LevelUpModal
            level={levelUpToShow}
            onClose={() => setLevelUpToShow(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
