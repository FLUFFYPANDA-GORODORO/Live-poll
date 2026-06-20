"use client";

import { useEffect, useState, useRef } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  Minimize, 
  Square, 
  Users, 
  X,
  GraduationCap
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// Elegant, fresh pastel gradients that look stunning on green and dark overlay backgrounds
const CHART_COLORS = [
  "linear-gradient(to top, #3a7bd5, #3a6073)", // Slate Blue
  "linear-gradient(to top, #7fa99b, #a8d3c5)", // Sage/Mint
  "linear-gradient(to top, #8fbc8f, #b8e2b8)", // Pastel Green
  "linear-gradient(to top, #e5a93b, #f5d061)", // Soft Gold
  "linear-gradient(to top, #cd5c5c, #f08080)"  // Soft Coral
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
      { front: "#7b5cff", back: "#6245e0" }, // Purple
      { front: "#b3c7ff", back: "#8fa5e5" }, // Light Blue
      { front: "#5c86ff", back: "#345dd1" }, // Dark Blue
      { front: "#10b981", back: "#047857" }, // Emerald
      { front: "#fbbf24", back: "#d97706" }, // Gold
      { front: "#ff5a5f", back: "#e03e42" }  // Coral
    ];

    const randomRange = (min, max) => Math.random() * (max - min) + min;

    const initConfettoVelocity = (xRange, yRange) => {
      const x = randomRange(xRange[0], xRange[1]);
      const range = yRange[1] - yRange[0] + 1;
      let y = yRange[1] - Math.abs(randomRange(0, range) + randomRange(0, range) - range);
      if (y >= yRange[1] - 1) {
        y += Math.random() < 0.25 ? randomRange(1, 3) : 0;
      }
      return { x, y: -y };
    };

    function Confetto() {
      this.randomModifier = randomRange(0, 99);
      this.color = colors[Math.floor(randomRange(0, colors.length))];
      this.dimensions = {
        x: randomRange(5, 9),
        y: randomRange(8, 15),
      };
      this.position = {
        x: canvas.width / 2,
        y: canvas.height / 2,
      };
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
      this.position = {
        x: canvas.width / 2,
        y: canvas.height / 2,
      };
      this.velocity = {
        x: randomRange(-10, 10),
        y: randomRange(-12, -20),
      };
    }

    Sequin.prototype.update = function () {
      this.velocity.x -= this.velocity.x * dragSequins;
      this.velocity.y = Math.min(this.velocity.y + gravitySequins, terminalVelocity);
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;
    };

    for (let i = 0; i < confettiCount; i++) {
      confetti.push(new Confetto());
    }
    for (let i = 0; i < sequinCount; i++) {
      sequins.push(new Sequin());
    }

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

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", handleResize);
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [active, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
}



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
  addReaction
}) {
  const [confettiActive, setConfettiActive] = useState(false);

  const isWordCloud = currentQuestion?.type === "WordCloud" || currentQuestion?.type === 1 || String(currentQuestion?.type).toLowerCase() === "wordcloud" || !currentQuestion?.options || currentQuestion.options.length === 0 || currentQuestion.options.every(opt => {
    const txt = typeof opt === "string" ? opt : (opt.text || "");
    return !txt.trim();
  });

  // Get word cloud list sorted
  const wordsData = poll.wordCloudCounts?.[currentQuestionIndex.toString()] || {};
  const wordsList = Object.entries(wordsData)
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count);

  const chartInstance = useRef(null);

  const WORD_COLORS = [
    "#60a5fa", // Blue
    "#34d399", // Emerald
    "#fbbf24", // Yellow/Gold
    "#f87171", // Coral/Red
    "#a78bfa", // Lavender
    "#2dd4bf", // Teal
    "#f472b6"  // Pink
  ];

  const getWordColor = (word) => {
    if (!word) return "#60a5fa";
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const colorIndex = Math.abs(hash) % WORD_COLORS.length;
    return WORD_COLORS[colorIndex];
  };

  useEffect(() => {
    let disposed = false;
    
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        if (typeof window === "undefined") return resolve();
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = false;
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.body.appendChild(script);
      });
    };

    const initChart = async () => {
      try {
        await loadScript("https://cdn.amcharts.com/lib/4/core.js");
        await loadScript("https://cdn.amcharts.com/lib/4/charts.js");
        await loadScript("https://cdn.amcharts.com/lib/4/plugins/wordCloud.js");
        await loadScript("https://cdn.amcharts.com/lib/4/themes/animated.js");

        if (disposed) return;
        if (!window.am4core || !window.am4plugins_wordCloud) return;

        // Apply theme
        if (window.am4themes_animated) {
          window.am4core.useTheme(window.am4themes_animated.default || window.am4themes_animated);
        }

        // Delay instantiation slightly to ensure DOM element is mounted
        setTimeout(() => {
          if (disposed) return;
          const container = document.getElementById("chartdiv");
          if (!container) return;

          // Dispose existing chart if any
          if (chartInstance.current) {
            chartInstance.current.dispose();
          }

          const chart = window.am4core.create("chartdiv", window.am4plugins_wordCloud.WordCloud);
          if (chart.logo) chart.logo.dispose();

          const series = chart.series.push(new window.am4plugins_wordCloud.WordCloudSeries());
          series.accuracy = 4;
          series.step = 15;
          series.rotationThreshold = 0.7; // allows some words to be rotated 90deg
          series.maxCount = 200;
          series.minWordLength = 2;
          series.labels.template.tooltipText = "{word}: {value}";
          
          series.fontFamily = "Libre Baskerville";
          series.maxFontSize = window.am4core.percent(25);
          series.minFontSize = window.am4core.percent(8);

          series.dataFields.word = "word";
          series.dataFields.value = "count";

          // Adapt fills using our theme colors
          series.labels.template.adapter.add("fill", function(fill, target) {
            if (target.dataItem && target.dataItem.word) {
              return window.am4core.color(getWordColor(target.dataItem.word));
            }
            return fill;
          });

          // Set initial data
          series.data = wordsList.map(w => ({
            word: w.text,
            count: w.count
          }));

          chartInstance.current = chart;
        }, 80);

      } catch (err) {
        console.error("Failed to load amCharts wordCloud", err);
      }
    };

    if (wordsList.length > 0) {
      initChart();
    }

    return () => {
      disposed = true;
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [wordsList.length > 0]);

  useEffect(() => {
    if (chartInstance.current && wordsList.length > 0) {
      const series = chartInstance.current.series.getIndex(0);
      if (series) {
        series.data = wordsList.map(w => ({
          word: w.text,
          count: w.count
        }));
      }
    }
  }, [wordsList]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft" && currentQuestionIndex > 0) {
        handlePrevQuestion();
      } else if (e.key === "ArrowRight" && currentQuestionIndex < totalQuestions - 1) {
        handleNextQuestion();
      } else if (e.key.toLowerCase() === "k") {
        if (isVotingActive) {
          handleStopVoting();
        } else {
          handleStartVoting();
        }
      } else if (e.key.toLowerCase() === "c") {
        setConfettiActive(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    currentQuestionIndex,
    totalQuestions,
    isVotingActive,
    handlePrevQuestion,
    handleNextQuestion,
    handleStartVoting,
    handleStopVoting,
  ]);

  const basicEmojis = [
    { emoji: '❤️', bg: 'bg-[#ff5a5f]' },
    { emoji: '😮', bg: 'bg-[#ffb400]' },
    { emoji: '👍', bg: 'bg-[#0084ff]' },
    { emoji: '😢', bg: 'bg-[#ffb400]' },
    { emoji: '😆', bg: 'bg-[#ffb400]' }
  ];

  return (
    <div className="h-screen max-h-screen bg-[url('/MCbackground.jpg')] bg-cover bg-center bg-no-repeat flex flex-col text-emerald-50 font-epilogue font-light overflow-hidden relative select-none">
      {/* Dark overlay for better contrast and legibility without blurring the background */}
      <div className="absolute inset-0 bg-black/40 z-0" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@300;400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
        
        .font-baskerville {
          font-family: 'Libre Baskerville', serif;
        }
        .font-epilogue {
          font-family: 'Epilogue', sans-serif;
        }

        @keyframes scaleIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          70% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-word-pop {
          animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      {/* Top Bar */}
      <header className="w-full z-20 relative bg-transparent">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <img src="/GryphonWhite.png" alt="Gryphon Logo" className="h-16 w-auto object-contain" />
          </div>
          <div>
            <img src="/mc01.png" alt="Masterclass Logo" className="h-12 w-auto object-contain" />
          </div>
        </div>
      </header>

      {/* Main Content (Centered & Clear) */}
      <main className="flex-1 flex flex-col justify-between px-6 md:px-12 pt-6 pb-28 z-10 relative max-w-7xl w-full mx-auto bg-black/15 rounded-3xl border border-white/5 shadow-2xl my-4">
        {/* Question Title - Centered */}
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
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10 animate-pulse text-2xl">
                  ☁️
                </div>
                <h3 className="text-white font-bold text-lg mb-1">Waiting for Responses</h3>
                <p className="text-slate-400 text-sm">Words submitted by participants will appear here in real-time.</p>
              </div>
            )}
          </div>
        ) : (
          /* Column-based Chart Layout */
          <div className="w-full flex-1 flex flex-col justify-end mb-6">
            {/* Bars Row */}
            <div className="flex items-end justify-center gap-6 md:gap-12 w-full max-w-5xl mx-auto border-b border-white/40 pb-0">
              {currentQuestion?.options?.map((option, idx) => {
                const votes = getVoteCount(idx);
                const height = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
                const gradient = CHART_COLORS[idx % CHART_COLORS.length];

                return (
                  <div key={idx} className="flex flex-col items-center flex-1 max-w-[120px] h-[35vh] justify-end">
                    <div
                      className="w-full flex flex-col items-center justify-end"
                      style={votes > 0 ? { height: `${Math.max(height, 16)}%` } : {}}
                    >
                      {/* Vote Count above bar */}
                      <div className="text-white font-bold text-2xl mb-2 drop-shadow-md">
                        {votes}
                      </div>

                      {/* Bar wrapper */}
                      {votes > 0 && (
                        <div
                          className="w-full rounded-t border-t-2 border-x-2 border-white flex-1 transition-all duration-700 ease-out"
                          style={{
                            background: gradient,
                            boxShadow: `0 4px 20px rgba(255, 255, 255, 0.1)`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Labels Row */}
            <div className="flex justify-center gap-6 md:gap-12 w-full max-w-5xl mx-auto mt-4">
              {currentQuestion?.options?.map((option, idx) => {
                return (
                  <div key={idx} className="flex-1 max-w-[120px] text-center">
                    <div className="text-slate-200 font-semibold text-xs md:text-sm whitespace-normal break-words w-full leading-snug drop-shadow-sm px-1" title={option.text}>
                      {option.text}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* QR Code Modal Overlay */}
      {showQR && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
          <div className="bg-black/90 border border-white/15 p-8 rounded-3xl flex flex-col items-center max-w-xs w-full shadow-2xl relative">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-white font-bold text-lg mb-4 text-center">Join the Poll</h3>
            <div className="bg-white p-3 rounded-2xl mb-4">
              <QRCodeSVG value={pollUrl} size={180} />
            </div>
            <p className="text-emerald-350 font-mono font-bold tracking-wider text-sm select-all">{pollId}</p>
            <p className="text-slate-400 text-xs text-center mt-2">Scan the QR code to participate</p>
          </div>
        </div>
      )}

      {/* Fixed Bottom Controls & Stats Bar (Aligned inside max-w-7xl, not screen edges) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-7xl px-6 md:px-12 z-20 pointer-events-none flex justify-between items-center">
        {/* Control Buttons Tab (Bottom Left) */}
        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-2 flex items-center gap-3 shadow-2xl pointer-events-auto">
          {isVotingActive ? (
            <button
              onClick={handleStopVoting}
              className="px-3 py-1.5 rounded-lg bg-red-650 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={handleStartVoting}
              className="px-3 py-1.5 rounded-lg bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all"
            >
              Start
            </button>
          )}

          <button
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex <= 0}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            title="Previous Question"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="bg-white/10 border border-white/10 text-white px-3 py-0.5 rounded font-mono text-sm font-bold min-w-[2rem] text-center">
            {currentQuestionIndex + 1}
          </div>

          <button
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex >= totalQuestions - 1}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            title="Next Question"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleEndPoll}
            className="px-3 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/60 text-red-350 border border-red-900/30 text-xs font-bold uppercase tracking-wider transition-all"
          >
            End
          </button>

          <div className="w-px h-4 bg-white/20" />

          <button
            onClick={() => setConfettiActive(true)}
            className="text-slate-400 hover:text-white transition-colors px-1 text-base active:scale-95 duration-100"
            title="Confetti Burst (C)"
          >
            <span>🎉</span>
          </button>


        </div>

        {/* Stats/Emoji Buttons Tab (Bottom Right) */}
        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-2 flex items-center gap-3 shadow-2xl pointer-events-auto">
          {/* Emoji Reactions Panel */}
          <div className="flex items-center pl-1">
            {basicEmojis.map((item, idx) => (
              <button
                key={idx}
                onClick={() => addReaction(item.emoji)}
                className={`w-7 h-7 rounded-full border-2 border-white ${item.bg} flex items-center justify-center text-xs shadow-md hover:scale-125 active:scale-95 transition-all select-none duration-150 -ml-1.5 first:ml-0`}
                style={{ zIndex: 10 - idx }}
              >
                {item.emoji}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-white/20" />

          {/* Total Votes Count */}
          <div className="flex items-center gap-1.5 text-slate-300 text-xs font-bold bg-white/5 px-2 py-1.5 rounded-lg border border-white/5">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>{totalVotes}</span>
          </div>

          <div className="w-px h-4 bg-white/20" />

          {/* QR Code Toggle */}
          <button
            onClick={() => setShowQR(!showQR)}
            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              showQR ? "bg-emerald-650 hover:bg-emerald-700 text-white border-emerald-500/20" : "bg-white/5 hover:bg-white/15 text-slate-300 border-white/5"
            }`}
            title="Toggle QR Code"
          >
            QR
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all border border-white/5"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <ConfettiBurst active={confettiActive} onComplete={() => setConfettiActive(false)} />
    </div>
  );
}
