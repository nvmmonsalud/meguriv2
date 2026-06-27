import React from "react";
import { motion } from "motion/react";
import { X, Navigation, Award, Users, Image as ImageIcon, Map, ChevronRight } from "lucide-react";
import { Quest, Guide } from "../types";

interface QuestDetailsProps {
  quest: Quest;
  guide: Guide;
  onClose: () => void;
  onStartSolo: () => void;
  onStartParty: () => void;
  isCompleted: boolean;
}

export default function QuestDetails({ quest, guide, onClose, onStartSolo, onStartParty, isCompleted }: QuestDetailsProps) {
  return (
    <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex justify-center items-end px-4">
      {/* Background Dimmer Dismissal */}
      <div className="absolute inset-0 z-0" onClick={onClose}></div>

      {/* Sheet Container */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="relative z-10 w-full max-w-xl bg-dark-panel border-t border-gold/30 rounded-t-[32px] p-6 shadow-[0_-8px_32px_rgba(0,0,0,0.85)] flex flex-col gap-6 overflow-y-auto max-h-[85vh] custom-scrollbar"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M20 0l20 20-20 20L0 20zm0 5.86L34.14 20 20 34.14 5.86 20z' fill='%23D4AF37' fill-opacity='0.015'/%3E%3C/svg%3E")`
        }}
      >
        {/* Draggable Handle */}
        <div className="w-full flex justify-center cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gold/30 rounded-full"></div>
        </div>

        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-dark-card border border-gold/20 rounded-full flex items-center justify-center hover:bg-gold/15 transition-colors"
        >
          <X className="w-5 h-5 text-gold" />
        </button>

        {/* Spirit Guide Quote Hook */}
        <div className="flex items-start gap-4 bg-dark-card border border-gold/15 p-4 rounded-2xl">
          <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(215,38,61,0.25)] border border-gold/25">
            <img src={guide.avatar} alt={guide.name} className="w-full h-full object-cover grayscale" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold tracking-widest text-gold uppercase">
              Spirit Guide: {guide.name}
            </span>
            <p className="text-sm font-serif italic text-cream/90 leading-relaxed">
              &ldquo;{quest.guideHook}&rdquo;
            </p>
          </div>
        </div>

        {/* Quest title & narrative */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-crimson/15 border border-crimson/30 rounded-md text-[10px] font-mono font-bold tracking-widest text-crimson uppercase">
              SHIBUYA SECTOR
            </span>
            {isCompleted && (
              <span className="px-2.5 py-1 bg-emerald-600/15 border border-emerald-500/30 rounded-md text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                COMPLETED
              </span>
            )}
          </div>
          <h1 className="text-3xl font-serif font-black text-white leading-tight">
            {quest.title}
          </h1>
          <p className="text-sm text-cream/95 leading-relaxed font-sans pr-4">
            {quest.description}
          </p>
        </div>

        {/* Quest Checklist / Requirements */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold tracking-widest text-gold uppercase">
            Quest Checklist
          </h3>
          <div className="space-y-2">
            {quest.steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3.5 p-4 bg-dark-card border border-gold/10 rounded-xl"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full border border-crimson text-crimson text-xs font-display font-bold bg-crimson/5 shrink-0">
                  {idx + 1}
                </div>
                <span className="text-sm font-medium text-cream">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mini route map visual */}
        <div className="p-4 rounded-2xl bg-dark-card border border-gold/20 space-y-3">
          <div className="flex justify-between items-center text-xs font-mono font-bold text-gold tracking-widest uppercase">
            <span className="flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-crimson" />
              {quest.walkTime} &bull; {quest.distance}
            </span>
            <span>{quest.mapsContextToken ? "LIVE GOOGLE GROUNDING" : "MAP RESOLVED"}</span>
          </div>
          {quest.mapsContextToken ? (
            <div className="rounded-xl overflow-hidden border border-gold/20 bg-[#1A1A1A] p-3 text-cream text-xs flex flex-col gap-2">
              <div 
                className="google-maps-widget text-cream leading-relaxed font-sans"
                dangerouslySetInnerHTML={{ __html: quest.mapsContextToken }}
              />
              <div className="text-[10px] text-cream/40 font-mono text-center mt-1">
                Verified with real-time Google Maps and Search grounding
              </div>
            </div>
          ) : (
            <div className="h-28 w-full rounded-xl overflow-hidden border border-gold/20 bg-dark-grid">
              {/* Using a neat top-down path visual URL */}
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCT2TydxBrnFhVEWIsAZFwB1svRyj8zVywV8wrlpimtyUAhmSib1yZKtl_FlI__WZTquO3XyjOrgG1DOpXqsnTji_g1JOG2uwmvqU3e1tlW2kVknLKonzpLxZfJ_8sCPfiv49zFU8ZiJSE41oGQjILBB6PL7jNTuilhHsfW8X5mzjoK7KgCPA0SAtzHhBQWC_UyPFpSKAxOCBSbYGFSzx3Vh5V7k66CwSTmUkWX2Wrot4iky7jx73_H5HAQtyOVxjPQ9V8GInqeSlVU"
                alt="Mini Quest Path Map"
                className="w-full h-full object-cover opacity-50 grayscale contrast-125"
              />
            </div>
          )}
        </div>

        {/* Rewards section */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold tracking-widest text-gold uppercase">
            Potential Rewards
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-dark-card border border-gold/20 rounded-xl flex flex-col items-center text-center">
              <div className="w-12 h-14 bg-white/5 border border-dashed border-gold/30 rounded-md flex items-center justify-center mb-2">
                <ImageIcon className="w-6 h-6 text-crimson/50" />
              </div>
              <span className="text-[10px] font-mono font-bold tracking-wider text-cream uppercase">
                Ukiyo-e Postcard
              </span>
            </div>

            <div className="p-4 bg-dark-card border border-gold/20 rounded-xl flex flex-col items-center text-center">
              <div className="w-12 h-14 flex items-center justify-center mb-2">
                <Award className="w-10 h-10 text-gold" />
              </div>
              <span className="text-[10px] font-display font-bold tracking-wider text-gold uppercase">
                +{quest.rewardKakera} Kakera &bull; {quest.rewardXp} XP
              </span>
            </div>
          </div>
        </div>

        {/* Action button triggers */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={onStartSolo}
            className="w-full h-14 bg-crimson hover:bg-crimson/90 active:scale-[0.98] text-white font-black text-sm uppercase tracking-[0.3em] rounded-xl shadow-[0_0_20px_rgba(215,38,61,0.4)] transition-all flex items-center justify-center gap-2"
          >
            <Map className="w-5 h-5 text-white" />
            <span>{isCompleted ? "Re-discover Solo" : "Verify Arrival"}</span>
          </button>

          <button
            onClick={onStartParty}
            className="w-full h-14 bg-transparent hover:bg-gold/5 active:scale-[0.98] border-2 border-gold/40 text-gold font-black text-sm uppercase tracking-[0.3em] rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Users className="w-5 h-5" />
            <span>Join Shibuya Raiders</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
