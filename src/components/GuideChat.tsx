import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Mic, Sparkles, Star, MapPin, Compass, Diamond, ChevronRight, MessageSquare, AlertCircle, Volume2 } from "lucide-react";
import { Player, Guide } from "../types";

interface ChatMessageDisplay {
  id: string;
  sender: "guide" | "player";
  text: string;
  timestamp: string;
  card?: {
    id: string;
    title: string;
    label: string;
    rating: string;
    votes: string;
    distance: string;
    description: string;
    imageUrl: string;
    latitude?: number;
    longitude?: number;
    placeId?: string;
  };
}

interface GuideChatProps {
  player: Player;
  guide: Guide;
  onActivateQuest: (questId: string) => void;
  onActivateDynamicQuest?: (quest: any) => void;
  onDailyQuestTrigger?: (type: "chat_guide" | "generate_quest") => void;
}

export default function GuideChat({ player, guide, onActivateQuest, onActivateDynamicQuest, onDailyQuestTrigger }: GuideChatProps) {
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsSubmitting] = useState(false);
  const [generatingCardId, setGeneratingCardId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Swappable speak interface for voice capabilities (Gemini Live API/TTS ready)
  const speak = (text: string) => {
    console.log(`[Voice Hook] Speak sequence active: "${text}"`);
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = guide.id === "sen" ? 0.85 : guide.id === "riku" ? 1.15 : 1.0;
      utterance.pitch = guide.id === "sen" ? 0.95 : guide.id === "riku" ? 1.1 : 1.25;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech Synthesis play deferred:", err);
    }
  };

  const [messages, setMessages] = useState<ChatMessageDisplay[]>([
    {
      id: "init1",
      sender: "guide",
      text: `Good evening, traveler. The neon of Shibuya is particularly vibrant tonight. Are you looking for a quiet sanctuary or a hidden feast?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Suggestions block matching screenshot 8
  const quickSuggestions = [
    "Is there any legendary ramen nearby?",
    "Where is a quiet sanctuary here?",
    "Tell me a ghost story about Shibuya",
    "Surprise me!"
  ];

  // Auto-scroll chats to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Trigger speak on initial mount
  useEffect(() => {
    speak(messages[0].text);
  }, []);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isTyping) return;

    const userMessage: ChatMessageDisplay = {
      id: "user_" + Math.random().toString(36).substring(2, 9),
      sender: "player",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setIsSubmitting(true);

    try {
      // Gather simplified message history for context
      const simpleHistory = messages.map(msg => ({
        role: msg.sender === "player" ? "user" : "model",
        text: msg.text
      }));

      const response = await fetch("/api/guide-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend.trim(),
          guideId: guide.id,
          history: simpleHistory
        })
      });

      const data = await response.json();
      
      const guideReply: ChatMessageDisplay = {
        id: "guide_" + Math.random().toString(36).substring(2, 9),
        sender: "guide",
        text: data.reply || "My archives are a bit hazy right now, let's keep wandering...",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // Speak response dynamically (Gemini voice hook seam)
      speak(guideReply.text);

      // Handle Maps grounded dynamic place recommendation cards
      if (data.recommendation) {
        const postcards = [
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBaNV4LE0_wSZWaiMFTWJ-hKkie0kmxmliDZcWb9q50RzlMn3vR0uB1DgZ0GJYH9mRPriH6mnbMcPtOiBVYaRhX3oE7JnzELGbV2LwOiiZTFGZTMftx2_ZEFIQ1L8RCM75UbJgVQYm7OgKEZ9MzIgpp86m5qfeqSk0vh6AGgJ2P-Lv3jv87pUrNQig59KOdEdiMVZQFzlCiRzTsccnr8yhckr0wAe1SJHJAodzgGcsz2FSSxhlKBw5awPbjdaWFOiujmIp8wD1ncJ6p",
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDCKYAUsXR5C0nygzc1yq37u6zQtX2frcUqg-MPD_4cLk0f2bKdSh0cdA6abmMVKW34E-1X5sIf7XcThToDV6f2gbOTfsCYbIzmBGpL99sgwI5MrhNEQfbqQEDn34Sh0YnW8OqKVv8VfhTL8oRK5B0bhZ9RWyEj04dY8QEA41B-Ik92fqtUevTp6_e6pry715Jkkyc3t0JRUHJq_8igbn42cYRspbSUTMNw8ihCLODQTXUMX3U6SEN4EHIgjm3Bveiu3X9fSi8GWTct",
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCyvk3rtmTyES-O160613-N60k-3DruRjXWjzI_uZyKROaTQ-LzXp6GGqSAFR2lKMD8MYbKW4uLDl1O04FWQtOp_W5iKU9QzLfNRupUNG3BNBRxrJSuMd2AfSP0lVUQav9rKeancjubdT9dlqQrwnEVPbPHdFuW5jfQEN5ZI_HK_zKalGcG71je8lZAvVcly3LJ7-QbmUt8pfPFsETIpsvZ0LujQR8udKunO1YnJXzK44a2lrOCo3AjvLF0rMYMbVaBtcXtDAxwUjrg"
        ];
        // Cycle backgrounds based on title length
        const cardImg = postcards[data.recommendation.title.length % postcards.length];

        guideReply.card = {
          id: "dynamic_rec_" + Math.random().toString(36).substring(2, 9),
          title: data.recommendation.title,
          label: data.recommendation.label || "SPIRIT RECOMMENDATION",
          rating: data.recommendation.rating || "4.8",
          votes: data.recommendation.votes || "800 souls",
          distance: data.recommendation.distance || "350m away",
          description: data.recommendation.description || "A recommended hidden spot.",
          imageUrl: cardImg,
          latitude: data.recommendation.latitude,
          longitude: data.recommendation.longitude,
          placeId: data.recommendation.placeId
        };
      }

      setMessages(prev => [...prev, guideReply]);
      onDailyQuestTrigger?.("chat_guide");
    } catch (err) {
      console.error("Guide chat request error:", err);
      const fallbackReply: ChatMessageDisplay = {
        id: "guide_err",
        sender: "guide",
        text: `Ah! The physical frequencies are fluctuating, but I sense your spirit is strong. Keep seeking the secrets of Shibuya!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      speak(fallbackReply.text);
      setMessages(prev => [...prev, fallbackReply]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuestMeThere = async (card: any) => {
    if (!card) return;
    setGeneratingCardId(card.id);
    try {
      const response = await fetch("/api/generate-quest-for-place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeName: card.title,
          latitude: card.latitude,
          longitude: card.longitude,
          description: card.description,
          placeId: card.placeId
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate quest for recommended place");
      }

      const result = await response.json();
      if (result.quest && onActivateDynamicQuest) {
        onActivateDynamicQuest(result.quest);
        onDailyQuestTrigger?.("generate_quest");
      } else {
        onActivateQuest(card.id);
        onDailyQuestTrigger?.("generate_quest");
      }
    } catch (error) {
      console.error("Error generating dynamic quest:", error);
      onActivateQuest(card.id);
    } finally {
      setGeneratingCardId(null);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col justify-between font-sans text-cream overflow-hidden pb-48">
      
      {/* Top Header App Bar */}
      <header className="fixed top-0 left-0 w-full z-20 flex justify-between items-center px-6 py-4 bg-dark-panel/95 backdrop-blur-md border-b border-gold/20">
        <div className="flex items-center gap-4">
          <div className="relative">
            {/* Pulsing speak status ring */}
            <div className={`absolute -inset-1 rounded-full bg-gold/20 ${isTyping ? "animate-ping" : "animate-pulse"}`}></div>
            <div className="relative w-12 h-12 rounded-full border-2 border-gold overflow-hidden bg-dark-bg">
              <img src={guide.avatar} alt={guide.name} className="w-full h-full object-cover grayscale" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-gold text-[#1A1A1A] px-1.5 rounded-full text-[9px] font-extrabold shadow-md border border-dark-panel">
              LVL 12
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-white tracking-wide">{guide.name}</span>
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
              <span className={`w-2 h-2 rounded-full bg-emerald-400 ${isTyping ? "animate-pulse" : ""}`}></span>
              {isTyping ? "Whispering thoughts..." : "Listening to your journey..."}
            </span>
          </div>
        </div>

        {/* Kakera currency pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-card border border-gold/25 rounded-full shadow-md">
          <Diamond className="w-3.5 h-3.5 text-gold fill-gold" />
          <span className="text-xs font-mono font-bold text-gold tracking-wider">128 KAKERA</span>
        </div>
      </header>

      {/* CHAT BUBBLES CANVAS */}
      <div 
        className="flex-grow mt-24 px-6 overflow-y-auto space-y-6 pt-4 custom-scrollbar select-text pb-4"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 10 L30 40 L50 60 L70 40 Z M35 45 L40 50' stroke='rgba(255,180,166,0.015)' fill='none'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px"
        }}
      >
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-1">
            {/* Guide Bubble */}
            {msg.sender === "guide" ? (
              <div className="flex flex-col items-start gap-2 max-w-[85%]">
                <div className="flex items-start gap-2">
                  <div className="bg-dark-card border border-gold/15 p-4 rounded-2xl rounded-tl-none shadow-md relative group">
                    <p className="text-sm leading-relaxed text-cream font-serif">{msg.text}</p>
                    {/* Speaker play-back icon */}
                    <button 
                      onClick={() => speak(msg.text)}
                      className="absolute top-2 right-2 text-gold/45 hover:text-gold active:scale-90 transition-all cursor-pointer"
                      title="Speak Message"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                {/* RECOMMENDED CARD INLINE */}
                {msg.card && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full bg-dark-panel border border-gold/20 rounded-2xl overflow-hidden shadow-xl mt-2 max-w-sm group hover:border-gold/40 transition-all duration-300"
                  >
                    <div className="relative h-40">
                      <img src={msg.card.imageUrl} alt={msg.card.title} className="w-full h-full object-cover grayscale opacity-90 contrast-125" />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-panel via-transparent to-transparent"></div>
                      <div className="absolute bottom-3 left-4">
                        <span className="bg-gold text-[#1A1A1A] px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase mb-1 inline-block">
                          {msg.card.label}
                        </span>
                        <h4 className="text-lg font-serif font-black text-white leading-tight">{msg.card.title}</h4>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-center text-xs font-semibold text-cream/60">
                        <div className="flex items-center gap-0.5 text-gold">
                          <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                          <span className="text-white font-extrabold ml-1">{msg.card.rating}</span>
                          <span>({msg.card.votes})</span>
                        </div>
                        <span className="flex items-center gap-1 font-mono text-crimson">
                          <MapPin className="w-3.5 h-3.5 text-crimson" />
                          {msg.card.distance}
                        </span>
                      </div>
                      <p className="text-xs text-cream/80 italic font-serif leading-relaxed">
                        &ldquo;{msg.card.description}&rdquo;
                      </p>
                      
                      <button
                        onClick={() => handleQuestMeThere(msg.card)}
                        disabled={generatingCardId === msg.card.id}
                        className="w-full h-11 bg-crimson text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl shadow-[0_0_15px_rgba(215,38,61,0.4)] flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {generatingCardId === msg.card.id ? (
                          <>
                            <Sparkles className="w-4 h-4 text-white animate-spin" />
                            <span>CARVING QUEST...</span>
                          </>
                        ) : (
                          <>
                            <Compass className="w-4 h-4 text-white" />
                            <span>QUEST ME THERE</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                <span className="text-[9px] font-mono font-bold text-gold/40 ml-2 uppercase tracking-widest">
                  {msg.timestamp}
                </span>
              </div>
            ) : (
              /* Player Bubble */
              <div className="flex flex-col items-end gap-2 max-w-[85%] ml-auto">
                <div className="bg-crimson border border-gold/20 p-4 rounded-2xl rounded-tr-none shadow-md text-white">
                  <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                </div>
                <span className="text-[9px] font-mono font-bold text-gold/40 mr-2 uppercase tracking-widest">
                  {msg.timestamp}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Mock Typist Indicator */}
        {isTyping && (
          <div className="flex gap-1.5 p-3 bg-dark-card/40 rounded-full border border-gold/15 w-16 items-center justify-center shrink-0">
            <span className="w-2 h-2 rounded-full bg-gold animate-bounce delay-100"></span>
            <span className="w-2 h-2 rounded-full bg-gold animate-bounce delay-200"></span>
            <span className="w-2 h-2 rounded-full bg-gold animate-bounce delay-300"></span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* FOOTER INTERACTIVE CONTROL PANEL */}
      <footer className="fixed bottom-20 left-0 w-full z-20 px-6 pb-6 space-y-4 bg-gradient-to-t from-dark-bg via-dark-bg/95 to-transparent">
        
        {/* Suggestion Chips Row */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar px-1 pointer-events-auto">
          {quickSuggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(suggestion)}
              disabled={isTyping}
              className="whitespace-nowrap px-4 py-2 rounded-full bg-dark-card border border-gold/20 hover:border-gold/45 text-xs font-mono font-bold text-gold transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Input Text Box Field with Mic capture stub */}
        <div className="bg-dark-panel border border-gold/25 p-2 rounded-2xl shadow-xl flex items-center gap-3">
          <button
            onClick={() => handleSendMessage("Is there a quiet temple garden near here?")}
            className="w-10 h-10 flex items-center justify-center text-gold hover:bg-white/5 rounded-xl transition-all focus:outline-none cursor-pointer"
          >
            <Mic className="w-5 h-5 text-gold" />
          </button>
          
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(chatInput)}
            placeholder="Whisper to guide..."
            disabled={isTyping}
            className="flex-grow bg-transparent border-none text-sm text-white placeholder-cream/30 focus:outline-none h-11 focus:ring-0 disabled:opacity-50"
          />
          
          <button
            onClick={() => handleSendMessage(chatInput)}
            disabled={!chatInput.trim() || isTyping}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all focus:outline-none ${
              !chatInput.trim() || isTyping
                ? "bg-[#363341] text-white/30 cursor-not-allowed"
                : "bg-crimson text-white shadow-md active:scale-95 hover:opacity-90 cursor-pointer"
            }`}
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </footer>

    </div>
  );
}
