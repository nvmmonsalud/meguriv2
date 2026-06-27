import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Trophy, Award, Landmark, Play } from "lucide-react";

interface LevelUpModalProps {
  level: number;
  onClose: () => void;
}

interface Particle {
  id: number;
  left: string;
  color: string;
  size: string;
  delay: string;
  duration: string;
}

export default function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  // Generate randomized particles for falling confetti
  useEffect(() => {
    const colors = ["#D4AF37", "#D7263D", "#FDF7E4", "#FF5733", "#C70039"];
    const sizes = ["4px", "6px", "8px", "10px", "12px"];
    
    const newParticles = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: sizes[Math.floor(Math.random() * sizes.length)],
      delay: `${Math.random() * 3}s`,
      duration: `${3 + Math.random() * 3}s`,
    }));
    
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-md overflow-hidden p-6 font-sans">
      {/* Background glowing rings */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="absolute w-[300px] h-[300px] rounded-full border border-gold/10 firework-ring" style={{ animationDelay: "0s" }}></div>
        <div className="absolute w-[450px] h-[450px] rounded-full border border-crimson/10 firework-ring" style={{ animationDelay: "0.5s" }}></div>
        <div className="absolute w-[600px] h-[600px] rounded-full border border-gold/5 firework-ring" style={{ animationDelay: "1s" }}></div>
        
        {/* Rotating sunburst/rays */}
        <div className="absolute w-[800px] h-[800px] rounded-full border border-gold/5 animate-spin-slow bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent opacity-40"></div>
      </div>

      {/* Confetti particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="confetti-particle"
            style={{
              left: p.left,
              backgroundColor: p.color,
              width: p.size,
              height: p.size,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      {/* Main card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="relative max-w-sm w-full bg-dark-panel/95 border border-gold/40 p-8 rounded-3xl shadow-[0_0_50px_rgba(218,165,32,0.3)] text-center flex flex-col items-center gap-6"
      >
        {/* Decorative corner borders */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-gold/60 rounded-tl-lg"></div>
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-gold/60 rounded-tr-lg"></div>
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-gold/60 rounded-bl-lg"></div>
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-gold/60 rounded-br-lg"></div>

        {/* Level Up Crest Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-gold/25 blur-xl rounded-full scale-110 animate-pulse"></div>
          <motion.div
            animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
            transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 5 }}
            className="relative w-20 h-20 bg-gradient-to-br from-gold to-crimson rounded-2xl flex items-center justify-center border-2 border-cream/30 shadow-[0_4px_20px_rgba(215,38,61,0.4)]"
          >
            <Award className="w-10 h-10 text-cream stroke-[2]" />
          </motion.div>
        </div>

        {/* Japanese & English Headings */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold text-gold tracking-[0.4em] uppercase block">
            限界突破 &bull; LIMIT BREAK
          </span>
          <h2 className="font-serif text-3xl font-black text-cream tracking-wide uppercase">
            Level Up!
          </h2>
        </div>

        {/* Level Banner Widget */}
        <div className="w-full bg-dark-card border border-gold/20 rounded-2xl py-4 px-6 flex items-center justify-center gap-6 shadow-inner relative overflow-hidden">
          <div className="absolute inset-0 bg-gold/5 pointer-events-none"></div>
          
          <div className="text-left">
            <span className="text-[9px] font-mono text-cream/45 uppercase tracking-wider block">Previous</span>
            <span className="text-xl font-mono font-bold text-cream/60">{level - 1}</span>
          </div>

          {/* Right-pointing arrow indicator */}
          <div className="text-gold/60 font-serif text-xl animate-pulse">&rarr;</div>

          <div className="text-center">
            <span className="text-[10px] font-mono font-bold text-gold uppercase tracking-wider block">New Rank</span>
            <span className="text-4xl font-mono font-black text-gold drop-shadow-[0_0_10px_rgba(218,165,32,0.5)]">
              {level}
            </span>
          </div>
        </div>

        {/* Lore / Congrats copy */}
        <p className="text-xs text-cream/80 leading-relaxed font-sans max-w-[280px]">
          Your ethereal spirit footprint deepens in Shibuya. The ancient shrines are resounding with your growth.
        </p>

        {/* Level Rewards Highlight */}
        <div className="w-full space-y-2 border-t border-b border-white/5 py-4 my-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-cream/65">Kakera Limit</span>
            <span className="text-gold font-bold">Expanded</span>
          </div>
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-cream/65">Spirit Bond</span>
            <span className="text-gold font-bold">+10% Resonance</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onClose}
          className="w-full h-12 bg-crimson hover:bg-crimson/95 text-white font-black text-xs uppercase tracking-[0.3em] rounded-xl shadow-[0_0_15px_rgba(215,38,61,0.4)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-white" />
          <span>RECEIVE BLESSING</span>
        </button>
      </motion.div>
    </div>
  );
}
