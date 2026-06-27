import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, UserPlus, Send, MessageSquare, MapPin, ArrowRight, Shield, Award, Sparkles } from "lucide-react";
import { Player, Party, PartyMember, ChatMessage } from "../types";
import { db } from "../lib/firebase";
import { doc, setDoc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";

interface SocialHubProps {
  player: Player;
  onJoinParty: (partyId: string) => void;
  currentParty: Party | null;
  onPartyCreated: (party: Party) => void;
}

export default function SocialHub({ player, onJoinParty, currentParty, onPartyCreated }: SocialHubProps) {
  const [partyCode, setPartyCode] = useState(["", "", "", ""]);
  const [chatMessage, setChatInput] = useState("");
  const [partyChats, setPartyChats] = useState<ChatMessage[]>([
    {
      id: "msg1",
      senderName: "Kenta_99",
      senderAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBMekLwYDGPlmO6CI09sTnkCZUoWEkXjm0dk2OI2o21wvD9FKxq70yT7tjvXvKjDuZVYeRz7EDwfBZ3Lb6myn-MwRWVvNHfiyo7R9rPlTGmZLilqlYHFSuzPJ2grm5p-4jLahHwfqZU_8EecJBDAZf6D3--8l32BTT8bEPyleJW5HNuq4ewKy1c1ih1OD8GR_ldmP3Sw4VaaiM9OS0NnB8ZrI-FJiBthOaWzOBxBXPt9M5pipLcxJKMQFBQn7If4fm3GNwyXRW0l-ok",
      senderId: "kenta",
      text: "I found the shrine entrance! Check the narrow alley behind the ramen place.",
      timestamp: new Date().toISOString()
    }
  ]);

  // Seeded nearby players list matching screenshot 7
  const nearbyWanderers = [
    {
      id: "kenta",
      name: "Kenta_99",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBMekLwYDGPlmO6CI09sTnkCZUoWEkXjm0dk2OI2o21wvD9FKxq70yT7tjvXvKjDuZVYeRz7EDwfBZ3Lb6myn-MwRWVvNHfiyo7R9rPlTGmZLilqlYHFSuzPJ2grm5p-4jLahHwfqZU_8EecJBDAZf6D3--8l32BTT8bEPyleJW5HNuq4ewKy1c1ih1OD8GR_ldmP3Sw4VaaiM9OS0NnB8ZrI-FJiBthOaWzOBxBXPt9M5pipLcxJKMQFBQn7If4fm3GNwyXRW0l-ok",
      distance: "140m away",
      isInvited: false
    },
    {
      id: "sakura",
      name: "Sakura-Chan",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUNpocO8FY7idP9Hl6q5lc3l0dlSRa5r7pgwebP7f7yEgqEfPxFnfTEHIkMRLr5YcyoM9fRQZAhUEmB3utuq1yj0ERDptGAFp7ZYiNxVLicE8lwVW4SP7V35QZCdfs44g7e_AKtYZdkGnirtlKym5yyQN7dGvL0X0o4FjoFkGG1SNld5yArUcjz5smOpij3A1ZNY4XCatmAjPeUwmU_kmsc2POS2vNuaxITqBl9LU2egGgKv6mSR7WIsbjuK4JbF79OdiHsAMgoaV4",
      distance: "320m away",
      isInvited: false
    }
  ];

  const [wanderers, setWanderers] = useState(nearbyWanderers);

  // Manage individual character input fields
  const handleCodeChange = (val: string, index: number) => {
    if (val.length > 1) return;
    const newCode = [...partyCode];
    newCode[index] = val;
    setPartyCode(newCode);

    // Auto-focus next field
    if (val && index < 3) {
      const nextInput = document.getElementById(`code-in-${index + 1}`);
      nextInput?.focus();
    }
    
    // Check if code complete (e.g. 4 digits)
    if (index === 3 && val) {
      const fullCode = newCode.join("");
      onJoinParty(fullCode);
    }
  };

  const handleCreateParty = async () => {
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    const newParty: Party = {
      id: randomCode,
      name: `${player.name}'s Party`,
      leaderId: player.id,
      members: [
        {
          id: player.id,
          name: player.name,
          avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDFmfaExnZ9uJYWiWSn-MyxiXGLmjhhHP8diQ3kznBq0fafzxyP-xzux9u5obY_XVf7JQZtId7J1fcHkMGP85TXecFykw3GcJ-HnbHGU6XHJWbIjzq4VYgCZ_6m6yUiMuX8y2ybTI_XS57KkqjnJFepFgw7JndaW9B16qnSPq1x8Vdme6TQDY2nSStzcnw9PyVNRQj2-dGBdlTBJ7nsv4vLZQdZdG_ycXU8kOBZHadI7Mw-POe3qVeezeqxAbYyHZGcaj6MELETHKfb",
          guideId: player.guideId,
          lat: player.latitude,
          lng: player.longitude,
          isHost: true,
          status: "in-quest"
        },
        {
          id: "kenta_bot",
          name: "Kenta_99",
          avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBMekLwYDGPlmO6CI09sTnkCZUoWEkXjm0dk2OI2o21wvD9FKxq70yT7tjvXvKjDuZVYeRz7EDwfBZ3Lb6myn-MwRWVvNHfiyo7R9rPlTGmZLilqlYHFSuzPJ2grm5p-4jLahHwfqZU_8EecJBDAZf6D3--8l32BTT8bEPyleJW5HNuq4ewKy1c1ih1OD8GR_ldmP3Sw4VaaiM9OS0NnB8ZrI-FJiBthOaWzOBxBXPt9M5pipLcxJKMQFBQn7If4fm3GNwyXRW0l-ok",
          guideId: "riku",
          lat: player.latitude + 0.001,
          lng: player.longitude - 0.0008,
          isHost: false,
          status: "idle"
        }
      ],
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "parties", randomCode), newParty);
      onPartyCreated(newParty);
    } catch (err) {
      console.warn("Failed to create Firestore party (offline fallbacks active):", err);
      // Fallback local state creation
      onPartyCreated(newParty);
    }
  };

  const handleInvite = (id: string) => {
    setWanderers(prev =>
      prev.map(w => (w.id === id ? { ...w, isInvited: true } : w))
    );
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const newMsg: ChatMessage = {
      id: "msg_" + Math.random().toString(36).substring(2, 9),
      senderName: player.name,
      senderAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDFmfaExnZ9uJYWiWSn-MyxiXGLmjhhHP8diQ3kznBq0fafzxyP-xzux9u5obY_XVf7JQZtId7J1fcHkMGP85TXecFykw3GcJ-HnbHGU6XHJWbIjzq4VYgCZ_6m6yUiMuX8y2ybTI_XS57KkqjnJFepFgw7JndaW9B16qnSPq1x8Vdme6TQDY2nSStzcnw9PyVNRQj2-dGBdlTBJ7nsv4vLZQdZdG_ycXU8kOBZHadI7Mw-POe3qVeezeqxAbYyHZGcaj6MELETHKfb",
      senderId: player.id,
      text: chatMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setPartyChats(prev => [...prev, newMsg]);
    setChatInput("");
  };

  return (
    <div className="min-h-screen bg-dark-bg pb-48 font-sans text-cream px-6 pt-24 overflow-y-auto">
      <main className="max-w-md mx-auto space-y-6">
        
        {/* Your Party Section block */}
        <section className="space-y-3">
          <h2 className="text-xl font-serif font-black text-white px-1">Your Party</h2>
          <div className="bg-dark-panel border border-gold/20 rounded-2xl p-5 shadow-lg flex justify-between items-center">
            {/* If part of a party, show members, otherwise show empty states */}
            {currentParty ? (
              currentParty.members.map((member) => (
                <div key={member.id} className="flex flex-col items-center gap-2">
                  <div className="relative w-14 h-14 rounded-full border-2 border-crimson p-0.5 shadow-md">
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover rounded-full" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-dark-panel"></span>
                  </div>
                  <span className="text-[10px] font-bold text-white tracking-wider font-serif">{member.name}</span>
                  <span className="text-[8px] font-mono font-bold text-gold uppercase tracking-widest leading-none">
                    {member.status}
                  </span>
                </div>
              ))
            ) : (
              <>
                <div className="flex flex-col items-center gap-2">
                  <div className="relative w-14 h-14 rounded-full border-2 border-crimson p-0.5 shadow-md">
                    <img 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFmfaExnZ9uJYWiWSn-MyxiXGLmjhhHP8diQ3kznBq0fafzxyP-xzux9u5obY_XVf7JQZtId7J1fcHkMGP85TXecFykw3GcJ-HnbHGU6XHJWbIjzq4VYgCZ_6m6yUiMuX8y2ybTI_XS57KkqjnJFepFgw7JndaW9B16qnSPq1x8Vdme6TQDY2nSStzcnw9PyVNRQj2-dGBdlTBJ7nsv4vLZQdZdG_ycXU8kOBZHadI7Mw-POe3qVeezeqxAbYyHZGcaj6MELETHKfb" 
                      alt={player.name} 
                      className="w-full h-full object-cover rounded-full" 
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-dark-panel animate-ping"></span>
                  </div>
                  <span className="text-[10px] font-bold text-white tracking-wider font-serif">{player.name}</span>
                  <span className="text-[8px] font-mono font-bold text-gold uppercase tracking-widest leading-none">
                    Host
                  </span>
                </div>
                
                <div className="flex flex-col items-center gap-2 opacity-65">
                  <div className="w-14 h-14 rounded-full border border-dashed border-gold/15 bg-dark-card flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-gold/40" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-gold/50 uppercase tracking-wider">Empty</span>
                </div>

                <div className="flex flex-col items-center gap-2 opacity-65">
                  <div className="w-14 h-14 rounded-full border border-dashed border-gold/15 bg-dark-card flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-gold/40" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-gold/50 uppercase tracking-wider">Empty</span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Primary Action Buttons */}
        <section className="space-y-4">
          {!currentParty && (
            <button
              onClick={handleCreateParty}
              className="w-full h-14 bg-crimson text-white font-black uppercase tracking-[0.2em] text-sm rounded-xl shadow-[0_4px_20px_rgba(215,38,61,0.35)] flex items-center justify-center gap-2 hover:bg-crimson/90 active:scale-95 transition-all cursor-pointer"
            >
              <Users className="w-5 h-5" />
              <span>Create Party</span>
            </button>
          )}

          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-gold/60 tracking-widest uppercase px-1">
              Join with Code
            </span>
            <div className="flex gap-3">
              {partyCode.map((digit, idx) => (
                <input
                  key={idx}
                  id={`code-in-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(e.target.value, idx)}
                  className="w-full h-16 bg-dark-card border border-gold/20 rounded-xl text-center text-xl font-bold focus:outline-none focus:border-crimson text-gold transition-all placeholder-white/5"
                  placeholder="•"
                />
              ))}
            </div>
          </div>
        </section>

        {/* Co-Op Limited Event Quest Banner block */}
        <section 
          className="relative overflow-hidden bg-dark-panel border border-gold/25 rounded-2xl p-6 shadow-md"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0l5 15h15l-12 9 5 16-13-10-13 10 5-16-12-9h15z' fill='%23ffffff' fill-opacity='0.02'/%3E%3C/svg%3E")`
          }}
        >
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-1.5 text-crimson">
              <Sparkles className="w-4 h-4 text-crimson" />
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase">Limited Event</span>
            </div>
            <h3 className="text-lg font-serif font-bold text-white tracking-wide leading-tight">
              Take on a Group Quest
            </h3>
            <p className="text-xs text-cream/80 leading-relaxed">
              Split up across the district, scan hidden landmarks simultaneously, and unlock a legendary shared postcard reward.
            </p>
            <button className="flex items-center gap-1 text-gold text-xs font-mono font-bold hover:text-crimson hover:underline transition-all cursor-pointer">
              <span>View local group quests</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute -right-8 -bottom-8 w-36 h-36 opacity-10 pointer-events-none">
            <Users className="w-full h-full text-white" />
          </div>
        </section>

        {/* Nearby Wanderers section */}
        <section className="space-y-3">
          <div className="flex justify-between items-end px-1">
            <h3 className="text-lg font-serif font-bold text-white tracking-wide">Nearby Wanderers</h3>
            <span className="text-[10px] font-mono font-bold text-crimson uppercase tracking-wider">
              {wanderers.length} Active
            </span>
          </div>
          <div className="space-y-2">
            {wanderers.map((w) => (
              <div 
                key={w.id} 
                className="bg-dark-card border border-gold/15 p-4 rounded-xl flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-dark-bg overflow-hidden border border-gold/20 shadow-inner">
                    <img src={w.avatar} alt={w.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-white font-serif">{w.name}</p>
                    <p className="text-[10px] text-crimson font-mono flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-crimson" />
                      <span>{w.distance}</span>
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleInvite(w.id)}
                  disabled={w.isInvited}
                  className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all border ${
                    w.isInvited
                      ? "border-gold/15 text-white/30 cursor-not-allowed bg-transparent"
                      : "border-2 border-gold/40 text-gold hover:bg-gold/5 active:scale-95 cursor-pointer"
                  }`}
                >
                  {w.isInvited ? "Invited" : "Invite"}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* PARTY CHAT DRAWER DOCK */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-md z-10">
        <div className="bg-dark-panel/95 backdrop-blur-lg border border-gold/25 p-4 rounded-2xl shadow-xl space-y-4">
          
          {/* Chats view display */}
          <div className="space-y-3 max-h-24 overflow-y-auto custom-scrollbar">
            {partyChats.map((msg) => (
              <div key={msg.id} className="flex gap-2.5 items-start">
                <img src={msg.senderAvatar} alt={msg.senderName} className="w-6 h-6 rounded-full object-cover border border-gold/15 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-[9px] font-mono font-bold text-gold uppercase tracking-wider leading-none">
                    {msg.senderName}
                  </p>
                  <p className="text-xs text-cream/90 leading-snug">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick reply formulation form */}
          <form onSubmit={handleSendChat} className="flex gap-2 items-center border-t border-gold/15 pt-3">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Broadcast to party..."
              className="flex-grow bg-dark-card border border-gold/15 rounded-xl h-10 px-3 text-xs text-white placeholder-cream/30 focus:outline-none focus:ring-1 focus:ring-crimson focus:border-crimson transition-all"
            />
            <button
              type="submit"
              className="w-10 h-10 bg-crimson text-white rounded-xl flex items-center justify-center shadow-md active:scale-95 hover:opacity-90 transition-all focus:outline-none cursor-pointer"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
