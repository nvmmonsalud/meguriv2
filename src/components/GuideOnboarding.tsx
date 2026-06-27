import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Compass, Volume2, User } from "lucide-react";
import { GUIDES } from "../data";
import { Guide } from "../types";

interface GuideOnboardingProps {
  onComplete: (playerName: string, guideId: string) => void;
}

export default function GuideOnboarding({ onComplete }: GuideOnboardingProps) {
  const [selectedGuide, setSelectedGuide] = useState<Guide>(GUIDES[0]);
  const [playerName, setPlayerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    setIsSubmitting(true);
    // Simulate brief transition loading
    setTimeout(() => {
      onComplete(playerName.trim(), selectedGuide.id);
    }, 800);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-[#161320] washi-texture text-[#e7dff2] font-sans px-6 py-8">
      {/* Seigaiha Wave Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-repeat bg-center" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='40' viewBox='0 0 80 40'%3E%3Cpath d='M0 40c0-2.2 1.8-4 4-4s4 1.8 4 4m0 0c0-2.2 1.8-4 4-4s4 1.8 4 4m0 0c0-2.2 1.8-4 4-4s4 1.8 4 4m0 0c0-2.2 1.8-4 4-4s4 1.8 4 4m-36 0c0-4.4 3.6-8 8-8s8 3.6 8 8m0 0c0-4.4 3.6-8 8-8s8 3.6 8 8m0 0c0-4.4 3.6-8 8-8s8 3.6 8 8m-28 0c0-6.6 5.4-12 12-12s12 5.4 12 12m0 0c0-6.6 5.4-12 12-12s12 5.4 12 12m-20 0c0-8.8 7.2-16 16-16s16 7.2 16 16' fill='%23ffffff' fill-rule='evenodd'/%3E%3C/svg%3E")` }}>
      </div>

      {/* Floating Ambient Orbs */}
      <div className="absolute w-64 h-64 bg-[#ffb4a6]/10 rounded-full filter blur-[80px] -left-32 top-1/4 pointer-events-none"></div>
      <div className="absolute w-80 h-80 bg-[#8e7fff]/10 rounded-full filter blur-[100px] -right-40 bottom-1/4 pointer-events-none"></div>

      {/* Header */}
      <header className="z-10 flex flex-col items-center py-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2"
        >
          <Compass className="w-6 h-6 text-[#ffb4a6]" />
          <h1 className="text-xl font-bold tracking-[0.2em] uppercase text-[#ffb4a6]">Meguri</h1>
        </motion.div>
      </header>

      {/* Hero Narrative */}
      <main className="z-10 flex-1 flex flex-col items-center justify-center gap-8 max-w-md mx-auto w-full">
        <div className="text-center space-y-2">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-3xl md:text-4xl font-bold tracking-tight text-[#e7dff2]"
          >
            Every wanderer needs a guide.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-base text-[#e2beb8]"
          >
            Choose your spiritual guide for Tokyo.
          </motion.p>
        </div>

        {/* Guides Carousel */}
        <div className="w-full flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide no-scrollbar px-2">
          {GUIDES.map((guide, idx) => (
            <motion.div
              key={guide.id}
              onClick={() => setSelectedGuide(guide)}
              whileTap={{ scale: 0.98 }}
              className={`flex-shrink-0 w-72 snap-center rounded-2xl p-4 flex flex-col gap-4 cursor-pointer transition-all duration-300 ${
                selectedGuide.id === guide.id
                  ? "bg-[#211e2b]/95 border-2 border-[#E94F37] shadow-[0_0_25px_rgba(233,79,55,0.25)] scale-[1.02]"
                  : "bg-[#211e2b]/65 border border-white/10 opacity-70 scale-95"
              }`}
            >
              <div className="aspect-[3/4] rounded-xl overflow-hidden relative border border-white/5 bg-[#14111e]">
                <img
                  src={guide.avatar}
                  alt={guide.name}
                  className="w-full h-full object-cover transition-all duration-500 hover:scale-105"
                />
                <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-[#14111e] to-transparent">
                  <span className="text-xs font-bold tracking-wider text-[#f0c04d] uppercase bg-black/40 px-2..5 py-0.5 rounded-full border border-[#f0c04d]/20">
                    {guide.title}
                  </span>
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-[#e7dff2]">{guide.name}</h3>
                <p className="text-sm text-[#e2beb8]/85 italic line-clamp-2">
                  &ldquo;{guide.description}&rdquo;
                </p>
                <div className="flex items-center gap-1.5 pt-2 text-[#f0c04d]">
                  <Volume2 className="w-4 h-4" />
                  <span className="text-[10px] font-bold tracking-widest uppercase">
                    VOICE: {guide.voice}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Player Information Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold tracking-widest text-[#e2beb8] uppercase px-1">
              Wanderer Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ffb4a6]/60" />
              <input
                type="text"
                required
                maxLength={15}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full h-14 bg-[#211e2b]/80 border border-white/15 rounded-xl pl-12 pr-4 text-[#e7dff2] text-base placeholder-[#e2beb8]/30 focus:outline-none focus:border-[#E94F37] focus:ring-1 focus:ring-[#E94F37] transition-all"
              />
            </div>
          </div>
        </form>
      </main>

      {/* CTA Button */}
      <footer className="z-10 py-4 max-w-md mx-auto w-full">
        <motion.button
          disabled={!playerName.trim() || isSubmitting}
          onClick={handleSubmit}
          whileTap={{ scale: 0.95 }}
          className={`w-full h-14 rounded-xl text-white font-bold text-lg transition-all shadow-[0_4px_20px_rgba(233,79,55,0.3)] duration-200 flex items-center justify-center gap-2 ${
            !playerName.trim() 
              ? "bg-[#363341] opacity-50 cursor-not-allowed text-white/50" 
              : "bg-[#E94F37] hover:bg-[#E94F37]/90 active:scale-[0.98]"
          }`}
        >
          {isSubmitting ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-[#f0c04d]" />
              <span>Begin in Shibuya</span>
            </>
          )}
        </motion.button>
      </footer>
    </div>
  );
}
