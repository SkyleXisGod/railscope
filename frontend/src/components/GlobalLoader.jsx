import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { translations } from "../pages/constants/translations";

export default function GlobalLoader({ isVisible }) {
  const { user } = useAuth();
  const lang = user?.settings?.language || 'PL';
  const t = translations[lang]?.globalLoader || translations.PL.globalLoader;
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
            background: 'radial-gradient(circle, #1a1a1a 0%, #000000 100%)',
            zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'
          }}
        >
          <div className="loader-content" style={{ textAlign: 'center', position: 'relative' }}>
            
            {/* Animowany, Dwutonowy Pociąg (Wektor) */}
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.3, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: "120px", height: "80px", margin: "0 auto", position: "relative" }}
            >
              {/* Komin i para */}
              <motion.div 
                animate={{ y: [0, -15], opacity: [1, 0], scale: [1, 1.5], x: [0, -10] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "easeOut" }}
                style={{ position: 'absolute', top: '-10px', left: '20px', width: '15px', height: '15px', background: '#00ffd5', borderRadius: '50%', filter: 'blur(2px)' }}
              />
              
              {/* Sylwetka lokomotywy (SVG) */}
              <svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                {/* Kabina */}
                <path d="M70 10 H90 V50 H70 Z" fill="#ffffff" />
                {/* Okno */}
                <rect x="75" y="15" width="10" height="15" fill="#000000" />
                {/* Kocioł */}
                <path d="M20 25 H70 V50 H20 Z" fill="#ffffff" />
                {/* Komin */}
                <rect x="25" y="10" width="10" height="15" fill="#ffffff" />
                {/* Pług */}
                <path d="M20 50 L10 55 L20 55 Z" fill="#00ffd5" />
                
                {/* Koła (animowane za pomocą motion.g) */}
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
            
            {/* Rozświetlone tory pod pociągiem */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: ["80px", "160px", "80px"], opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ 
                height: "3px", background: "#00ffd5", margin: "5px auto 0 auto", 
                borderRadius: "50%", filter: "blur(1px)", boxShadow: "0 0 15px #00ffd5"
              }}
            />
            
            <motion.p
              animate={{ opacity: [0.4, 1, 0.4], letterSpacing: ["2px", "5px", "2px"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ 
                color: "#fff", marginTop: "25px", fontWeight: "900", 
                textTransform: "uppercase", fontSize: "12px",
                textShadow: "0 0 10px rgba(255,255,255,0.4)"
              }}
            >
              {t.starting_engines}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}