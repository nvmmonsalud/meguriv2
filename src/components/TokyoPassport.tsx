import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Award, Compass, MapPin, Sparkles, Diamond, Footprints, Flame, Trophy, Lock, Eye, Calendar } from "lucide-react";
import { Quest, Player, PassportItem } from "../types";
import { QUESTS } from "../data";

interface TokyoPassportProps {
  player: Player;
  passportItems: PassportItem[];
}

export default function TokyoPassport({ player, passportItems }: TokyoPassportProps) {
  const [selectedItem, setSelectedItem] = useState<PassportItem | null>(null);

  // Pre-seed cards if list is empty for demo play, ensuring beautiful visual engagement
  const defaultCollectedPostcards = [
    {
      id: "shibuya_crossing",
      questId: "hachiko",
      title: "The Loyal Guardian",
      locationName: "Shibuya Crossing Plaza",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDCKYAUsXR5C0nygzc1yq37u6zQtX2frcUqg-MPD_4cLk0f2bKdSh0cdA6abmMVKW34E-1X5sIf7XcThToDV6f2gbOTfsCYbIzmBGpL99sgwI5MrhNEQfbqQEDn34Sh0YnW8OqKVv8VfhTL8oRK5B0bhZ9RWyEj04dY8QEA41B-Ik92fqtUevTp6_e6pry715Jkkyc3t0JRUHJq_8igbn42cYRspbSUTMNw8ihCLODQTXUMX3U6SEN4EHIgjm3Bveiu3X9fSi8GWTct",
      unlockedAt: new Date().toISOString(),
      spiritMessage: "Stand where millions cross, but see the single faithful heart."
    },
    {
      id: "meiji_jingu",
      questId: "meiji_gate",
      title: "The Floating Gate",
      locationName: "Meiji Jingu Forest",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDAHWQ0hMtzpodZtXTVFyqBcIxHcCbWoq17EXZBrkpQTMmEBxvt028X8yZfShNmYIq-qOmPXMuxRFHi9zJ7lUQWkYkKyxbCUwln8O43HhaiKtqMMMFBcEP0VUpRLVROfwXI1ppEsgtuOG_qMT7PRVCsb1823hGp-ltqTCFrmL4fFbxqYnqCXpSuxDdTuvnapRoNLE-XnZMTqz20C_9haGLJwwpvtCfwRfNhL7_UZUj4kO2c7qi6WaaV6QFIVYh4sUqKX0Jdc9PDRSZP",
      unlockedAt: new Date().toISOString(),
      spiritMessage: "Walk slowly; the pavement has stories to tell in the sacred green."
    },
    {
      id: "tokyo_tower",
      questId: "tokyo_tower",
      title: "The Vermilion Spire",
      locationName: "Tokyo Tower Overlook",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCyvk3rtmTyES-O160613-N60k-3DruRjXWjzI_uZyKROaTQ-LzXp6GGqSAFR2lKMD8MYbKW4uLDl1O04FWQtOp_W5iKU9QzLfNRupUNG3BNBRxrJSuMd2AfSP0lVUQav9rKeancjubdT9dlqQrwnEVPbPHdFuW5jfQEN5ZI_HK_zKalGcG71je8lZAvVcly3LJ7-QbmUt8pfPFsETIpsvZ0LujQR8udKunO1YnJXzK44a2lrOCo3AjvLF0rMYMbVaBtcXtDAxwUjrg",
      unlockedAt: new Date().toISOString(),
      spiritMessage: "Tokyo burns red in the indigo dark, a physical dream made of steel."
    }
  ];

  // Merge default collected cards for full portfolio experience
  const displayItems = [...defaultCollectedPostcards, ...passportItems];

  const lockedSectors = [
    { id: "lock1", name: "Asakusa Gate", bg: "https://lh3.googleusercontent.com/aida-public/AB6AXuAa8b-0HF5keBb-m4QMUF8AnpWW6-3i_MO1_qGuuQcgiqTFfFRWqbyGAmyRIObVBi_jz2c5TsWob-lrPBvi4USY07aVSCficRhBhpBcAVyc-jb8d9cOwenZWKz9zRszHcnFuoQvOM2n7Uz3qfAe3S2c008RJ4wJbd-R2vZQBbnFqrrPfoHyvF8xBDWAAa8KMqsCrsk9CNweaYh5c7O2ODXVYQwzcjdY_D-hiwVsOQh6Y_30KyIm0-CoopjKtogaYhdhoXIcQwWesDz5" },
    { id: "lock2", name: "Akihabara Core", bg: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnrkMTOv9ng3N9HLnI3kJWCHABGmeQg-pPzpv7MKZeU2rJyhaBbP6GKOWWYXYFKV742T8ZhPJT3rq-Tu7ZrQdyi7zH2rxIl9mcLLRuZt1u5aDF3maMfMCW5aP0w4b94b6vbuEYhemI754pHRNyx_bv90JZAdofoetYdYya15NV6Xi1MYlkZ1dXqw5PdbWfugLjS5W26g7DjjMBoOTDDwWYK8M8BYFsAQwk03w8PMWRDIlVOrjnHvDlvkPSI_NV2e0hQTLOQX_pFMmh" },
    { id: "lock3", name: "Imperial Moat", bg: "https://lh3.googleusercontent.com/aida-public/AB6AXuDApMW1d1kQz9jFWAEmeFnYbx-LDEISdFh9rXBbVZgiuuSduPcznlbF6vZofRI12VUxQWcP2EFP7-m3ap0RbUPW5YlJZxrVKoF54jUIQnkTBeAFLDqGiC9f-LrYv24LRAT-5qusbD2sXuh_H8sZEM9RnY0wu-rQUWJWOQ-sHK5aawra9gNf9HlabcoP0m46ERYNrNuc70F5eO3h3Dk1hgGL9uA5tWjisUldFQApA-g89thC_l-PklIj0BenuIZs4h0Az2rpVw2Dd0hU" }
  ];

  const totalCompleted = 12 + passportItems.length;

  return (
    <div className="min-h-screen bg-dark-bg pb-32 font-sans text-cream washi-texture px-6 pt-24 overflow-y-auto">
      
      {/* Passport Title Section */}
      <section className="space-y-4 max-w-md mx-auto">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-3xl font-serif font-black text-white">Your Tokyo</h2>
            <p className="text-xs text-gold/70 uppercase tracking-widest font-mono font-bold">
              Explorer's Journey Passport
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-gold">
            {totalCompleted} of 88 places
          </span>
        </div>

        {/* Global Progress Level Ring */}
        <div className="w-full h-2.5 bg-dark-card border border-gold/15 rounded-full overflow-hidden relative">
          <div 
            className="h-full bg-emerald-600 rounded-full shadow-[0_0_8px_#10B981] transition-all duration-1000"
            style={{ width: `${(totalCompleted / 88) * 100}%` }}
          />
        </div>
      </section>

      {/* Stats Quick Strip Grid */}
      <section className="grid grid-cols-3 gap-3 border-y border-gold/20 py-5 my-6 max-w-md mx-auto text-center">
        <div className="space-y-1">
          <p className="text-lg font-display font-bold text-crimson flex items-center justify-center gap-1">
            <Footprints className="w-4 h-4 text-gold" />
            <span>14.2km</span>
          </p>
          <span className="text-[10px] font-mono font-bold text-gold/60 tracking-wider uppercase">
            walked
          </span>
        </div>
        
        <div className="space-y-1 border-x border-gold/20">
          <p className="text-lg font-display font-bold text-crimson">
            {totalCompleted}
          </p>
          <span className="text-[10px] font-mono font-bold text-gold/60 tracking-wider uppercase">
            quests done
          </span>
        </div>

        <div className="space-y-1">
          <p className="text-lg font-display font-bold text-gold flex items-center justify-center gap-1">
            <Flame className="w-4 h-4 text-crimson" />
            <span>4 days</span>
          </p>
          <span className="text-[10px] font-mono font-bold text-gold/60 tracking-wider uppercase">
            streak
          </span>
        </div>
      </section>

      {/* Postcards Collection album */}
      <section className="space-y-4 max-w-md mx-auto">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-lg font-serif font-bold text-white tracking-wide">Postcard Collection</h3>
          <span className="text-xs text-crimson font-mono font-bold cursor-pointer">View All ({displayItems.length})</span>
        </div>

        {/* Collected and Locked cards Grid */}
        <div className="grid grid-cols-3 gap-3">
          {displayItems.map((item) => (
            <motion.div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              whileTap={{ scale: 0.95 }}
              className="bg-dark-card border border-gold/20 rounded-xl overflow-hidden aspect-[3/4] shadow-md cursor-pointer hover:border-crimson/40 transition-all relative group"
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 grayscale opacity-90"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all"></div>
            </motion.div>
          ))}

          {/* Locked Silhouette Placeholders */}
          {lockedSectors.map((lock) => (
            <div
              key={lock.id}
              className="bg-dark-grid border border-gold/10 rounded-xl overflow-hidden aspect-[3/4] relative shadow-inner grayscale opacity-45"
            >
              <img
                src={lock.bg}
                alt={lock.name}
                className="w-full h-full object-cover brightness-[0.2]"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-cream/20">
                <Lock className="w-5 h-5 text-gold/30" />
                <span className="text-[8px] font-mono font-bold tracking-widest uppercase">{lock.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Earned Badges Section Block */}
      <section className="space-y-4 mt-6 max-w-md mx-auto">
        <h3 className="text-lg font-serif font-bold text-white tracking-wide px-1">Earned Badges</h3>
        <div className="grid grid-cols-3 gap-2 bg-dark-panel border border-gold/20 rounded-2xl p-4">
          
          <div className="flex flex-col items-center text-center gap-2 group cursor-pointer">
            <div className="w-14 h-14 rounded-full bg-gold/10 border-2 border-gold flex items-center justify-center shadow-[0_0_12px_rgba(212,175,55,0.2)]">
              <Trophy className="w-6 h-6 text-gold" />
            </div>
            <span className="text-[10px] font-bold text-cream leading-tight">
              Shibuya<br />Initiate
            </span>
          </div>

          <div className="flex flex-col items-center text-center gap-2 group cursor-pointer">
            <div className="w-14 h-14 rounded-full bg-emerald-600/10 border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold text-cream leading-tight">
              Night<br />Owl
            </span>
          </div>

          <div className="flex flex-col items-center text-center gap-2 group cursor-pointer">
            <div className="w-14 h-14 rounded-full bg-crimson/10 border-2 border-crimson flex items-center justify-center shadow-[0_0_12px_rgba(215,38,61,0.2)]">
              <Award className="w-6 h-6 text-crimson" />
            </div>
            <span className="text-[10px] font-bold text-cream leading-tight">
              Shrine<br />Seeker
            </span>
          </div>
          
        </div>
      </section>

      {/* Atmospheric Poetical Quote footer */}
      <section className="py-8 text-center opacity-75 max-w-md mx-auto">
        <p className="font-serif italic text-sm text-cream pr-4 pl-4">
          &ldquo;The journey is the only home.&rdquo;
        </p>
        <span className="text-[10px] font-mono font-bold tracking-widest text-gold uppercase mt-1 inline-block">
          &mdash; Basho
        </span>
      </section>

      {/* FULL PREVIEW MODAL ON CLICK */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
            {/* Modal Dimmer Backdrop click */}
            <div className="absolute inset-0 z-0" onClick={() => setSelectedItem(null)}></div>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 w-full max-w-sm bg-[#FDF7E4] rounded-3xl p-5 shadow-2xl border border-gold/30"
              style={{
                backgroundImage: `url("https://www.transparenttextures.com/patterns/natural-paper.png")`,
                backgroundRepeat: "repeat"
              }}
            >
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-inner border border-gold/20 bg-dark-bg">
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover grayscale contrast-125 opacity-90"
                />
                
                {/* Vintage Date Stamp */}
                <div className="absolute top-4 right-4 rotate-[-12deg] opacity-85 mix-blend-multiply pointer-events-none">
                  <div className="border-2 border-dashed border-crimson text-crimson rounded-md px-3 py-0.5 font-bold text-sm bg-transparent">
                    COLLECTED
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 w-full p-5 bg-gradient-to-t from-black/85 to-transparent">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-gold uppercase flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gold" />
                    Unlocked on {new Date(selectedItem.unlockedAt).toLocaleDateString()}
                  </span>
                  <h4 className="text-xl font-serif font-black text-white tracking-wide leading-tight mt-1">
                    {selectedItem.title}
                  </h4>
                  <p className="text-white/80 text-xs flex items-center gap-1.5 mt-0.5 font-serif">
                    <MapPin className="w-3.5 h-3.5 text-crimson" />
                    {selectedItem.locationName}
                  </p>
                </div>
              </div>

              {/* Guide lore footnote */}
              <div className="mt-4 text-center px-1 text-[#322e3d]/90 font-serif italic text-sm leading-relaxed">
                &ldquo;{selectedItem.spiritMessage}&rdquo;
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="w-full mt-4 py-3 bg-crimson hover:bg-crimson/90 text-white font-black text-xs tracking-widest uppercase rounded-xl text-center shadow-md active:scale-95 transition-all cursor-pointer"
              >
                Close Postcard
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
