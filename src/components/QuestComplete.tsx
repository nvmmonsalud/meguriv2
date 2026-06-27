import React from "react";
import { motion } from "motion/react";
import { Award, Share2, Compass, MapPin, Sparkles, Diamond, Landmark } from "lucide-react";
import { Quest, Guide } from "../types";

interface QuestCompleteProps {
  quest: Quest;
  guide: Guide;
  spiritMessage: string;
  onAddToPassport: () => void;
  dynamicPostcardUrl?: string | null;
  isGeneratingPostcard?: boolean;
}

export default function QuestComplete({ 
  quest, 
  guide, 
  spiritMessage, 
  onAddToPassport,
  dynamicPostcardUrl,
  isGeneratingPostcard
}: QuestCompleteProps) {
  // Grab current formatted date for the authentic stamps
  const currentDateStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  }).toUpperCase();

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Meguri Quest Complete: ${quest.title}`,
        text: `I completed the ${quest.title} quest in Shibuya with guide ${guide.name} and earned a gorgeous ukiyo-e postcard!`,
        url: window.location.href
      }).catch(err => console.log(err));
    } else {
      alert("Journey shared! Link copied to clipboard.");
    }
  };

  const finalImageUrl = dynamicPostcardUrl || quest.postcardUrl;

  return (
    <div className="fixed inset-0 z-50 bg-dark-bg overflow-y-auto px-6 py-8 font-sans text-cream custom-scrollbar">
      {/* Decorative Atmospheric Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-crimson/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gold/5 blur-[100px]"></div>
      </div>

      {/* Top Header App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-dark-panel/95 backdrop-blur-md border-b border-gold/20">
        <div className="flex items-center gap-2 text-gold font-mono">
          <CheckCircle className="w-5 h-5 text-crimson" />
          <span className="text-[10px] font-bold tracking-widest uppercase">Quest Complete</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-dark-card border border-gold/25 rounded-full">
          <Diamond className="w-3.5 h-3.5 text-gold fill-gold" />
          <span className="text-xs font-bold text-gold font-display">{quest.rewardKakera} Kakera</span>
        </div>
      </header>

      {/* Main content body */}
      <main className="relative z-10 pt-16 pb-24 flex flex-col items-center max-w-md mx-auto gap-8">
        
        {/* Postcard Hero Visual with Floating animation */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          className="relative w-full aspect-[3/4] mt-6"
        >
          {/* Outer glowing bloom */}
          <div className="absolute -inset-2 bg-crimson/25 blur-3xl rounded-3xl scale-95 pointer-events-none"></div>
          
          {/* Postcard Canvas (Washi Natural Paper) */}
          <div 
            className="relative h-full w-full bg-[#FDF7E4] rounded-2xl p-4 shadow-2xl border border-gold/30 overflow-hidden flex flex-col justify-between"
            style={{
              backgroundImage: `url("https://www.transparenttextures.com/patterns/natural-paper.png")`,
              backgroundRepeat: "repeat"
            }}
          >
            {/* Illustrated Artwork Frame */}
            <div className="relative w-full h-[85%] rounded-xl overflow-hidden shadow-inner border border-[#322e3d]/10 bg-[#322e3d]/5">
              {isGeneratingPostcard ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#2d2a35] relative p-6 text-center overflow-hidden">
                  {/* Japanese Vermilion & Charcoal aesthetic scanning spinner */}
                  <div className="absolute inset-0 bg-gradient-to-b from-crimson/5 to-transparent animate-pulse pointer-events-none"></div>
                  
                  {/* Spinning/pulsating decorative crest */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                    className="w-20 h-20 rounded-full border-4 border-dashed border-crimson/45 flex items-center justify-center opacity-65 mb-4"
                  >
                    <Landmark className="w-8 h-8 text-crimson" />
                  </motion.div>
                  
                  <h3 className="font-serif text-sm font-black text-[#FDF7E4] tracking-widest uppercase mb-1.5 animate-pulse">
                    Inking Collectible
                  </h3>
                  <p className="text-[10px] font-mono tracking-wider text-gold/80 uppercase">
                    Carving Ethereal Woodblock...
                  </p>
                  
                  <div className="absolute bottom-4 left-0 w-full flex justify-center px-4">
                    <span className="text-[9px] font-mono text-[#FDF7E4]/40 uppercase tracking-tighter">
                      Gemini Nano Banana Model Active
                    </span>
                  </div>
                </div>
              ) : (
                <img
                  src={finalImageUrl}
                  alt={quest.title}
                  className="w-full h-full object-cover grayscale opacity-90 contrast-125"
                />
              )}
              
              {/* Woodblock Date Stamp Overlay */}
              <div className="absolute top-4 right-4 rotate-[-12deg] opacity-85 mix-blend-multiply pointer-events-none">
                <div className="border-2 border-dashed border-[#b32915] text-[#b32915] rounded-md px-3 py-1 font-bold text-base bg-transparent">
                  {currentDateStr}
                </div>
              </div>

              {/* Title Gradient Overlay */}
              <div className="absolute bottom-0 left-0 w-full p-5 bg-gradient-to-t from-black/85 to-transparent">
                <h1 className="text-xl font-serif font-black text-white tracking-wide leading-tight">
                  {quest.title}
                </h1>
                <p className="text-white/80 text-xs flex items-center gap-1.5 mt-0.5 font-serif">
                  <MapPin className="w-3.5 h-3.5 text-crimson" />
                  {quest.locationName}
                </p>
              </div>
            </div>

            {/* Bottom Washi Stamp Footnote */}
            <div className="flex justify-between items-end px-1 mt-3">
              <span className="text-[10px] font-mono font-bold tracking-tighter text-[#322e3d]/60 uppercase">
                Meguri Archive No. {100 + quest.rewardXp}
              </span>
              {/* Japanese color swatch dots */}
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-crimson"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-gold"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#1A1A1A]"></span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Reward Metric Widgets */}
        <div className="w-full grid grid-cols-2 gap-4">
          <div className="bg-dark-card border border-gold/20 rounded-xl p-4 flex flex-col items-center text-center shadow-lg shadow-gold/5">
            <Diamond className="w-6 h-6 text-gold fill-gold mb-1.5 animate-pulse" />
            <span className="text-lg font-display font-black text-gold">+{quest.rewardKakera}</span>
            <span className="text-[10px] font-mono font-bold text-cream/60 tracking-wider uppercase">
              Kakera Earned
            </span>
          </div>
          
          <div className="bg-dark-card border border-gold/20 rounded-xl p-4 flex flex-col items-center text-center shadow-lg shadow-crimson/5">
            <Compass className="w-6 h-6 text-crimson mb-1.5 animate-pulse" />
            <span className="text-lg font-display font-black text-crimson">+{quest.rewardXp} XP</span>
            <span className="text-[10px] font-mono font-bold text-cream/60 tracking-wider uppercase">
              Explorer XP
            </span>
          </div>
        </div>

        {/* Poetical Lore Snippet */}
        <div className="w-full text-center px-4 relative mt-2">
          <p className="font-serif text-cream/90 italic leading-relaxed text-sm pr-2 pl-2">
            &ldquo;{spiritMessage || "The spirits of Tokyo have witnessed your journey. May your passport guide you home."}&rdquo;
          </p>
        </div>

        {/* Guide Congratulatory message box */}
        <div className="w-full bg-dark-card border border-gold/15 rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-black/45">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-full border-2 border-crimson overflow-hidden bg-dark-bg">
              <img src={guide.avatar} alt={guide.name} className="w-full h-full object-cover grayscale" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-crimson text-white text-[9px] font-extrabold px-1.5 rounded-md border border-dark-card">
              LVL {guide.id === "sen" ? 14 : guide.id === "riku" ? 11 : 12}
            </div>
          </div>
          <div className="flex-grow space-y-1">
            <span className="text-[10px] font-mono font-bold text-gold tracking-widest uppercase">
              {guide.name} &bull; Guide Feedback
            </span>
            <p className="text-xs font-serif italic text-cream/90 leading-snug">
              &ldquo;You've got a sharp eye, traveler. The shrine spirits are pleased.&rdquo;
            </p>
          </div>
        </div>

        {/* Action Button Links */}
        <div className="w-full space-y-3">
          <button
            onClick={onAddToPassport}
            className="w-full h-14 bg-crimson text-white font-black text-sm uppercase tracking-[0.3em] rounded-xl flex items-center justify-center gap-2 hover:bg-crimson/90 shadow-[0_0_20px_rgba(215,38,61,0.5)] active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-white" />
            <span>ADD TO PASSPORT</span>
          </button>
          
          <button
            onClick={handleShare}
            className="w-full h-14 bg-transparent border-2 border-gold/40 text-gold font-black text-sm uppercase tracking-[0.3em] rounded-xl flex items-center justify-center gap-2 hover:bg-gold/5 active:scale-95 transition-all cursor-pointer"
          >
            <Share2 className="w-5 h-5" />
            <span>SHARE JOURNEY</span>
          </button>
        </div>
      </main>
    </div>
  );
}

// Simple internal checkmark helper icon since check-circle is custom
function CheckCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={3}
      stroke="currentColor"
      className={props.className}
      width="20"
      height="20"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
