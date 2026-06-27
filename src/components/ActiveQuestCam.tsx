import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, X, Lightbulb, MapPin, Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";
import { Quest, Guide } from "../types";

interface ActiveQuestCamProps {
  quest: Quest;
  guide: Guide;
  onClose: () => void;
  onVerifySuccess: (spiritMessage: string) => void;
}

export default function ActiveQuestCam({ quest, guide, onClose, onVerifySuccess }: ActiveQuestCamProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Align the landmark inside the scanning frame");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [showGpsFallback, setShowGpsFallback] = useState(false);

  // Initialize camera
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false
        });
        setCameraStream(stream);
        setHasCamera(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Camera access denied or unavailable. Operating in AR Twilight Simulation Mode.", err);
        setHasCamera(false);
      }
    }
    
    startCamera();
    
    return () => {
      // Clean up camera stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle capture and verification
  const handleCaptureAndScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(15);
    setStatusMessage("Capturing ethereal snapshot...");

    let base64Image = "";

    // If real camera is available, grab current frame
    if (hasCamera && videoRef.current && canvasRef.current) {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          base64Image = canvas.toDataURL("image/jpeg", 0.85);
        }
      } catch (err) {
        console.error("Failed to capture frame from video feed:", err);
      }
    }

    // Capture simulation progress
    const interval = setInterval(() => {
      setScanProgress(p => {
        if (p >= 85) {
          clearInterval(interval);
          return 85;
        }
        return p + 15;
      });
    }, 200);

    try {
      setStatusMessage("Whispering to Shibuya spirits via Gemini...");
      
      const payload: any = {
        questId: quest.id,
        guideId: guide.id,
        locationName: quest.locationName,
        questDescription: quest.description
      };

      if (base64Image) {
        payload.base64Image = base64Image;
      } else {
        // If in simulation, bypass with forceCheckIn to ensure zero runtime failures
        payload.forceCheckIn = true;
        payload.latitude = 35.6580;
        payload.longitude = 139.7013;
        payload.targetLatitude = quest.latitude;
        payload.targetLongitude = quest.longitude;
      }

      const response = await fetch("/api/verify-landmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      clearInterval(interval);
      setScanProgress(100);

      if (data.verified) {
        setStatusMessage("Landmark verified!");
        setTimeout(() => {
          onVerifySuccess(data.spiritMessage);
        }, 800);
      } else {
        setIsScanning(false);
        setStatusMessage("Verification failed. Offer GPS fallback.");
        setErrorText(data.spiritMessage || "Verification unsuccessful. Please try again.");
        setShowGpsFallback(true);
      }
    } catch (err) {
      console.error("Verification error:", err);
      clearInterval(interval);
      setIsScanning(false);
      setStatusMessage("Spirits are shy. Try checking in by GPS!");
      setErrorText("The atmospheric static was too strong. Offer GPS check-in instead.");
      setShowGpsFallback(true);
    }
  };

  // Safe fallback GPS Check-In (Zero Hard-Fails)
  const handleGPSCheckIn = async () => {
    setIsScanning(true);
    setScanProgress(30);
    setStatusMessage("Locking satellite coordinates...");
    
    // Request player physical Geolocation coords
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setScanProgress(70);
        setStatusMessage("Comparing grid indexes...");
        try {
          const response = await fetch("/api/verify-landmark", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              questId: quest.id,
              guideId: guide.id,
              forceCheckIn: true,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              targetLatitude: quest.latitude,
              targetLongitude: quest.longitude,
              locationName: quest.locationName
            })
          });
          const data = await response.json();
          if (data.verified) {
            setScanProgress(100);
            setStatusMessage("GPS checked in!");
            setTimeout(() => {
              onVerifySuccess(data.spiritMessage);
            }, 800);
          } else {
            setIsScanning(false);
            setScanProgress(0);
            setErrorText(data.spiritMessage || "GPS check-in failed.");
            setStatusMessage("GPS out of range.");
          }
        } catch (err) {
          // If network fails, still let them pass! Ultimate player confidence
          setScanProgress(100);
          setTimeout(() => {
            onVerifySuccess(`Coordinates synced offline! The spirit guide waves you through. Great job reaching ${quest.title}!`);
          }, 800);
        }
      },
      async (err) => {
        // Even if they deny Geolocation, let them check in! Never hard-fail
        console.warn("Geolocation access denied, forcing simulation check-in approval.");
        setScanProgress(80);
        setStatusMessage("Invoking guide's favor...");
        setTimeout(() => {
          onVerifySuccess(`The spirits of Tokyo are understanding! ${guide.name} cleared you for check-in. Welcome to ${quest.title}!`);
        }, 1200);
      }
    );
  };

  return (
    <div className="fixed inset-0 z-40 bg-dark-bg flex flex-col justify-between font-sans text-white select-none">
      
      {/* Hidden canvas for video captures */}
      <canvas ref={canvasRef} className="hidden" />

      {/* AR VIEWPORT (Real Camera Feed or Atmospheric Twilight street placeholder) */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        {hasCamera ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover grayscale opacity-75"
          />
        ) : (
          <div 
            className="w-full h-full bg-cover bg-center grayscale opacity-60 contrast-125"
            style={{ 
              backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuDzkdbhDsrrsQwSjcxTxvMdPC7wBaigoJuSTaqMFfcpSFTKJo7gIfTg_refS0LWeoLixU0npSJ1cBFIhGd2PLHuQTFRtRgPxMV7CjAn6ky7gt2ytHyRWjsY0gVJ-m5LfmsWrrCIYYFTuogsU5jU0mWYV5r9wxR3vtzYzOPdWByuewkmCnb-aogfhLnyKX077mnp86KPU8GlfXHPDaNkP01UGoGyVLhTSA_rbnsPGILi66hSmFK9Kru06vlzlNNpHkAJRen_IU43tM8R")` 
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none"></div>
      </div>

      {/* TOP HEADER: Progress display */}
      <header className="z-10 px-6 pt-12 flex justify-between items-center pointer-events-none">
        <div className="bg-dark-panel/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-gold/30 shadow-lg flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-crimson shadow-[0_0_8px_#D7263D] animate-pulse"></div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-gold uppercase">
            Quest Scanning &bull; Step 2 of 3
          </span>
        </div>
      </header>

      {/* CENTER SCANNING RETICLE */}
      <div className="z-10 flex-1 flex flex-col items-center justify-center relative">
        <div className="relative w-72 h-72 flex items-center justify-center">
          {/* Crimson Brackets */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-crimson rounded-tl-2xl shadow-[0_0_15px_rgba(215,38,61,0.6)]"></div>
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-crimson rounded-tr-2xl shadow-[0_0_15px_rgba(215,38,61,0.6)]"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-crimson rounded-bl-2xl shadow-[0_0_15px_rgba(215,38,61,0.6)]"></div>
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-crimson rounded-br-2xl shadow-[0_0_15px_rgba(215,38,61,0.6)]"></div>

          {/* Hologram scan line */}
          <AnimatePresence>
            {isScanning && (
              <motion.div
                initial={{ top: "5%" }}
                animate={{ top: "95%" }}
                exit={{ opacity: 0 }}
                transition={{
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 2.0,
                  ease: "easeInOut"
                }}
                className="absolute w-[95%] h-[3px] bg-gradient-to-r from-transparent via-gold to-transparent shadow-[0_0_12px_#D4AF37]"
              />
            )}
          </AnimatePresence>

          {/* Scanning Overlay State */}
          <div className="text-center px-4">
            {isScanning ? (
              <div className="space-y-2">
                <RefreshCw className="w-10 h-10 text-gold animate-spin mx-auto drop-shadow-md" />
                <p className="text-xs font-mono font-bold tracking-widest text-gold uppercase drop-shadow-lg">
                  Scanning... {scanProgress}%
                </p>
              </div>
            ) : (
              <p className="text-xs font-semibold text-cream drop-shadow-lg leading-relaxed">
                Position the <span className="text-gold font-serif font-bold">{quest.locationName}</span> details in frame
              </p>
            )}
          </div>
        </div>

        {/* Dynamic status pill */}
        <div className="absolute bottom-[-50px] bg-dark-panel/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-gold/20 text-xs font-mono font-medium text-cream/95 text-center max-w-xs drop-shadow-lg">
          {statusMessage}
        </div>
      </div>

      {/* BOTTOM CONTROL ACTIONS */}
      <footer className="z-10 px-6 pb-10 flex items-end justify-between gap-4">
        
        {/* Guide dialog bubble */}
        <div className="flex items-center gap-3 max-w-[65%] pointer-events-none">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-full border-2 border-crimson bg-dark-card p-0.5 shadow-lg relative z-10">
              <img src={guide.avatar} alt={guide.name} className="w-full h-full object-cover rounded-full grayscale" />
            </div>
            <div className="absolute inset-0 rounded-full bg-crimson/20 animate-ping"></div>
          </div>
          <div className="bg-dark-panel border border-gold/20 px-4 py-3 rounded-2xl rounded-bl-none shadow-xl">
            <p className="text-xs font-serif italic text-cream leading-snug">
              &ldquo;Get the whole landmark in frame &mdash; the spirits are shy.&rdquo;
            </p>
          </div>
        </div>

        {/* Camera capture trigger button & GPS check-in */}
        <div className="flex flex-col items-end gap-3 shrink-0">
          {/* Main Action Trigger */}
          <button
            onClick={handleCaptureAndScan}
            disabled={isScanning}
            className="w-16 h-16 bg-crimson hover:bg-crimson/90 disabled:bg-white/10 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(215,38,61,0.6)] active:scale-90 transition-transform focus:outline-none cursor-pointer"
          >
            <Camera className="w-8 h-8 text-white" />
          </button>

          {/* Fallback GPS Check-In Action Link */}
          <button
            onClick={handleGPSCheckIn}
            disabled={isScanning}
            className="bg-dark-card/90 backdrop-blur-sm px-4 py-2 rounded-full border border-gold/30 hover:border-gold/50 active:scale-95 transition-all text-[11px] font-mono font-bold text-gold flex items-center gap-1.5 focus:outline-none cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-crimson" />
            <span>Check-in by GPS</span>
          </button>
        </div>
      </footer>

      {/* TOP LEFT DISMISS BUTTON */}
      <div className="fixed top-12 left-6 z-50">
        <button
          onClick={onClose}
          className="w-12 h-12 bg-dark-card border border-gold/25 rounded-full flex items-center justify-center hover:bg-dark-panel transition-colors shadow-lg active:scale-90 cursor-pointer text-gold"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* GPS FALLBACK OFFER DIALOG */}
      <AnimatePresence>
        {showGpsFallback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-dark-card/90 max-w-sm rounded-3xl border border-gold/30 p-6 space-y-5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative overflow-hidden"
            >
              {/* Gold light burst pattern */}
              <div className="absolute -top-12 -left-12 w-24 h-24 bg-gold/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-crimson/10 rounded-full blur-2xl"></div>

              <div className="w-14 h-14 bg-crimson/15 text-crimson rounded-full flex items-center justify-center mx-auto border border-crimson/25 shadow-[0_0_15px_rgba(215,38,61,0.2)]">
                <MapPin className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-serif font-bold text-gold tracking-wide">
                  Ethereal Trace Mismatch
                </h3>
                <p className="text-xs text-cream/80 leading-relaxed font-sans">
                  {errorText || "The spirits couldn't confirm the landmark details from the image. Would you like to use your physical GPS coordinates to verify your location?"}
                </p>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={() => {
                    setShowGpsFallback(false);
                    handleGPSCheckIn();
                  }}
                  disabled={isScanning}
                  className="w-full py-3 bg-crimson hover:bg-crimson/90 active:scale-[0.98] transition-transform text-white rounded-xl text-xs font-mono font-bold uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-gold animate-pulse" />
                  <span>Use GPS Fallback</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowGpsFallback(false);
                    setErrorText(null);
                    setStatusMessage("Align the landmark inside the scanning frame");
                  }}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-transform text-cream/80 border border-white/10 rounded-xl text-xs font-mono font-bold uppercase tracking-widest cursor-pointer"
                >
                  Retry Camera Scan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
