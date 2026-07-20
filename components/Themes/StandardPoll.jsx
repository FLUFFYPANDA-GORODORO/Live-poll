import { useState, useEffect, useRef } from "react";
import { Loader2, Home, Check, Lock, AlertCircle, ArrowRight, Users, Clock, Sparkles, QrCode, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const STANDARD_CHART_COLORS = [
  "var(--color-primary)",
  "var(--color-secondary)",
  "var(--color-primary)",
  "var(--color-secondary)",
];

const MASTERCLASS_CHART_COLORS = ["#10b981", "#059669", "#6ee7b7", "#047857"];
const IU_CHART_COLORS = ["#145386", "#145386", "#145386", "#145386"];

function VerticalBarChart({ options, votes, totalVotes, theme }) {
  const maxVotes = Math.max(...votes, 1);
  const isSynergy = theme === "synergy_sphere";
  const isIU = theme === "iu";

  return (
    <div className="flex items-end justify-center gap-4 md:gap-6 h-48 md:h-56 px-4">
      {options.map((option, idx) => {
        const voteCount = votes[idx] || 0;
        const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
        const height = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0;

        return (
          <div key={idx} className="flex flex-col items-center gap-2 flex-1 max-w-[80px]">
            <div className={`text-sm font-bold ${isSynergy ? "text-rose-950" : "text-[#1E293B]"}`}>
              {voteCount}
            </div>
            <div className="relative h-32 md:h-40 w-full flex items-end justify-center">
              <div
                className={`w-10 md:w-12 rounded-t-lg transition-all duration-700 ease-out ${isSynergy ? "bg-gradient-to-t from-red-600 to-rose-500" : ""
                  }`}
                style={{
                  height: `${height}%`,
                  backgroundColor: isSynergy ? undefined : (isIU ? IU_CHART_COLORS[idx % IU_CHART_COLORS.length] : STANDARD_CHART_COLORS[idx % STANDARD_CHART_COLORS.length]),
                  minHeight: voteCount > 0 ? "8px" : "4px",
                }}
              />
            </div>
            <div className="text-center">
              <div className={`text-xs md:text-sm font-semibold truncate max-w-[70px] ${isSynergy ? "text-rose-950" : "text-[#1E293B]"
                }`}>
                {option.text}
              </div>
              <div className={`text-xs ${isSynergy ? "text-rose-500 font-bold" : "text-[#64748B]"}`}>
                {percentage}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBarChart({ options, votes, totalVotes }) {
  const maxVotes = Math.max(...votes, 1);

  return (
    <div className="space-y-2 px-2 my-1">
      {options.map((option, idx) => {
        const voteCount = votes[idx] || 0;
        const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
        const width = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0;

        return (
          <div key={idx} className="flex flex-col">
            <div className="relative w-full h-8 bg-slate-100 rounded-lg overflow-hidden border border-emerald-100 flex items-center shadow-inner">
              {/* Fill */}
              <div
                className="absolute top-0 left-0 h-full rounded-r-md transition-all duration-700 ease-out bg-gradient-to-r from-emerald-600 to-green-500 opacity-80"
                style={{
                  width: `${width}%`,
                }}
              />
              {/* Content */}
              <div className="relative z-10 w-full px-3 flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="truncate max-w-[65%]">{option.text}</span>
                <span className="flex-shrink-0 text-emerald-900 font-extrabold">
                  {voteCount}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Confetti burst (Falling from top) ──────────────────────────────────────────
function ConfettiBurst({ active, onComplete }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let confetti = [], sequins = [];
    const gravityConfetti = 0.4, gravitySequins = 0.55;
    const dragConfetti = 0.05, dragSequins = 0.015;
    const terminalVelocity = 7;
    const colors = [
      { front: "#7b5cff", back: "#6245e0" },
      { front: "#b3c7ff", back: "#8fa5e5" },
      { front: "#5c86ff", back: "#345dd1" },
      { front: "#10b981", back: "#047857" },
      { front: "#fbbf24", back: "#d97706" },
      { front: "#ff5a5f", back: "#e03e42" },
    ];
    const rng = (a, b) => Math.random() * (b - a) + a;

    function Confetto(isInitial = false) {
      this.randomModifier = rng(0, 99);
      this.color = colors[Math.floor(rng(0, colors.length))];
      this.dimensions = { x: rng(5, 9), y: rng(8, 15) };
      // Spread out initial items vertically so they don't fall in a line
      this.position = { 
        x: rng(0, canvas.width), 
        y: isInitial ? rng(-canvas.height, -20) : rng(-60, -20) 
      };
      this.velocity = { x: rng(-3, 3), y: rng(1, 4) };
      this.rotation = rng(0, 2 * Math.PI);
      this.scale = { x: 1, y: 1 };
    }
    Confetto.prototype.update = function () {
      this.velocity.x -= this.velocity.x * dragConfetti;
      this.velocity.y = Math.min(this.velocity.y + gravityConfetti, terminalVelocity);
      // Realistic swaying motion
      this.velocity.x += Math.sin(this.position.y * 0.04 + this.randomModifier) * 0.2;
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;
      this.scale.y = Math.cos((this.position.y + this.randomModifier) * 0.09);
    };

    function Sequin(isInitial = false) {
      this.color = colors[Math.floor(rng(0, colors.length))].back;
      this.radius = rng(1.5, 3);
      this.position = { 
        x: rng(0, canvas.width), 
        y: isInitial ? rng(-canvas.height, -20) : rng(-60, -20) 
      };
      this.velocity = { x: rng(-2, 2), y: rng(2, 6) };
    }
    Sequin.prototype.update = function () {
      this.velocity.x -= this.velocity.x * dragSequins;
      this.velocity.y = Math.min(this.velocity.y + gravitySequins, terminalVelocity);
      this.velocity.x += Math.sin(this.position.y * 0.06 + this.radius) * 0.1;
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;
    };

    // Spawn initial wave with high vertical scattering
    for (let i = 0; i < 60; i++) {
      confetti.push(new Confetto(true));
    }
    for (let i = 0; i < 30; i++) {
      sequins.push(new Sequin(true));
    }

    let animationFrame, elapsedFrames = 0;
    const renderLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Keep spawning new confetti for the first 240 frames (~4 seconds)
      if (elapsedFrames < 240) {
        if (confetti.length < 120) {
          confetti.push(new Confetto(false));
        }
        if (sequins.length < 60) {
          sequins.push(new Sequin(false));
        }
      }

      confetti.forEach((c) => {
        const w = c.dimensions.x * c.scale.x, h = c.dimensions.y * c.scale.y;
        ctx.translate(c.position.x, c.position.y);
        ctx.rotate(c.rotation);
        c.update();
        ctx.fillStyle = c.scale.y > 0 ? c.color.front : c.color.back;
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      });
      sequins.forEach((s) => {
        ctx.translate(s.position.x, s.position.y);
        s.update();
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(0, 0, s.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      });

      confetti = confetti.filter((c) => c.position.y < canvas.height + 20);
      sequins = sequins.filter((s) => s.position.y < canvas.height + 20);
      elapsedFrames++;
      
      if ((confetti.length === 0 && sequins.length === 0) || elapsedFrames > 450) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onComplete();
      } else {
        animationFrame = requestAnimationFrame(renderLoop);
      }
    };
    animationFrame = requestAnimationFrame(renderLoop);
    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", onResize);
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [active, onComplete]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[200] w-full h-full" />;
}

export default function StandardPoll({
  poll,
  cleanTitle,
  pollId,
  hasVoted,
  selectedOption,
  voting,
  voteForOptionHandler,
  totalVotes,
  currentVotes,
  pollNotStarted,
  activeQuestion,
  router,
  handleSendEmoji,
  theme = "standard" // default to standard
}) {
  const [wordInput, setWordInput] = useState("");
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [particles, setParticles] = useState([]);
  const [rings, setRings] = useState([]);

  // IU specific login state
  const [phoneInput, setPhoneInput] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loginError, setLoginError] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("iu_user_name");
      const savedPhone = localStorage.getItem("iu_user_phone");
      if (savedName && savedPhone) {
        setCurrentUser({ name: savedName, phone: savedPhone });
      }
    }
  }, []);

  // Automatically trigger confetti surprise 1.5 seconds after the poll ends
  const isEnded = !activeQuestion || poll.status === "ended";
  useEffect(() => {
    if (isEnded) {
      const timer = setTimeout(() => {
        setConfettiActive(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isEnded]);

  const handleLogin = async () => {
    setLoginError("");
    const trimmedPhone = phoneInput.trim();
    if (!trimmedPhone) {
      setLoginError("Please enter your phone number");
      return;
    }
    try {
      const res = await fetch("/users.json");
      const users = await res.json();
      const user = users.find(u => String(u.phone).trim() === trimmedPhone);
      if (user) {
        localStorage.setItem("iu_user_name", user.name);
        localStorage.setItem("iu_user_phone", user.phone);
        setCurrentUser(user);
      } else {
        setLoginError("Phone number not registered");
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("Failed to authenticate. Please try again.");
    }
  };

  const handleContinueAsGuest = () => {
    localStorage.setItem("iu_user_name", "Anonymous");
    localStorage.setItem("iu_user_phone", "anonymous");
    setCurrentUser({ name: "Anonymous", phone: "anonymous" });
  };

  const handlePhoneChange = (val) => {
    // Remove all non-digits
    let cleaned = val.replace(/\D/g, "");
    
    // If it starts with 91 and is longer than 10 digits, slice off the 91 country code prefix
    if (cleaned.startsWith("91") && cleaned.length > 10) {
      cleaned = cleaned.slice(2);
    }
    
    // Max 10 digits
    if (cleaned.length > 10) {
      cleaned = cleaned.slice(0, 10);
    }
    
    setPhoneInput(cleaned);
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      const styleId = "standard-poll-fonts";
      if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
          @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@300;400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
          .font-baskerville { font-family: 'Libre Baskerville', serif; }
          .font-epilogue    { font-family: 'Epilogue', sans-serif; }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  const EMOJI_COLORS = {
    "❤️": "#f43f5e",
    "🔥": "#f97316",
    "👏": "#eab308",
    "😂": "#eab308",
    "🤯": "#eab308"
  };

  const handleEmojiClick = (e, emoji) => {
    handleSendEmoji(emoji);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const color = EMOJI_COLORS[emoji] || "#fff";

    const newParticles = [];
    const count = 10;
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.5;
      const distance = 25 + Math.random() * 25;
      const dx = `${Math.cos(angle) * distance}px`;
      const dy = `${-60 - Math.random() * 60}px`;
      const size = 6 + Math.random() * 6;

      newParticles.push({
        id: `${now}-${i}-${Math.random()}`,
        x,
        y,
        dx,
        dy,
        size,
        color,
      });
    }

    const ringId = `${now}-ring-${Math.random()}`;
    setRings((prev) => [...prev, { id: ringId, x, y, color }]);
    setParticles((prev) => [...prev, ...newParticles]);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => Date.now() - parseInt(p.id.split("-")[0], 10) < 1000));
    }, 1000);

    setTimeout(() => {
      setRings((prev) => prev.filter((r) => r.id !== ringId));
    }, 1000);
  };

  const isWordCloud = activeQuestion?.type === "WordCloud" || activeQuestion?.type === 1 || String(activeQuestion?.type).toLowerCase() === "wordcloud" || !activeQuestion?.options || activeQuestion.options.length === 0 || activeQuestion.options.every(opt => {
    const txt = typeof opt === "string" ? opt : (opt.text || "");
    return !txt.trim();
  });

  const handleSubmitWord = async () => {
    const trimmedWord = wordInput.trim();
    if (!trimmedWord || localSubmitting) return;

    setLocalSubmitting(true);
    try {
      await voteForOptionHandler(trimmedWord);
    } finally {
      setLocalSubmitting(false);
    }
  };

  const renderQrButtonAndModal = () => {
    if (!isIU || !currentUser) return null;
    return (
      <>
        {/* Static QR Code Button for IU theme (only when authenticated) */}
        <button
          onClick={() => setShowQr(true)}
          className="absolute bottom-6 right-6 bg-[#145386] hover:bg-[#2c9fa1] border border-white/20 text-white p-3.5 rounded-full shadow-2xl transition-all duration-300 z-50 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95"
          title="Show Join QR Code"
        >
          <QrCode className="w-6 h-6 text-white" />
        </button>

        {/* QR Modal Overlay for IU theme */}
        {showQr && (
          <div
            onClick={() => setShowQr(false)}
            className="fixed inset-0 bg-black/85 flex items-center justify-center z-[100] p-4 backdrop-blur-sm"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full flex flex-col items-center relative shadow-2xl border border-slate-200"
            >
              {/* Highly visible circular close button */}
              <button
                onClick={() => setShowQr(false)}
                className="absolute -top-3 -right-3 bg-slate-800 hover:bg-slate-900 text-white transition-colors p-2.5 rounded-full shadow-xl border-2 border-white z-10 cursor-pointer active:scale-95"
                title="Close"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
              <h3 className="text-[#145386] font-bold text-lg text-center mb-1">
                Join the Poll
              </h3>
              <p className="text-slate-500 text-xs text-center mb-6">
                Scan to participate
              </p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-center mb-4">
                <QRCodeSVG
                  value={typeof window !== "undefined" ? window.location.href : ""}
                  size={200}
                  level="H"
                />
              </div>
              <div className="w-full text-slate-700 text-xs font-bold text-center">
                Room Code: <span className="text-[#145386] select-all font-mono">{pollId}</span>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // Helper variables for clean conditional styling
  const isMasterclass = theme === "masterclass";
  const isSynergy = theme === "synergy_sphere";
  const isIU = theme === "iu";

  // IU Theme pre-waiting login page check
  if (isIU && !currentUser) {
    const isPhoneComplete = phoneInput.replace(/\D/g, "").length === 10;
    return (
      <div className="min-h-screen flex flex-col justify-between p-4 md:p-6 text-white font-epilogue font-light relative" style={{ backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url('/IUbackgroundImage.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
        {/* Top Logos Header */}
        <div className="w-full flex items-center justify-between z-20 shrink-0 mb-4">
          <a href="https://www.gryphonacademy.co.in/" target="_blank" rel="noopener noreferrer" className="cursor-pointer">
            <img src="/GryphonWhite.png" alt="Gryphon Logo" className="h-16 md:h-22 w-auto object-contain" />
          </a>
          <a href="https://indirauniversity.edu.in/" target="_blank" rel="noopener noreferrer" className="cursor-pointer">
            <img src="/IULogo2.avif" alt="IU Logo" className="h-20 md:h-26 w-auto object-contain mt-3" />
          </a>
        </div>

        {/* Login Card */}
        <div className="max-w-md text-center mx-auto my-auto z-10 relative w-full px-6 flex flex-col justify-center items-center gap-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-100 w-full shadow-2xl">
            <h2 className="text-2xl font-baskerville font-light text-slate-900 mb-6">
              Enter Your Phone Number to Join
            </h2>
            <div className="flex flex-col gap-4">
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="Phone Number"
                className={`w-full p-3 border rounded-md text-sm focus:outline-none focus:ring-1 text-center tracking-widest text-lg font-mono transition-all duration-300 ${
                  isPhoneComplete 
                    ? "bg-emerald-50 border-emerald-400 text-emerald-950 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500" 
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#2c9fa1] focus:ring-[#2c9fa1]"
                }`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogin();
                }}
              />
              {loginError && (
                <p className="text-red-600 text-xs font-semibold">{loginError}</p>
              )}
              <button
                onClick={handleLogin}
                className="w-full py-3 text-white rounded-md text-sm font-bold shadow-md active:scale-[0.98] transition-all bg-[#145386] hover:bg-[#2c9fa1]"
              >
                Join Poll
              </button>
              {!pollNotStarted && (
                <button
                  onClick={handleContinueAsGuest}
                  className="w-full py-3 text-[#145386] hover:text-[#2c9fa1] rounded-md text-sm font-bold shadow-sm active:scale-[0.98] transition-all border border-[#145386]/20 hover:border-[#2c9fa1]/30 hover:bg-slate-50 cursor-pointer text-center"
                >
                  Continue without Phone No
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="h-12 flex-shrink-0 hidden md:block" />
      </div>
    );
  }

  // 1. Render Waiting Room / Poll Not Started State
  if (pollNotStarted) {
    let waitingClass = "min-h-screen flex flex-col justify-between p-4 md:p-6 text-white font-epilogue font-light relative";
    let titleText = isIU ? "Welcome to MBA Induction" : "Welcome to Live Poll";
    let subTitleText = "The poll will begin shortly";

    const pollUrl = typeof window !== "undefined"
      ? `${window.location.origin}/poll/${pollId}`
      : "";

    return (
      <div className={waitingClass} style={isIU ? { backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url('/IUbackgroundImage.png')", backgroundSize: "cover", backgroundPosition: "center" } : { backgroundColor: "#212529" }}>
        {/* Top Logos Header */}
        <div className="w-full flex items-center justify-between z-20 shrink-0 mb-4">
          <a href="https://www.gryphonacademy.co.in/" target="_blank" rel="noopener noreferrer" className="cursor-pointer">
            <img src="/GryphonWhite.png" alt="Gryphon Logo" className={isIU ? "h-16 md:h-22 w-auto object-contain" : "h-8 md:h-11 w-auto object-contain"} />
          </a>
          {isIU && (
            <a href="https://indirauniversity.edu.in/" target="_blank" rel="noopener noreferrer" className="cursor-pointer">
              <img src="/IULogo2.avif" alt="IU Logo" className="h-20 md:h-26 w-auto object-contain mt-3" />
            </a>
          )}
        </div>

        {/* Main Content */}
        <div className="max-w-4xl text-center mx-auto my-auto z-10 relative w-full px-6 flex flex-col justify-center items-center gap-6">
          <div className="flex flex-col items-center">
            <h1 className="text-4xl md:text-6xl text-white leading-tight drop-shadow-2xl tracking-wide select-none font-baskerville font-light">
              {isIU ? "Welcome to MBA Induction" : titleText}
            </h1>
            <p className="mt-4 opacity-85 tracking-widest uppercase text-sm md:text-base font-epilogue text-zinc-300">
              {subTitleText}
            </p>
          </div>

          {/* QR Code and Join Code directly below the text */}
          <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col items-center max-w-[140px] pointer-events-auto">
            <div className="bg-white p-1.5 rounded-xl">
              <QRCodeSVG value={pollUrl} size={100} />
            </div>
            <p className="text-xs text-center mt-2 text-emerald-400 font-mono font-bold tracking-wider select-all">
              {pollId}
            </p>
          </div>
        </div>

        {/* Bottom Spacer to balance top header under justify-between */}
        <div className="h-12 flex-shrink-0 hidden md:block" />
        
        {/* Floating QR button and modal */}
        {renderQrButtonAndModal()}
      </div>
    );
  }

  // 2. Render Ended State
  if (!activeQuestion || poll.status === "ended") {
    let endedClass = "min-h-screen flex flex-col justify-between p-4 md:p-6 text-white font-epilogue font-light relative";
    let titleText = "Thank You for Your Participation";
    if (isIU && currentUser && currentUser.phone !== "anonymous") {
      titleText = `Thank You for Your Participation, ${currentUser.name.split(" ")[0]}!`;
    }
    let subTitleText = "The Live Poll has Ended";

    // Custom IU student name definition
    const studentName = (currentUser && currentUser.phone !== "anonymous")
      ? currentUser.name.split(" ")[0]
      : "Student";

    return (
      <div className={endedClass} style={isIU ? { backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url('/IUbackgroundImage.png')", backgroundSize: "cover", backgroundPosition: "center" } : { backgroundColor: "#212529" }}>
        {/* Top Logos Header */}
        <div className="w-full flex items-center justify-between z-20 shrink-0 mb-4">
          <a href="https://www.gryphonacademy.co.in/" target="_blank" rel="noopener noreferrer" className="cursor-pointer">
            <img src="/GryphonWhite.png" alt="Gryphon Logo" className={isIU ? "h-16 md:h-22 w-auto object-contain" : "h-8 md:h-11 w-auto object-contain"} />
          </a>
          {isIU && (
            <a href="https://indirauniversity.edu.in/" target="_blank" rel="noopener noreferrer" className="cursor-pointer">
              <img src="/IULogo2.avif" alt="IU Logo" className="h-20 md:h-26 w-auto object-contain mt-3" />
            </a>
          )}
        </div>

        {/* Main Content Card */}
        <div className="max-w-4xl text-center mx-auto my-auto z-10 relative w-full px-6 flex flex-col justify-center items-center">
          {isIU ? (
            <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-100 w-full max-w-xl shadow-2xl animate-fade-in text-center relative mt-16">
              <div 
                onClick={() => setConfettiActive(true)}
                className="absolute -top-20 left-1/2 -translate-x-1/2 ml-4 w-32 h-32 flex items-center justify-center z-10 cursor-pointer active:scale-95 transition-transform"
                title="Click for Confetti!"
              >
                <img src="/partypopper2.png" alt="Party Popper" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-3xl md:text-5xl text-slate-900 font-baskerville font-normal leading-tight mb-4 mt-6">
                Hey {studentName},
              </h1>
              <p className="text-lg md:text-xl text-black font-epilogue font-light mb-6 leading-relaxed">
                Don't worry—your future will be taken care of by us.
              </p>
              <p className="text-xl md:text-2xl text-[#145386] font-epilogue font-semibold tracking-wide">
                Welcome to Indira University!
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-4xl md:text-6xl text-white leading-tight drop-shadow-2xl tracking-wide select-none font-baskerville font-light">
                {titleText}
              </h1>
              <p className="mt-4 opacity-85 tracking-widest uppercase text-sm md:text-base font-epilogue text-zinc-300">
                {subTitleText}
              </p>
            </>
          )}
        </div>

        {/* Bottom Spacer to balance top header under justify-between */}
        <div className="h-12 flex-shrink-0 hidden md:block" />

        {/* Floating QR button and modal */}
        {renderQrButtonAndModal()}

        {/* Confetti Animation */}
        {confettiActive && <ConfettiBurst active={confettiActive} onComplete={() => setConfettiActive(false)} />}
      </div>
    );
  }

  // 3. Main Active Poll Screen
  let mainWrapperClass = "h-screen max-h-screen p-4 md:p-6 flex flex-col justify-between overflow-y-auto relative text-white font-epilogue font-light";
  let contentWrapperClass = "max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center py-2";
  let cardClass = "bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden";
  let emojiPanelClass = "p-2 mt-4 flex items-center justify-center gap-2 w-full mx-auto animate-fade-in z-20 relative rounded-md";

  return (
    <div className={mainWrapperClass} style={isIU ? { backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url('/IUbackgroundImage.png')", backgroundSize: "cover", backgroundPosition: "center" } : { backgroundColor: "#212529" }}>
      {/* Top Logos Header */}
      <div className="w-full flex items-center justify-between z-20 shrink-0 mb-4">
        <a href="https://www.gryphonacademy.co.in/" target="_blank" rel="noopener noreferrer" className="cursor-pointer">
          <img src="/GryphonWhite.png" alt="Gryphon Logo" className={isIU ? "h-16 md:h-22 w-auto object-contain" : "h-8 md:h-11 w-auto object-contain"} />
        </a>
        {isIU && (
          <a href="https://indirauniversity.edu.in/" target="_blank" rel="noopener noreferrer" className="cursor-pointer">
            <img src="/IULogo2.avif" alt="IU Logo" className="h-20 md:h-26 w-auto object-contain mt-3" />
          </a>
        )}
      </div>

      <div className={contentWrapperClass}>
        <div key={isWordCloud ? 'question-wc' : 'question-mcq'} className={cardClass}>
          {/* Card Header */}
          <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-baskerville font-light text-slate-900 text-center mb-2">
                {activeQuestion.text}
              </h2>
            </div>

          {/* Results preview */}
          {!!hasVoted && isWordCloud && (
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 border bg-green-100 border-green-200">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                Answer Recorded!
              </h3>
            </div>
          )}

          {/* Answer options */}
          {!isWordCloud && (
            <div className="p-2.5 sm:p-3.5 space-y-2 sm:space-y-2.5">
              {activeQuestion.options.map((option, idx) => {
                let buttonStyleClass = "";
                let badgeClass = "";
                let badgeStyle = {};

                const isOptionSelected = hasVoted && selectedOption === idx;
                const isOptionUnselected = hasVoted && selectedOption !== idx;

                buttonStyleClass = `w-full p-2.5 sm:p-3 rounded-md text-left transition-all flex items-center gap-2.5 sm:gap-3 border ${isOptionSelected
                  ? "bg-emerald-50 border-emerald-500 shadow-md font-bold text-slate-900 cursor-default"
                  : isOptionUnselected
                    ? "bg-slate-50 border-slate-100 opacity-40 cursor-default text-slate-400"
                    : poll.currentQuestionActive && !voting
                      ? "bg-slate-50 hover:bg-slate-100/50 border-slate-200 hover:border-slate-300 cursor-pointer active:scale-[0.98] text-slate-800"
                      : "bg-slate-100 border-slate-200 cursor-not-allowed opacity-60 text-slate-400"
                  }`;
                badgeClass = "w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0";
                badgeStyle = { backgroundColor: isIU ? IU_CHART_COLORS[idx % IU_CHART_COLORS.length] : STANDARD_CHART_COLORS[idx % STANDARD_CHART_COLORS.length] };

                return (
                  <button
                    key={idx}
                    onClick={() => voteForOptionHandler(idx)}
                    disabled={!poll.currentQuestionActive || voting || hasVoted}
                    className={buttonStyleClass}
                  >
                    <div className={badgeClass} style={badgeStyle}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="font-semibold text-xs sm:text-sm md:text-base">
                      {option.text}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Word Cloud Input */}
          {!hasVoted && !!isWordCloud && (
            <div className="p-4 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                  Your Answer
                </label>
                <input
                  type="text"
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  placeholder="Type your response (max 50 characters)..."
                  maxLength={50}
                  disabled={!poll.currentQuestionActive || localSubmitting}
                  className="w-full p-3 border rounded-md text-sm focus:outline-none focus:ring-1 bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
              </div>
              <button
                onClick={handleSubmitWord}
                disabled={!poll.currentQuestionActive || localSubmitting || !wordInput.trim()}
                className="w-full py-3 text-white rounded-md text-sm font-bold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
              >
                {!!(localSubmitting || voting) && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Answer
              </button>
            </div>
          )}
          {/* Message bar */}
          <div className="px-4 pb-4">
            {voting || localSubmitting ? (
              <div className="flex items-center justify-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-md text-slate-700">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                <span className="font-medium">Recording response...</span>
              </div>
            ) : hasVoted ? (
              isWordCloud ? null : (
                <div className="flex items-center justify-center gap-2 p-2 bg-emerald-50 border border-emerald-100 rounded-md text-emerald-700">
                  <Check className="w-4 h-4" />
                  <span className="font-medium">Answer recorded!</span>
                </div>
              )
            ) : !poll.currentQuestionActive ? (
              <div className="flex items-center justify-center gap-2 p-2 bg-yellow-50 border border-yellow-100 rounded-md text-yellow-700">
                <Lock className="w-4 h-4" />
                <span className="font-medium">Voting locked. Wait for host.</span>
              </div>
            ) : isWordCloud ? (
              <div className="text-center p-2.5 bg-emerald-50 border border-emerald-100/50 rounded-md text-emerald-700 font-semibold text-xs md:text-sm">
                <span>Enter a word and tap submit to record your response</span>
              </div>
            ) : (
              <div className="text-center p-2.5 bg-emerald-50 border border-emerald-100/50 rounded-md text-emerald-700 font-semibold text-xs md:text-sm animate-pulse">
                <span>Tap an option to lock in your answer</span>
              </div>
            )}
          </div>
        </div>

        {/* Emoji Reactions Panel */}
        {poll.status === "live" && poll.status !== undefined && (
          <div className={emojiPanelClass}>
            {["❤️", "🔥", "👏", "😂", "🤯"].map((emoji, idx) => (
              <button
                key={idx}
                onClick={(e) => handleEmojiClick(e, emoji)}
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl hover:scale-125 active:scale-95 transition-all duration-150 cursor-pointer hover:bg-white/10 active:bg-white/20"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Floating click particles portal */}
        {particles.map((p) => (
          <span
            key={p.id}
            className="emoji-particle"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              "--dx": p.dx,
              "--dy": p.dy,
              boxShadow: `0 0 8px ${p.color}`,
              position: "fixed",
              zIndex: 9999,
            }}
          />
        ))}

        {/* Expanding click rings portal */}
        {rings.map((r) => (
          <span
            key={r.id}
            className="emoji-click-ring"
            style={{
              left: r.x,
              top: r.y,
              borderColor: r.color,
              boxShadow: `0 0 10px ${r.color}, inset 0 0 10px ${r.color}`,
              position: "fixed",
              zIndex: 9998,
            }}
          />
        ))}

        <style>{`
          @keyframes particle-up {
            0% {
              transform: translate(-50%, -50%) translate(0, 0) scale(1);
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -50%) translate(var(--dx), var(--dy)) scale(0.2);
              opacity: 0;
            }
          }
          @keyframes ring-expand {
            0% {
              width: 0px;
              height: 0px;
              opacity: 1;
              border-width: 6px;
            }
            100% {
              width: 80px;
              height: 80px;
              opacity: 0;
              border-width: 2px;
            }
          }
          .emoji-particle {
            position: fixed;
            pointer-events: none;
            border-radius: 50%;
            animation: particle-up 0.8s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
          }
          .emoji-click-ring {
            position: fixed;
            pointer-events: none;
            border-style: solid;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: ring-expand 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
          }
        `}</style>
      </div>

      {/* Floating QR button and modal */}
      {renderQrButtonAndModal()}
    </div>
  );
}
