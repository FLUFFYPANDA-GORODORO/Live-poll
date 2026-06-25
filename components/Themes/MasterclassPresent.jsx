"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Users,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// ── Inject global styles once into <head> ──────────────────────────────────────
// Avoids React removeChild crash that happens when <style> is rendered inside JSX.
const GLOBAL_STYLE_ID = "masterclass-present-styles";
function injectGlobalStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(GLOBAL_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = GLOBAL_STYLE_ID;
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@300;400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
    .font-baskerville { font-family: 'Libre Baskerville', serif; }
    .font-epilogue    { font-family: 'Epilogue', sans-serif; }

    /* ── Three drift paths, matching the classic hearts animation ── */
    @keyframes mc-flowOne {
      0%   { opacity: 0; bottom: 0;   left: 35%; }
      40%  { opacity: .8; }
      50%  { opacity: 1;  left: 45%; }
      60%  { opacity: .2; }
      80%  { bottom: 80%; }
      100% { opacity: 0;  bottom: 100%; left: 68%; }
    }
    @keyframes mc-flowTwo {
      0%   { opacity: 0; bottom: 0;  left: 45%; }
      40%  { opacity: .8; }
      50%  { opacity: 1;  left: 61%; }
      60%  { opacity: .2; }
      80%  { bottom: 60%; }
      100% { opacity: 0;  bottom: 80%; left: 45%; }
    }
    @keyframes mc-flowThree {
      0%   { opacity: 0; bottom: 0;  left: 45%; }
      40%  { opacity: .8; }
      50%  { opacity: 1;  left: 25%; }
      60%  { opacity: .2; }
      80%  { bottom: 70%; }
      100% { opacity: 0;  bottom: 90%; left: 45%; }
    }
    .mc-flow-one   { animation: mc-flowOne   linear forwards; }
    .mc-flow-two   { animation: mc-flowTwo   linear forwards; }
    .mc-flow-three { animation: mc-flowThree linear forwards; }

    @keyframes mc-scaleIn {
      0%   { transform: scale(0); opacity: 0; }
      70%  { transform: scale(1.1); }
      100% { transform: scale(1);   opacity: 1; }
    }
    .animate-word-pop { animation: mc-scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }

    @keyframes cloudDash {
      0% {
        stroke-dashoffset: 58;
      }
      50% {
        stroke-dashoffset: 15;
      }
      100% {
        stroke-dashoffset: 58;
      }
    }
    .animate-cloud-dash {
      stroke-dasharray: 58;
      animation: cloudDash 2s ease-in-out infinite;
    }
  `;
  document.head.appendChild(style);
}

const CHART_COLORS = [
  "linear-gradient(to top, #3a7bd5, #3a6073)",
  "linear-gradient(to top, #7fa99b, #a8d3c5)",
  "linear-gradient(to top, #8fbc8f, #b8e2b8)",
  "linear-gradient(to top, #e5a93b, #f5d061)",
  "linear-gradient(to top, #cd5c5c, #f08080)",
];

const BASIC_EMOJIS = [
  { emoji: "❤️", label: "Love" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "👏", label: "Clap" },
  { emoji: "😂", label: "Laugh" },
  { emoji: "🤯", label: "Mind blown" },
];

const FLOWS = ["one", "two", "three"];

// ── Confetti burst ─────────────────────────────────────────────────────────────
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
    const gravityConfetti = 0.6, gravitySequins = 0.8;
    const dragConfetti = 0.075, dragSequins = 0.02;
    const terminalVelocity = 12;
    const colors = [
      { front: "#7b5cff", back: "#6245e0" },
      { front: "#b3c7ff", back: "#8fa5e5" },
      { front: "#5c86ff", back: "#345dd1" },
      { front: "#10b981", back: "#047857" },
      { front: "#fbbf24", back: "#d97706" },
      { front: "#ff5a5f", back: "#e03e42" },
    ];
    const rng = (a, b) => Math.random() * (b - a) + a;

    function Confetto(side) {
      this.randomModifier = rng(0, 99);
      this.color = colors[Math.floor(rng(0, colors.length))];
      this.dimensions = { x: rng(5, 9), y: rng(8, 15) };
      if (side === "left") {
        this.position = { x: 0, y: canvas.height };
        this.velocity = { x: rng(8, 22), y: -rng(14, 24) };
      } else {
        this.position = { x: canvas.width, y: canvas.height };
        this.velocity = { x: -rng(8, 22), y: -rng(14, 24) };
      }
      this.rotation = rng(0, 2 * Math.PI);
      this.scale = { x: 1, y: 1 };
    }
    Confetto.prototype.update = function () {
      this.velocity.x -= this.velocity.x * dragConfetti;
      this.velocity.y = Math.min(this.velocity.y + gravityConfetti, terminalVelocity);
      this.velocity.x += Math.random() > 0.5 ? Math.random() * 0.5 : -Math.random() * 0.5;
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;
      this.scale.y = Math.cos((this.position.y + this.randomModifier) * 0.09);
    };

    function Sequin(side) {
      this.color = colors[Math.floor(rng(0, colors.length))].back;
      this.radius = rng(1.5, 3);
      if (side === "left") {
        this.position = { x: 0, y: canvas.height };
        this.velocity = { x: rng(6, 20), y: -rng(15, 25) };
      } else {
        this.position = { x: canvas.width, y: canvas.height };
        this.velocity = { x: -rng(6, 20), y: -rng(15, 25) };
      }
    }
    Sequin.prototype.update = function () {
      this.velocity.x -= this.velocity.x * dragSequins;
      this.velocity.y = Math.min(this.velocity.y + gravitySequins, terminalVelocity);
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;
    };

    for (let i = 0; i < 40; i++) {
      confetti.push(new Confetto("left"));
      confetti.push(new Confetto("right"));
    }
    for (let i = 0; i < 20; i++) {
      sequins.push(new Sequin("left"));
      sequins.push(new Sequin("right"));
    }

    let animationFrame, elapsedFrames = 0;
    const renderLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
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
      if ((confetti.length === 0 && sequins.length === 0) || elapsedFrames > 180) {
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

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50 w-full h-full" />;
}

function getQuestionFontSize(text) {
  if (!text) return "text-3xl md:text-4xl";
  const len = text.length;
  if (len <= 40) return "text-3xl md:text-4xl";
  if (len <= 80) return "text-2xl md:text-3xl";
  if (len <= 140) return "text-xl md:text-2xl";
  return "text-base md:text-lg";
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function MasterclassPresent({
  poll,
  cleanTitle,
  pollId,
  currentQuestionIndex,
  currentQuestion,
  totalQuestions,
  isVotingActive,
  showQR,
  setShowQR,
  isFullscreen,
  toggleFullscreen,
  totalVotes,
  getVoteCount,
  maxVotes,
  handlePrevQuestion,
  handleNextQuestion,
  handleStartVoting,
  handleStopVoting,
  handleEndPoll,
  pollUrl,
  router,
  reactions = [],
  addReaction,
  isTransitioning,
}) {
  const [confettiActive, setConfettiActive] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState([]);

  useEffect(() => { injectGlobalStyles(); }, []);

  const isWordCloud =
    currentQuestion?.type === "WordCloud" ||
    currentQuestion?.type === 1 ||
    String(currentQuestion?.type).toLowerCase() === "wordcloud" ||
    !currentQuestion?.options ||
    currentQuestion.options.length === 0 ||
    currentQuestion.options.every((opt) => {
      const txt = typeof opt === "string" ? opt : opt.text || "";
      return !txt.trim();
    });

  const seenWordsOrder = useRef([]);
  const prevQuestionIndex = useRef(currentQuestionIndex);

  const wordsList = useMemo(() => {
    const wordsData = poll.wordCloudCounts?.[currentQuestionIndex.toString()] || {};

    if (prevQuestionIndex.current !== currentQuestionIndex) {
      seenWordsOrder.current = [];
      prevQuestionIndex.current = currentQuestionIndex;
    }

    Object.keys(wordsData).forEach((word) => {
      if (!seenWordsOrder.current.includes(word)) {
        seenWordsOrder.current.push(word);
      }
    });

    seenWordsOrder.current = seenWordsOrder.current.filter((word) => word in wordsData);

    return seenWordsOrder.current.map((text) => ({
      text,
      count: wordsData[text],
    }));
  }, [poll.wordCloudCounts, currentQuestionIndex]);

  const chartInstance = useRef(null);

  const WORD_COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#2dd4bf", "#f472b6"];
  const getWordColor = (word) => {
    if (!word) return "#60a5fa";
    let hash = 0;
    for (let i = 0; i < word.length; i++) { hash = (hash << 5) - hash + word.charCodeAt(i); hash |= 0; }
    return WORD_COLORS[Math.abs(hash) % WORD_COLORS.length];
  };

  useEffect(() => {
    let disposed = false;
    const loadScript = (src) => new Promise((resolve, reject) => {
      if (typeof window === "undefined") return resolve();
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement("script");
      s.src = src; s.async = false;
      s.onload = () => resolve(); s.onerror = () => reject();
      document.body.appendChild(s);
    });

    const initChart = async () => {
      try {
        await loadScript("https://cdn.amcharts.com/lib/4/core.js");
        await loadScript("https://cdn.amcharts.com/lib/4/charts.js");
        await loadScript("https://cdn.amcharts.com/lib/4/plugins/wordCloud.js");
        await loadScript("https://cdn.amcharts.com/lib/4/themes/animated.js");
        if (disposed || !window.am4core || !window.am4plugins_wordCloud) return;
        if (window.am4themes_animated) window.am4core.useTheme(window.am4themes_animated.default || window.am4themes_animated);
        setTimeout(() => {
          if (disposed) return;
          const container = document.getElementById("chartdiv");
          if (!container) return;
          if (chartInstance.current) chartInstance.current.dispose();
          const chart = window.am4core.create("chartdiv", window.am4plugins_wordCloud.WordCloud);
          if (chart.logo) chart.logo.dispose();
          const series = chart.series.push(new window.am4plugins_wordCloud.WordCloudSeries());
          series.accuracy = 4; series.step = 15; series.rotationThreshold = 0.7;
          series.maxCount = 100; series.minWordLength = 2;
          series.randomness = 0;
          series.interpolationDuration = 800;
          series.labels.template.tooltipText = "{word}: {value}";
          series.fontFamily = "Libre Baskerville";
          series.maxFontSize = window.am4core.percent(30);
          series.minFontSize = window.am4core.percent(6);
          series.dataFields.word = "word"; series.dataFields.value = "count";
          series.labels.template.adapter.add("fill", (fill, target) => {
            if (target.dataItem?.word) return window.am4core.color(getWordColor(target.dataItem.word));
            return fill;
          });
          series.data = wordsList.map((w) => ({ word: w.text, count: w.count }));
          chartInstance.current = chart;
        }, 80);
      } catch (err) { console.error("Failed to load amCharts wordCloud", err); }
    };

    if (wordsList.length > 0) initChart();
    return () => { disposed = true; if (chartInstance.current) { chartInstance.current.dispose(); chartInstance.current = null; } };
  }, [wordsList.length > 0]);

  useEffect(() => {
    if (chartInstance.current && wordsList.length > 0) {
      const series = chartInstance.current.series.getIndex(0);
      if (series) series.data = wordsList.map((w) => ({ word: w.text, count: w.count }));
    }
  }, [wordsList]);

  useEffect(() => {
    const onKey = (e) => {
      if (isTransitioning) return;
      if (e.key === "ArrowLeft" && currentQuestionIndex > 0) handlePrevQuestion();
      else if (e.key === "ArrowRight" && currentQuestionIndex < totalQuestions - 1) handleNextQuestion();
      else if (e.key.toLowerCase() === "k") isVotingActive ? handleStopVoting() : handleStartVoting();
      else if (e.key.toLowerCase() === "c") setConfettiActive(true);
      else if (e.key.toLowerCase() === "q") setShowQR(!showQR);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentQuestionIndex, totalQuestions, isVotingActive, handlePrevQuestion, handleNextQuestion, handleStartVoting, handleStopVoting, showQR, setShowQR, isTransitioning]);

  // Spawn a floating emoji with random flow path + random timing + random size
  const launchEmoji = (emoji) => {
    if (addReaction) addReaction(emoji);
    const id = Date.now() + Math.random();
    const flow = FLOWS[Math.floor(Math.random() * 3)];
    const timing = (Math.random() * (1.3 - 1.0) + 1.0).toFixed(1);
    const size = Math.floor(Math.random() * (30 - 22) + 22);
    setFloatingEmojis((prev) => [...prev, { id, emoji, flow, timing, size }]);
    setTimeout(() => setFloatingEmojis((prev) => prev.filter((r) => r.id !== id)), timing * 1000 + 200);
  };

  return (
    <div className="h-screen max-h-screen bg-[url('/MasterClassNewBg.png')] bg-cover bg-center bg-no-repeat flex flex-col text-emerald-50 font-epilogue font-light overflow-hidden relative select-none">
      {/* Top Bar */}
      <header className="w-full z-20 relative bg-transparent">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div><img src="/GryphonWhite.png" alt="Gryphon Logo" className="h-16 w-auto object-contain" /></div>
          <div><img src="/mc01.png" alt="Masterclass Logo" className="h-12 w-auto object-contain" /></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-between px-6 md:px-12 pt-6 pb-28 z-10 relative max-w-7xl w-full mx-auto bg-transparent rounded-3xl my-4">
        {poll.activeQuestionIndex === -1 || poll.activeQuestionIndex === undefined ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center my-auto">
            <h1 className="text-5xl md:text-7xl font-baskerville font-light text-white leading-tight drop-shadow-2xl tracking-wide animate-fade-in">
              Welcome to Masterclass 3.0
            </h1>
            <p className="text-emerald-350 font-epilogue text-lg md:text-xl mt-4 opacity-80 tracking-widest uppercase">
              The Adventurous Intelligence
            </p>
          </div>
        ) : (
          <>
            <div className="text-center w-full max-w-4xl mx-auto mb-6 mt-2">
              <h2 className={`${getQuestionFontSize(currentQuestion?.text)} font-baskerville font-light text-white leading-tight drop-shadow-lg tracking-wide`}>
                {currentQuestion?.text || "No question"}
              </h2>
            </div>

            {isWordCloud ? (
              <div className="w-full flex-1 flex flex-col justify-center items-center max-w-5xl mx-auto my-auto mb-6 pt-4">
                {wordsList.length > 0 ? (
                  <div id="chartdiv" style={{ width: "100%", height: "480px", minHeight: "400px" }} className="overflow-visible" />
                ) : (
                  <div className="flex items-center justify-center w-full h-[480px] min-h-[400px]">
                    <svg viewBox="0 0 24 24" className="w-24 h-24 text-emerald-450">
                      <path
                        d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.08)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        className="animate-cloud-dash"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full flex-1 flex flex-col justify-end mb-6">
                <div className="flex items-end justify-center gap-6 md:gap-12 w-full max-w-5xl mx-auto border-b border-white/40 pb-0">
                  {currentQuestion?.options?.map((option, idx) => {
                    const votes = getVoteCount(idx);
                    const height = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
                    const gradient = CHART_COLORS[idx % CHART_COLORS.length];
                    return (
                      <div key={idx} className="flex flex-col items-center flex-1 max-w-[120px] h-[35vh] justify-end">
                        <div className="w-full flex flex-col items-center justify-end" style={votes > 0 ? { height: `${Math.max(height, 16)}%` } : {}}>
                          <div className="text-white font-bold text-2xl mb-2 drop-shadow-md">{votes}</div>
                          {votes > 0 && (
                            <div className="w-full rounded-t border-t-2 border-x-2 border-white flex-1 transition-all duration-700 ease-out"
                              style={{ background: gradient, boxShadow: "0 4px 20px rgba(255,255,255,0.1)" }} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-6 md:gap-12 w-full max-w-5xl mx-auto mt-4">
                  {currentQuestion?.options?.map((option, idx) => (
                    <div key={idx} className="flex-1 max-w-[120px] text-center">
                      <div className="text-slate-200 font-semibold text-xs md:text-sm whitespace-normal break-words w-full leading-snug drop-shadow-sm px-1" title={option.text}>
                        {option.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
          <div className="bg-black/90 border border-white/15 p-8 rounded-3xl flex flex-col items-center max-w-lg w-full shadow-2xl relative mx-4">
            <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-white font-bold text-xl mb-4 text-center">Join the Poll</h3>
            <div className="bg-white p-4 rounded-2xl mb-4"><QRCodeSVG value={pollUrl} size={400} /></div>
            <p className="text-emerald-350 font-mono font-bold tracking-wider text-base select-all">{pollId}</p>
            <p className="text-slate-400 text-xs text-center mt-2">Scan the QR code or click the link below to participate:</p>
            <a href={pollUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 hover:underline mt-4 text-sm font-semibold break-all text-center">{pollUrl}</a>
          </div>
        </div>
      )}

      {/* ── Bottom Controls Bar ── */}
      <div className="fixed bottom-6 left-0 right-0 w-full px-6 md:px-12 z-20 pointer-events-none flex justify-between items-center">
        {/* Left: Poll controls */}
        <div className="bg-black/60 border border-white/10 rounded-xl p-2 flex items-center gap-3 shadow-2xl pointer-events-auto">
          {isVotingActive ? (
            <button onClick={handleStopVoting} disabled={isTransitioning} className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed">Stop</button>
          ) : (
            <button onClick={handleStartVoting} disabled={isTransitioning} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed">Start</button>
          )}
          <button onClick={handlePrevQuestion} disabled={isTransitioning || currentQuestionIndex <= 0} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all" title="Previous Question">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="bg-white/10 border border-white/10 text-white px-3 py-0.5 rounded font-mono text-sm font-bold min-w-[2rem] text-center">{currentQuestionIndex + 1}</div>
          <button onClick={handleNextQuestion} disabled={isTransitioning || currentQuestionIndex >= totalQuestions - 1} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all" title="Next Question">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={handleEndPoll} className="px-3 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-900/30 text-xs font-bold uppercase tracking-wider transition-all">End</button>
        </div>

        {/* Right: Stats + Emojis + QR + fullscreen */}
        <div className="bg-black/60 border border-white/10 rounded-xl p-2 flex items-center gap-2 shadow-2xl pointer-events-auto relative">
          {/* Float zone: emojis drift upward through here, relative to the container */}
          <div className="absolute bottom-full right-[180px] pointer-events-none z-50 w-36 h-72 overflow-visible flex justify-center items-end mb-2">
            {floatingEmojis.map((r) => (
              <span
                key={r.id}
                className={`mc-flow-${r.flow} absolute select-none pointer-events-none`}
                style={{
                  animationDuration: `${r.timing}s`,
                  fontSize: `${r.size}px`,
                  bottom: 0,
                }}
              >
                {r.emoji}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-slate-300 text-xs font-bold bg-white/5 px-2 py-1.5 rounded-lg border border-white/5">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>{totalVotes}</span>
          </div>

          <div className="w-px h-4 bg-white/20" />

          <button onClick={() => setShowQR(!showQR)} className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all border ${showQR ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500/20" : "bg-white/5 hover:bg-white/15 text-slate-300 border-white/5"}`} title="Toggle QR Code">QR</button>
          <button onClick={toggleFullscreen} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all border border-white/5" title="Toggle Fullscreen">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <div className="w-px h-4 bg-white/20" />

          {/* Horizontal Emojis Panel */}
          {/* <div className="flex items-center gap-1">
            {BASIC_EMOJIS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => launchEmoji(item.emoji)}
                title={item.label}
                className="w-7 h-7 rounded-full flex items-center justify-center text-base hover:scale-125 active:scale-90 transition-transform duration-100 select-none bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                {item.emoji}
              </button>
            ))}
          </div> */}
        </div>
      </div>

      <ConfettiBurst active={confettiActive} onComplete={() => setConfettiActive(false)} />
    </div>
  );
}
