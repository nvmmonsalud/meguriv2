import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Navigation, Sparkles, Check, Diamond, ShieldCheck, HeartPulse, Compass, RefreshCw } from "lucide-react";
import { Quest, Player, Guide } from "../types";
import { QUESTS } from "../data";

interface ShibuyaMapProps {
  player: Player;
  guide: Guide;
  onSelectQuest: (quest: Quest) => void;
  completedQuests: string[];
  quests: Quest[];
  onFindQuests: () => void;
  isGeneratingQuests: boolean;
  onDailyQuestTrigger?: (type: "complete_quest" | "chat_guide" | "visit_any" | "generate_quest", targetId?: string) => void;
  onForceResetDailyQuests?: () => void;
  onTestLevelUp?: () => void;
}

export default function ShibuyaMap({ player, guide, onSelectQuest, completedQuests, quests, onFindQuests, isGeneratingQuests, onForceResetDailyQuests, onTestLevelUp }: ShibuyaMapProps) {
  const [nearestQuest, setNearestQuest] = useState<Quest>(quests[1] || quests[0] || QUESTS[1]);
  const [showDailyPanel, setShowDailyPanel] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!player.lastDailyReset) return "24h 00m";
      const lastReset = new Date(player.lastDailyReset).getTime();
      const nextReset = lastReset + 24 * 60 * 60 * 1000;
      const now = new Date().getTime();
      const diff = nextReset - now;

      if (diff <= 0) {
        return "Refreshing...";
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      return `${h}h ${m}m ${s}s`;
    };

    // Update once
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [player.lastDailyReset]);

  useEffect(() => {
    if (quests && quests.length > 0) {
      const incomplete = quests.find(q => !completedQuests.includes(q.id)) || quests[0];
      setNearestQuest(incomplete);
    }
  }, [quests, completedQuests]);

  // Simple tilt simulation for player token on mouse movement (for desktop plays)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rx = (window.innerWidth / 2 - e.clientX) / 40;
    const ry = (window.innerHeight / 2 - e.clientY) / 40;
    setTilt({ rx, ry });
  };

  const handleQuestClick = (quest: Quest) => {
    setNearestQuest(quest);
    onSelectQuest(quest);
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-0 bg-dark-grid overflow-hidden flex flex-col justify-between font-sans text-cream"
    >
      {/* MAP BACKGROUND CANVAS */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJFioRUXFeYyYSd6GcRCmLAfELllbX9eTkHQMl9SI-f3SXmEmLriELtByp0Mp1FiaNGEiY2KPMjUN1rPyealEe4-VNfOC4K4z1b-W17bJU0YdmtZE8naTuN32vvEmZnkHX5wqR0DCA8HFYsW6S61kmt5VmmU6sZ6H9UttKKZLOB0iwru0ZYAX2_hT_XDgqLBrIEepQ-wgr02bCxmHKRjCH0a4hIclgrc4cFFEmbFv1piimLmQ2LrvPZukIPN4DLoesd-i2MyUigA0q"
          alt="Overhead Shibuya Crossing Map at Night"
          className="w-full h-full object-cover opacity-50 mix-blend-screen grayscale contrast-125"
        />
        {/* Fog of war gradient overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#0D0D0D_95%)] pointer-events-none"></div>
      </div>

      {/* TOP HEADER BAR */}
      <header className="absolute top-0 left-0 w-full z-20 flex justify-between items-center px-4 py-3 bg-dark-panel/90 backdrop-blur-md border-b border-gold/20">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11">
            {/* XP progress ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="22"
                cy="22"
                fill="transparent"
                r="19"
                stroke="rgba(212,175,55,0.1)"
                strokeWidth="2.5"
              ></circle>
              <circle
                cx="22"
                cy="22"
                fill="transparent"
                r="19"
                stroke="#D7263D"
                strokeWidth="2.5"
                strokeDasharray={119}
                strokeDashoffset={119 - (119 * (player.xp % 1000)) / 1000}
                className="transition-all duration-1000"
              ></circle>
            </svg>
            <div className="absolute inset-1 rounded-full overflow-hidden border border-white/10 bg-[#1A1A1A]">
              <img
                src={guide.avatar}
                alt="Guide Profile"
                className="w-full h-full object-cover grayscale"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-crimson text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border border-dark-bg">
              {player.level}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-serif font-black text-gold tracking-wide leading-none uppercase">Meguri</span>
            <span className="text-xs text-cream/70">Exploring Shibuya</span>
          </div>
        </div>

        {/* Currency display */}
        <div className="flex items-center gap-1.5 px-4 py-1.5 bg-dark-card/60 backdrop-blur-md border border-gold/30 rounded-full shadow-lg shadow-gold/5">
          <Diamond className="w-4 h-4 text-gold fill-gold" />
          <span className="text-xs font-bold tracking-wider uppercase text-gold font-display">
            {player.kakera} Kakera
          </span>
        </div>
      </header>

      {/* DAILY QUESTS FLOATING BUTTON */}
      <div className="absolute top-20 left-4 z-10">
        <button
          onClick={() => setShowDailyPanel(!showDailyPanel)}
          className={`flex items-center gap-2 px-4 py-2.5 transition-all active:scale-95 text-xs font-mono font-bold uppercase tracking-widest rounded-xl border cursor-pointer pointer-events-auto ${
            showDailyPanel 
              ? "bg-gold/20 text-gold border-gold/40 shadow-[0_0_15px_rgba(218,165,32,0.35)] font-bold" 
              : "bg-dark-panel/90 text-gold/80 hover:text-gold border-gold/20 shadow-lg"
          }`}
        >
          <Compass className="w-4 h-4 text-gold" />
          <span>Daily Quests</span>
        </button>
      </div>

      {/* DAILY QUESTS EXPANDED SIDE PANEL */}
      <AnimatePresence>
        {showDailyPanel && (
          <motion.div
            initial={{ opacity: 0, x: -50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -30, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="absolute top-36 left-4 right-4 sm:right-auto sm:w-96 z-15 p-5 bg-dark-panel/95 backdrop-blur-md border border-gold/30 rounded-2xl shadow-2xl shadow-black/80 flex flex-col gap-4 pointer-events-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-gold/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-gold" />
                <h3 className="text-sm font-mono font-bold tracking-widest text-gold uppercase">Daily Tasks</h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-crimson bg-crimson/10 px-2 py-0.5 rounded border border-crimson/20">
                Reset: {timeLeft}
              </span>
            </div>

            {/* List */}
            <div className="flex flex-col gap-3">
              {player.dailyQuests && player.dailyQuests.length > 0 ? (
                player.dailyQuests.map((dq, idx) => (
                  <div 
                    key={dq.id || idx} 
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                      dq.completed 
                        ? "bg-gold/5 border-gold/20 opacity-80" 
                        : "bg-dark-card/40 border-white/5"
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="mt-0.5">
                      {dq.completed ? (
                        <div className="w-5 h-5 bg-gold text-dark-bg rounded-md border border-gold flex items-center justify-center shadow-[0_0_8px_rgba(218,165,32,0.4)]">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-md border-2 border-gold/40 flex items-center justify-center bg-transparent" />
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-mono font-bold tracking-wide ${dq.completed ? "text-gold/60 line-through" : "text-cream"}`}>
                        {dq.title}
                      </h4>
                      <p className="text-[11px] text-cream/60 mt-0.5 font-sans leading-relaxed">
                        {dq.description}
                      </p>

                      {/* Reward pills */}
                      <div className="flex gap-2 mt-2">
                        <span className="text-[9px] font-mono font-bold text-gold/90 bg-gold/5 border border-gold/10 px-1.5 py-0.5 rounded">
                          +{dq.rewardXp} XP
                        </span>
                        <span className="text-[9px] font-mono font-bold text-crimson/90 bg-crimson/5 border border-crimson/10 px-1.5 py-0.5 rounded">
                          +{dq.rewardKakera} Kakera
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-cream/40 italic font-sans">
                  No active daily quests. Rebuilding space...
                </div>
              )}
            </div>

            {/* Completion Progress Bar */}
            {player.dailyQuests && player.dailyQuests.length > 0 && (
              <div className="pt-2 border-t border-gold/10 flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono font-bold text-gold/80 uppercase">
                  <span>Progress</span>
                  <span>
                    {player.dailyQuests.filter(q => q.completed).length} / 3 Complete
                  </span>
                </div>
                <div className="w-full h-1.5 bg-dark-bg rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gold transition-all duration-500 shadow-[0_0_10px_rgba(218,165,32,0.6)]"
                    style={{ 
                      width: `${(player.dailyQuests.filter(q => q.completed).length / 3) * 100}%` 
                    }}
                  />
                </div>
                {player.dailyQuests.every(q => q.completed) && (
                  <p className="text-[10px] font-mono text-gold text-center font-bold mt-1 animate-pulse">
                    🌟 Perfect daily tasks complete!
                  </p>
                )}
              </div>
            )}

             {/* Force Reset & Test Level Up for Testing / Demo */}
             <div className="flex justify-between items-center pt-2 border-t border-gold/10">
               {onTestLevelUp ? (
                 <button
                   onClick={onTestLevelUp}
                   className="flex items-center gap-1.5 text-[10px] font-mono text-gold/80 hover:text-gold hover:underline transition-all cursor-pointer"
                 >
                   <Sparkles className="w-3 h-3 text-gold" />
                   <span>Level Up (Test)</span>
                 </button>
               ) : <div />}

               {onForceResetDailyQuests && (
                 <button
                   onClick={onForceResetDailyQuests}
                   className="flex items-center gap-1.5 text-[10px] font-mono text-cream/40 hover:text-gold hover:underline transition-all cursor-pointer"
                 >
                   <RefreshCw className="w-3 h-3" />
                   <span>Force Reset (Test)</span>
                 </button>
               )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FIND QUESTS FLOATING BUTTON */}
      <div className="absolute top-20 right-4 z-10">
        <button
          onClick={onFindQuests}
          disabled={isGeneratingQuests}
          className="flex items-center gap-2 px-4 py-2.5 bg-crimson hover:bg-crimson/90 disabled:bg-dark-card/80 disabled:border-white/10 active:scale-95 text-white font-mono font-bold text-xs uppercase tracking-widest rounded-xl border border-gold/20 shadow-[0_4px_15px_rgba(215,38,61,0.4)] transition-all cursor-pointer pointer-events-auto"
        >
          <Sparkles className={`w-4 h-4 text-gold ${isGeneratingQuests ? 'animate-spin' : ''}`} />
          <span>{isGeneratingQuests ? "Whispering..." : "Find Quests"}</span>
        </button>
      </div>

      {/* FLOATING MAP PINS */}
      <div className="absolute inset-0 pointer-events-none">
        {quests.map((quest) => {
          const isCompleted = completedQuests.includes(quest.id);
          const isFeatured = nearestQuest.id === quest.id;

          return (
            <div
              key={quest.id}
              className="absolute pointer-events-auto"
              style={{
                left: `${quest.markerOffsetLeft}%`,
                top: `${quest.markerOffsetTop}%`,
                transform: "translate(-50%, -50%)"
              }}
            >
              <button
                onClick={() => handleQuestClick(quest)}
                className="relative group focus:outline-none flex flex-col items-center"
              >
                {/* Visual feedback wrapper */}
                <div className="relative">
                  {isCompleted ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-600 border-2 border-dark-grid flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.6)]">
                      <Check className="w-4 h-4 text-white stroke-[3]" />
                    </div>
                  ) : isFeatured ? (
                    <div className="relative">
                      {/* Pulse rings */}
                      <span className="absolute -inset-2 rounded-full bg-crimson/20 animate-ping"></span>
                      <motion.div 
                        animate={{ y: [0, -6, 0] }}
                        transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                        className="w-10 h-10 rounded-full bg-crimson border-2 border-dark-grid flex items-center justify-center shadow-[0_0_20px_#D7263D] relative z-10"
                      >
                        <Sparkles className="w-5 h-5 text-white fill-white" />
                      </motion.div>
                    </div>
                  ) : (
                    <div className="relative">
                      <span className="absolute -inset-1 rounded-full bg-gold/20 animate-pulse"></span>
                      <div className="w-6 h-6 rounded-full bg-[#1A1A1A] border-2 border-gold/40 flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.4)]">
                        <MapPin className="w-3.5 h-3.5 text-gold" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Micro hover card */}
                {isFeatured && (
                  <div className="absolute top-11 bg-dark-card/95 backdrop-blur-md border border-gold/30 px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap z-20">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-gold uppercase">
                      GPS ACTIVE
                    </span>
                  </div>
                )}
              </button>
            </div>
          );
        })}

        {/* PLAYER AVATAR TOKEN */}
        <div 
          className="absolute z-10 transition-transform duration-300"
          style={{
            left: "45%",
            top: "55%",
            transform: `translate(-50%, -50%) rotateY(${tilt.rx}deg) rotateX(${tilt.ry}deg)`
          }}
        >
          <div className="relative w-12 h-12 flex items-center justify-center">
            {/* Outer halo */}
            <div className="absolute -inset-2 bg-crimson/20 rounded-full blur-md animate-pulse"></div>
            {/* Avatar border with dynamic glow */}
            <div className="w-11 h-11 rounded-full border-2 border-crimson bg-dark-bg overflow-hidden shadow-[0_0_15px_rgba(215,38,61,0.7)]">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjJ18kX4GteHr-xIriXK2PRui8Tno8yQyjFwBiaM4V9DfBrcedmS4JXnU-rHhVMbWA4-5xNh5gTRbSqvMqAvXZLj5JcVlkG9mxMT-lLthqrJ1GkwlyG8TIL2nLtwY2cyHVmog0Aom_BXJjepxATF1il1D5zaJWKfF8zKXP9kPZEaEMxVXx7GWOiZY2kNIQ-dNtHemOgtgqi-i17Odn81Tdkh7KlreXI8TBTQW-lFcNAx-eSDWGJ2sGIudmS-eiuzwxgRfuXrll3-dE"
                alt="Wanderer Token"
                className="w-full h-full object-cover grayscale"
              />
            </div>
            {/* Small compass needle pointer */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2">
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-crimson"></div>
            </div>
          </div>
        </div>

        {/* TEAMMATE TOKENS (Part of co-op/social presence seed) */}
        <div className="absolute left-[50%] top-[52%] opacity-85 scale-75">
          <div className="w-10 h-10 rounded-full border-2 border-gold bg-dark-card overflow-hidden shadow-md">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhI6N1oUxJzXSbTF-P3DdNLWq1Bed99M07VHrru6Jhc_fyLSTNbW_7Eyudntwhd1RZ9ur7xjF-vuGXcXQ3zfiokMPPJjmCuKdicug-44PmB4yH-oqA4tua0_I3ykpMHm3HV1nqy4IYAfgVA5BRGvEUdvMkuhQu7-Sssi3Xfpp5mOiEzUlNgKzIbYIZUQqusrgUL1MnR1ewyD2llnuGweTTjP6jL3lG_VcElMMsaPyqwWK7uIKFl_M3aBFFD3P0ctXAJNkXrtxc_3wQ"
              alt="Teammate Ren"
              className="w-full h-full object-cover grayscale"
            />
          </div>
        </div>
      </div>

      {/* PEEKING CARD: Nearest Quest Bottom Sheet Anchor */}
      <div className="absolute bottom-24 left-0 w-full px-6 z-10 pointer-events-none">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          onClick={() => onSelectQuest(nearestQuest)}
          className="pointer-events-auto bg-dark-panel/95 backdrop-blur-md border border-gold/30 p-5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.75)] cursor-pointer flex flex-col gap-3 group hover:border-crimson/40 transition-all duration-300"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold tracking-widest text-gold uppercase">
                {completedQuests.includes(nearestQuest.id) ? "QUEST COMPLETED" : "NEAREST QUEST"}
              </span>
              <h2 className="text-xl font-serif font-bold tracking-tight text-cream group-hover:text-gold transition-colors leading-tight">
                {nearestQuest.title}
              </h2>
            </div>
            <div className="bg-crimson/15 border border-crimson/30 px-2.5 py-1 rounded-lg">
              <span className="text-xs font-mono font-extrabold text-crimson">{nearestQuest.distance}</span>
            </div>
          </div>

          <p className="text-sm text-cream/80 italic font-serif line-clamp-1">
            &ldquo;{nearestQuest.guideHook}&rdquo;
          </p>

          <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1">
            <div className="flex items-center gap-1.5 text-cream/50 font-mono">
              <Navigation className="w-3.5 h-3.5 text-gold" />
              <span className="text-[10px] font-bold tracking-wider uppercase">
                {nearestQuest.walkTime}
              </span>
            </div>
            
            <div className="flex items-center gap-1 text-sm font-bold text-crimson font-serif">
              <span>Begin Journey</span>
              <span className="text-lg transition-transform group-hover:translate-x-1 duration-200">→</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
