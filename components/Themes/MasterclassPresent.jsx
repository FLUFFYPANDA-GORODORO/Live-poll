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

// Inject global styles once — avoids React removeChild crash from re-mounting <style> inside JSX
const GLOBAL_STYLE_ID = "masterclass-present-styles";
function injectGlobalStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(GLOBAL_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = GLOBAL_STYLE_ID;
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@300;400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
    .font-baskerville { font-family: 'Libre Baskerville', serif; }
    .font-epilogue { font-family: 'Epilogue', sans-serif; }

    @keyframes mc-floatUp {
      0%   { opacity: 0; transform: translateY(0px) translateX(0px) scale(0.5); }
      12%  { opacity: 1; transform: translateY(-18px) translateX(var(--rx, 0px)) scale(1.25); }
      100% { opacity: 0; transform: translateY(-130px) translateX(var(--rx, 0px)) scale(0.75); }
    }
    .mc-float-emoji {
      animation: mc-floatUp 2.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    @keyframes mc-scaleIn {
      0%   { transform: scale(0); opacity: 0; }
      70%  { transform: scale(1.1); }
      100% { transform: scale(1); opacity: 1; }
    }
    .animate-word-pop { animation: mc-scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
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

function ConfettiBurst({ active, onComplete }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let confetti = [];
    let sequins = [];
    const confettiCount = 40;
    const sequinCount = 20;
    const gravityConfetti = 0.6;
    const gravitySequins = 0.8;
    const dragConfetti = 0.075;
    const dragSequins = 0.02;
    const terminalVelocity = 12;

    const colors = [
      { front: "#7b5cff", back: "#6245e0" },
      { front: "#b3c7ff", back: "#8fa5e5" },
      { front: "#5c86ff", back: "#345dd1" },
      { front: "#10b981", back: "#047857" },
      { front: "#fbbf24", back: "#d97706" },
      { front: "#ff5a5f", back: "#e03e42" },
    ];

    const randomRange = (min, max) => Math.random() * (max - min) + min;
    const initConfettoVelocity = (xRange, yRange) => {
      const x = randomRange(xRange[0], xRange[1]);
      const range = yRange[1] - yRange[0] + 1;
      let y = yRange[1] - Math.abs(randomRange(0, range) + randomRange(0, range) - range);
      if (y >= yRange[1] - 1) y += Math.random() < 0.25 ? randomRange(1, 3) : 0;
      return { x, y: -y };
    };

    function Confetto() {
      this.randomModifier = randomRange(0, 99);
      this.color = colors[Math.floor(randomRange(0, colors.length))];
      this.dimensions = { x: randomRange(5, 9), y: randomRange(8, 15) };
      this.position = { x: canvas.width / 2, y: canvas.height / 2 };
      this.rotation = randomRange(0, 2 * Math.PI);
      this.scale = { x: 1, y: 1 };
      this.velocity = initConfettoVelocity([-12, 12], [10, 18]);
    }
    Confetto.prototype.update = function () {
      this.velocity.x -= this.velocity.x * dragConfetti;
      this.velocity.y = Math.min(this.velocity.y + gravityConfetti, terminalVelocity);
      this.velocity.x += Math.random() > 0.5 ? Math.random() * 0.5 : -Math.random() * 0.5;
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;
      this.scale.y = Math.cos((this.position.y + this.randomModifier) * 0.09);
    };

    function Sequin() {
      this.color = colors[Math.floor(randomRange(0, colors.length))].back;
      this.radius = randomRange(1.5, 3);
      this.position = { x: canvas.width / 2, y: canvas.height / 2 };
      this.velocity = { x: randomRange(-10, 10), y: randomRange(-12, -20) };
    }
    Sequin.prototype.update = function () {
      this.velocity.x -= this.velocity.x * dragSequins;
      this.velocity.y = Math.min(this.velocity.y + gravitySequins, terminalVelocity);
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;
    };

    for (let i = 0; i < confettiCount; i++) confetti.push(new Confetto());
    for (let i = 0; i < sequinCount; i++) sequins.push(new Sequin());

    let animationFrame;
    let elapsedFrames = 0;

    const renderLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      confetti.forEach((confetto) => {
        let width = confetto.dimensions.x * confetto.scale.x;
        let height = confetto.dimensions.y * confetto.scale.y;
        ctx.translate(confetto.position.x, confetto.position.y);
        ctx.rotate(confetto.rotation);
        confetto.update();
        ctx.fillStyle = confetto.scale.y > 0 ? confetto.color.front : confetto.color.back;
        ctx.fillRect(-width / 2, -height / 2, width, height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      });
      sequins.forEach((sequin) => {
        ctx.translate(sequin.position.x, sequin.position.y);
        sequin.update();
        ctx.fillStyle = sequin.color;
        ctx.beginPath();
        ctx.arc(0, 0, sequin.radius, 0, 2 * Math.PI);
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
    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", handleResize);
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [active, onComplete]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50 w-full h-full" />;
}

const BASIC_EMOJIS = [
  { emoji: "❤️",  label: "Love" },
  { emoji: "🔥",  label: "Fire" },
  { emoji: "👏",  label: "Clap" },
  { emoji: "😂",  label: "Laugh" },
  { emoji: "🤯",  label: "Mind blown" },
];

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
}) {
  const [confettiActive, setConfettiActive] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState([]);

  // Inject styles once into <head> to avoid React removeChild crash
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

  const wordsList = useMemo(() => {
    const wordsData = poll.wordCloudCounts?.[currentQuestionIndex.toString()] || {};
    return Object.entries(wordsData)
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count);
  }, [poll.wordCloudCounts, currentQuestionIndex]);

  const chartInstance = useRef(null);

  const WORD_COLORS = ["#60a5fa","#34d399","#fbbf24","#f87171","#a78bfa","#2dd4bf","#f472b6"];
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
      const script = document.createElement("script");
      script.src = src; script.async = false;
      script.onload = () => resolve(); script.onerror = () => reject();
      document.body.appendChild(script);
    });

    const initChart = async () => {
      try {
        await loadScript("https://cdn.amcharts.com/lib/4/core.js");
        await loadScript("https://cdn.amcharts.com/lib/4/charts.js");
        await loadScript("https://cdn.amcharts.com/lib/4/plugins/wordCloud.js");
        await loadScript("https://cdn.amcharts.com/lib/4/themes/animated.js");
        if (disposed) return;
        if (!window.am4core || !window.am4plugins_wordCloud) return;
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
          series.maxCount = 200; series.minWordLength = 2;
          series.labels.template.tooltipText = "{word}: {value}";
          series.fontFamily = "Libre Baskerville";
          series.maxFontSize = window.am4core.percent(45);
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
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft" && currentQuestionIndex > 0) handlePrevQuestion();
      else if (e.key === "ArrowRight" && currentQuestionIndex < totalQuestions - 1) handleNextQuestion();
      else if (e.key.toLowerCase() === "k") isVotingActive ? handleStopVoting() : handleStartVoting();
      else if (e.key.toLowerCase() === "c") setConfettiActive(true);
      else if (e.key.toLowerCase() === "q") setShowQR(!showQR);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentQuestionIndex, totalQuestions, isVotingActive, handlePrevQuestion, handleNextQuestion, handleStartVoting, handleStopVoting, showQR, setShowQR]);

  // Launch a floating emoji — slight random X drift, floats straight up
  const launchEmoji = (emoji) => {
    if (addReaction) addReaction(emoji);
    const id = Date.now() + Math.random();
    const rx = (Math.random() * 40 - 20).toFixed(1); // -20..+20px drift
    setFloatingEmojis((prev) => [...prev, { id, emoji, rx }]);
    setTimeout(() => setFloatingEmojis((prev) => prev.filter((r) => r.id !== id)), 2400);
  };

  return (
    <div className="h-screen max-h-screen bg-[url('/MasterClassNewBg.png')] bg-cover bg-center bg-no-repeat flex flex-col text-emerald-50 font-epilogue font-light overflow-hidden relative select-none">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40 z-0" />

      {/* ── Floating Emojis — fixed bottom-right corner ── */}
      <div className="fixed bottom-20 right-8 pointer-events-none z-40 w-20 h-52 overflow-visible flex justify-center items-end">
        {floatingEmojis.map((r) => (
          <span
            key={r.id}
            className="mc-float-emoji absolute text-3xl select-none"
            style={{ "--rx": `${r.rx}px`, bottom: 0, left: "50%" }}
          />
        ))}
        {floatingEmojis.map((r) => (
          <span
            key={"e" + r.id}
            className="mc-float-emoji absolute text-3xl select-none"
            style={{ "--rx": `${r.rx}px`, bottom: 0, left: "50%" }}
          >
            {r.emoji}
          </span>
        ))}
      </div>

      {/* Top Bar */}
      <header className="w-full z-20 relative bg-transparent">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div><img src="/GryphonWhite.png" alt="Gryphon Logo" className="h-16 w-auto object-contain" /></div>
          <div><img src="/mc01.png" alt="Masterclass Logo" className="h-12 w-auto object-contain" /></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-between px-6 md:px-12 pt-6 pb-28 z-10 relative max-w-7xl w-full mx-auto bg-black/15 rounded-3xl border border-white/5 shadow-2xl my-4">
        <div className="text-center w-full max-w-4xl mx-auto mb-6 mt-2">
          <h2 className="text-4xl md:text-5xl font-baskerville font-light text-white leading-tight drop-shadow-lg tracking-wide">
            {currentQuestion?.text || "No question"}
          </h2>
        </div>

        {isWordCloud ? (
          <div className="w-full flex-1 flex flex-col justify-center items-center max-w-5xl mx-auto my-auto mb-6 pt-4">
            {wordsList.length > 0 ? (
              <div id="chartdiv" style={{ width: "100%", height: "480px", minHeight: "400px" }} className="overflow-visible" />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-black/15 backdrop-blur-[0.5px] rounded-3xl border border-white/5 text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10 animate-pulse text-2xl">☁️</div>
                <h3 className="text-white font-bold text-lg mb-1">Waiting for Responses</h3>
                <p className="text-slate-400 text-sm">Words submitted by participants will appear here in real-time.</p>
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
      </main>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
          <div className="bg-black/90 border border-white/15 p-8 rounded-3xl flex flex-col items-center max-w-md w-full shadow-2xl relative mx-4">
            <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-white font-bold text-xl mb-4 text-center">Join the Poll</h3>
            <div className="bg-white p-4 rounded-2xl mb-4"><QRCodeSVG value={pollUrl} size={320} /></div>
            <p className="text-emerald-350 font-mono font-bold tracking-wider text-base select-all">{pollId}</p>
            <p className="text-slate-400 text-xs text-center mt-2">Scan the QR code or click the link below to participate:</p>
            <a href={pollUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 hover:underline mt-4 text-sm font-semibold break-all text-center">{pollUrl}</a>
          </div>
        </div>
      )}

      {/* ── Bottom Controls Bar ── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-7xl px-6 md:px-12 z-20 pointer-events-none flex justify-between items-center">

        {/* Left: Poll controls */}
        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-2 flex items-center gap-3 shadow-2xl pointer-events-auto">
          {isVotingActive ? (
            <button onClick={handleStopVoting} className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all">Stop</button>
          ) : (
            <button onClick={handleStartVoting} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all">Start</button>
          )}
          <button onClick={handlePrevQuestion} disabled={currentQuestionIndex <= 0} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all" title="Previous Question">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="bg-white/10 border border-white/10 text-white px-3 py-0.5 rounded font-mono text-sm font-bold min-w-[2rem] text-center">{currentQuestionIndex + 1}</div>
          <button onClick={handleNextQuestion} disabled={currentQuestionIndex >= totalQuestions - 1} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all" title="Next Question">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={handleEndPoll} className="px-3 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-900/30 text-xs font-bold uppercase tracking-wider transition-all">End</button>
          <div className="w-px h-4 bg-white/20" />
          <button onClick={() => setConfettiActive(true)} className="text-slate-400 hover:text-white transition-colors px-1 text-base active:scale-95 duration-100" title="Confetti Burst (C)">🎉</button>
        </div>

        {/* Right: Emoji reactions + stats + QR + fullscreen */}
        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-2 flex items-center gap-2 shadow-2xl pointer-events-auto">

          {/* Emoji buttons — tight cluster */}
          <div className="flex items-center gap-0.5">
            {BASIC_EMOJIS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => launchEmoji(item.emoji)}
                title={item.label}
                className="w-8 h-8 rounded-full flex items-center justify-center text-base hover:scale-125 active:scale-90 transition-transform duration-100 select-none bg-white/10 hover:bg-white/20"
              >
                {item.emoji}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-white/20" />

          {/* Vote count */}
          <div className="flex items-center gap-1.5 text-slate-300 text-xs font-bold bg-white/5 px-2 py-1.5 rounded-lg border border-white/5">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>{totalVotes}</span>
          </div>

          <div className="w-px h-4 bg-white/20" />

          {/* QR toggle */}
          <button onClick={() => setShowQR(!showQR)} className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all border ${showQR ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500/20" : "bg-white/5 hover:bg-white/15 text-slate-300 border-white/5"}`} title="Toggle QR Code">QR</button>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all border border-white/5" title="Toggle Fullscreen">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <ConfettiBurst active={confettiActive} onComplete={() => setConfettiActive(false)} />
    </div>
  );
}
