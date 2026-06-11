import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { translations } from "../pages/constants/translations";

export default function GlobalLoader({ isVisible }) {
  const { user } = useAuth();
  const lang = user?.settings?.language || 'PL';
  const t = translations[lang]?.globalLoader || translations.PL.globalLoader;

  const [triggerXWing, setTriggerXWing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const luckyRoll = Math.random() < 0.01; 
      setTriggerXWing(luckyRoll);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(10px)" }}
          className="global-loader-overlay"
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'radial-gradient(circle, #09090d 0%, #000000 100%)',
            zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center',
            overflow: 'hidden'
          }}
        >
          {triggerXWing && (
            <motion.div
              initial={{ x: "-30vw", y: "85vh", scale: 0.05, rotate: -25, opacity: 0, filter: "blur(4px)" }}
              animate={{ 
                x: ["-30vw", "40vw", "130vw"], 
                y: ["85vh", "45vh", "-10vh"], 
                scale: [0.05, 3.8, 0.2],
                rotate: [-25, -15, -5], 
                opacity: [0, 1, 1, 0],
                filter: ["blur(3px)", "blur(0px)", "blur(5px)"]
              }}
              transition={{ duration: 1.8, ease: [0.25, 1, 0.5, 1] }} 
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                zIndex: 10000, 
                width: '240px', 
                height: '180px',
                pointerEvents: 'none'
              }}
            >
              <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <linearGradient id="hull-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#efeff4" />
                    <stop offset="50%" stopColor="#d1d1d6" />
                    <stop offset="100%" stopColor="#8e8e93" />
                  </linearGradient>
                  <linearGradient id="dark-metal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#48484a" />
                    <stop offset="100%" stopColor="#1c1c1e" />
                  </linearGradient>
                  <radialGradient id="engine-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="30%" stopColor="#ff5e00" />
                    <stop offset="70%" stopColor="#ff0044" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ff0000" stopOpacity="0" />
                  </radialGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                <circle cx="45" cy="62" r="14" fill="url(#engine-glow)" filter="url(#glow)" />
                <circle cx="42" cy="88" r="14" fill="url(#engine-glow)" filter="url(#glow)" />

                <path d="M70 65 L25 22 L30 18 L75 60 Z" fill="#c7c7cc" stroke="#3a3a3c" strokeWidth="0.5" />
                <path d="M35 27 L28 21 L32 19 L38 25 Z" fill="#d32f2f" /> 

                <path d="M25 22 L12 10 L16 10 L28 20 Z" fill="url(#dark-metal)" />
                <rect x="10" y="8" width="18" height="1.5" transform="rotate(-40 10 8)" fill="#ff0055" filter="url(#glow)" />

                <path d="M68 85 L20 120 L25 125 L72 88 Z" fill="#aeaeae" stroke="#3a3a3c" strokeWidth="0.5" />
                <path d="M30 112 L22 118 L25 121 L32 115 Z" fill="#d32f2f" />

                <path d="M20 120 L5 132 L9 135 L23 123 Z" fill="url(#dark-metal)" />
                <rect x="3" y="132" width="18" height="1.5" transform="rotate(38 3 132)" fill="#ff0055" filter="url(#glow)" />

                <rect x="48" y="52" width="26" height="13" rx="4" fill="url(#dark-metal)" stroke="#636366" />
                <circle cx="48" cy="58.5" r="5" fill="#ff5e00" />
                <circle cx="48" cy="58.5" r="2" fill="#fff" />
                <rect x="45" y="80" width="26" height="13" rx="4" fill="url(#dark-metal)" stroke="#636366" />
                <circle cx="45" cy="86.5" r="5" fill="#ff5e00" />
                <circle cx="45" cy="86.5" r="2" fill="#fff" />

                <path d="M42 75 C42 60, 65 55, 80 55 L165 70 C175 71, 175 77, 165 78 L80 90 C65 90, 42 85, 42 75 Z" fill="url(#hull-grad)" stroke="#3a3a3c" />
                <path d="M130 68 L185 73 C192 74, 192 76, 185 77 L130 80 Z" fill="#e5e5ea" stroke="#8e8e93" strokeWidth="0.5" />
                <path d="M170 73.5 L182 74.5 L170 76 Z" fill="#d32f2f" /> 

                <path d="M92 64 C95 54, 115 56, 122 66 L124 73 C115 75, 98 74, 92 64 Z" fill="url(#dark-metal)" stroke="#d1d1d6" strokeWidth="1" />

                <path d="M96 63 C98 57, 110 58, 115 65 L110 71 L96 67 Z" fill="#00d2ff" opacity="0.6" />
                <path d="M115 63 L120 66 L117 71 L112 70 Z" fill="#00d2ff" opacity="0.8" />

                <path d="M82 58 C82 54, 88 54, 88 58 Z" fill="#d1d1d6" />
                <circle cx="85" cy="56" r="1" fill="#0033aa" /> 

                <path d="M74 58 L145 15 L152 18 L78 64 Z" fill="url(#hull-grad)" stroke="#48484a" strokeWidth="0.5" />
                <path d="M120 28 L138 18 L142 20 L125 31 Z" fill="#d32f2f" /> 
                <path d="M145 15 L160 12 L158 16 L148 18 Z" fill="url(#dark-metal)" />
                <path d="M160 12 L198 2 V6 L162 15 Z" fill="#e5e5ea" stroke="#3a3a3c" strokeWidth="0.5" />

                <circle cx="198" cy="4" r="2" fill="#ff0055" filter="url(#glow)" />

                <path d="M76 84 L138 135 L144 131 L78 78 Z" fill="url(#hull-grad)" stroke="#48484a" strokeWidth="0.5" />
                <path d="M110 112 L128 127 L132 124 L114 109 Z" fill="#d32f2f" />
    
                <path d="M138 135 L152 140 L150 143 L136 138 Z" fill="url(#dark-metal)" />
                <path d="M152 140 L195 146 V149 L152 142 Z" fill="#e5e5ea" stroke="#3a3a3c" strokeWidth="0.5" />
                <circle cx="195" cy="147.5" r="2" fill="#ff0055" filter="url(#glow)" />

                <rect x="58" y="70" width="12" height="2" fill="#636366" />
                <rect x="75" y="72" width="18" height="1.5" fill="#48484a" />
                <circle cx="138" cy="74" r="1.5" fill="#3a3a3c" />
              </svg>
            </motion.div>
          )}

          <div className="loader-content" style={{ textAlign: 'center', position: 'relative' }}>
            
            {lang === "PIRATE" ? (
              <>
                <motion.div
                  animate={{ rotate: [-5, 5, -5], y: [0, -6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ width: "140px", height: "100px", margin: "0 auto", position: "relative" }}
                >
                  <svg viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                    <path d="M15 35 C15 35, 10 55, 30 60 H70 C90 55, 85 35, 85 35 C85 35, 80 42, 70 42 H30 C20 42, 15 35, 15 35 Z" fill="#ffffff" />
                    <rect x="48" y="5" width="4" height="45" fill="#ffffff" />
                    <rect x="28" y="15" width="3" height="30" fill="#ffffff" />
                    <path d="M48 8 C33 13, 33 32, 48 38 C40 32, 40 13, 48 8 Z" fill="#00ffd5" />
                    <circle cx="41" cy="21" r="3" fill="#111116" />
                    <rect x="39" y="23" width="4" height="3" fill="#111116" />
                    <path d="M28 17 C16 20, 16 38, 28 42 C22 38, 22 20, 28 17 Z" fill="#ffffff" />
                    <motion.path 
                      animate={{ scaleX: [1, 0.8, 1], x: [0, 2, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6 }}
                      d="M48 5 H35 V10 H48 Z" 
                      fill="#ff0055" 
                    />
                  </svg>
                </motion.div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '5px' }}>
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -4, 0], x: [0, 4, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                      style={{ 
                        width: "40px", height: "4px", background: "#00ffd5", 
                        borderRadius: "50%", filter: "blur(1px)", boxShadow: "0 0 12px #00ffd5"
                      }}
                    />
                  ))}
                </div>
              </>
            ) : (
              /* ================= WERSJA STANDARDOWA: LOKOMOTYWA ================= */
              <>
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.3, repeat: Infinity, ease: "easeInOut" }}
                  style={{ width: "120px", height: "80px", margin: "0 auto", position: "relative" }}
                >
                  <motion.div 
                    animate={{ y: [0, -15], opacity: [1, 0], scale: [1, 1.5], x: [0, -10] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "easeOut" }}
                    style={{ position: 'absolute', top: '-10px', left: '20px', width: '15px', height: '15px', background: '#00ffd5', borderRadius: '50%', filter: 'blur(2px)' }}
                  />
                  
                  <svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                    <path d="M70 10 H90 V50 H70 Z" fill="#ffffff" />
                    <rect x="75" y="15" width="10" height="15" fill="#000000" />
                    <path d="M20 25 H70 V50 H20 Z" fill="#ffffff" />
                    <rect x="25" y="10" width="10" height="15" fill="#ffffff" />
                    <path d="M20 50 L10 55 L20 55 Z" fill="#00ffd5" />
                    
                    <motion.g animate={{ rotate: -360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "35px 50px" }}>
                      <circle cx="35" cy="50" r="8" stroke="#00ffd5" strokeWidth="2" fill="#1a1a1a" />
                      <line x1="35" y1="42" x2="35" y2="58" stroke="#00ffd5" strokeWidth="2" />
                      <line x1="27" y1="50" x2="43" y2="50" stroke="#00ffd5" strokeWidth="2" />
                    </motion.g>
                    
                    <motion.g animate={{ rotate: -360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "60px 50px" }}>
                      <circle cx="60" cy="50" r="8" stroke="#00ffd5" strokeWidth="2" fill="#1a1a1a" />
                      <line x1="60" y1="42" x2="60" y2="58" stroke="#00ffd5" strokeWidth="2" />
                      <line x1="52" y1="50" x2="68" y2="50" stroke="#00ffd5" strokeWidth="2" />
                    </motion.g>
                  </svg>
                </motion.div>
                
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: ["80px", "160px", "80px"], opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{ 
                    height: "3px", background: "#00ffd5", margin: "5px auto 0 auto", 
                    borderRadius: "50%", filter: "blur(1px)", boxShadow: "0 0 15px #00ffd5"
                  }}
                />
              </>
            )}
            
            <motion.p
              animate={{ opacity: [0.4, 1, 0.4], letterSpacing: ["2px", "5px", "2px"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ 
                color: "#fff", marginTop: "25px", fontWeight: "900", 
                textTransform: "uppercase", fontSize: "12px",
                textShadow: "0 0 10px rgba(255,255,255,0.4)"
              }}
            >
              {lang === "PIRATE" ? "⚓ WEIGH HEAVE! PREPARING THE DECK..." : t.starting_engines}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}