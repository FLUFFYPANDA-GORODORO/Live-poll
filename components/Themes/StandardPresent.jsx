"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Users,
  X,
  Trash2,
  Zap,
  Copy,
  Check,
  Music,
  Volume2,
  VolumeX,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { getThemeStyles } from "@/lib/themeHelper";
import toast from "react-hot-toast";

// ── Continuous Closed-Loop Mathematical Sine Wave Canvas ────────────────────────
function CanvasSineWave({ isPlaying }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let phase = 0;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const w = 32;
    const h = 16;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = isPlaying ? "#ffffff" : "rgba(255, 255, 255, 0.4)";

      const amplitude = isPlaying ? 4.8 : 2.0;
      const centerY = h / 2;
      const cycles = 1.5; // 1.5 complete wavelengths across width

      for (let x = 0; x <= w; x += 1) {
        // Continuous harmonic sine function with phase
        const normalizedX = x / w;
        const angle = normalizedX * (cycles * 2 * Math.PI) + phase;
        // Natural end tapering so edges smoothly meet center line
        const envelope = Math.sin(normalizedX * Math.PI);
        const y = centerY + Math.sin(angle) * amplitude * envelope;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      if (isPlaying) {
        // Continuous phase advance: exactly 2*PI radians per cycle
        phase = (phase + 0.045) % (2 * Math.PI);
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying]);

  return <canvas ref={canvasRef} style={{ width: "32px", height: "16px" }} className="block" />;
}

// ── Isolated Word Cloud Component ───────────────────────────────────────────────
function WordCloudView({ wordsList, themeStyles, currentQuestionIndex }) {
  const containerRef = useRef(null);
  const chartInstance = useRef(null);
  const wordsListRef = useRef(wordsList);

  const getWordColor = (word) => {
    if (!word) return themeStyles.paletteColors?.[0] || "#60a5fa";
    let hash = 0;
    for (let i = 0; i < word.length; i++) { hash = (hash << 5) - hash + word.charCodeAt(i); hash |= 0; }
    const colors = themeStyles.paletteColors?.length ? themeStyles.paletteColors : ["#60a5fa", "#34d399", "#f472b6", "#fbbf24"];
    return colors[Math.abs(hash) % colors.length];
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

        if (!containerRef.current || disposed) return;

        if (!chartInstance.current) {
          const chart = window.am4core.create(containerRef.current, window.am4plugins_wordCloud.WordCloud);
          if (chart.logo) chart.logo.dispose();
          const series = chart.series.push(new window.am4plugins_wordCloud.WordCloudSeries());
          series.accuracy = 4;
          series.step = 15;
          series.rotationThreshold = 0.7;
          series.maxCount = 100;
          series.minWordLength = 2;
          series.randomness = 0;
          series.interpolationDuration = 400;
          series.labels.template.tooltipText = "{word}: {value}";
          series.fontFamily = themeStyles.containerStyle?.fontFamily || "Inter";
          series.maxFontSize = window.am4core.percent(30);
          series.minFontSize = window.am4core.percent(6);
          series.dataFields.word = "word";
          series.dataFields.value = "count";
          series.labels.template.adapter.add("fill", (fill, target) => {
            if (target.dataItem?.word) return window.am4core.color(getWordColor(target.dataItem.word));
            return fill;
          });
          series.data = wordsListRef.current.map((w) => ({ word: w.text, count: w.count }));
          chartInstance.current = chart;
        }
      } catch (err) {
        console.error("Failed to load amCharts wordCloud", err);
      }
    };

    initChart();

    return () => {
      disposed = true;
      if (chartInstance.current) {
        try {
          chartInstance.current.dispose();
        } catch (_) {}
        chartInstance.current = null;
      }
    };
  }, [currentQuestionIndex]);

  useEffect(() => {
    wordsListRef.current = wordsList;
    if (chartInstance.current) {
      try {
        const series = chartInstance.current.series.getIndex(0);
        if (series) {
          const newData = wordsList.map((w) => ({ word: w.text, count: w.count }));
          // Only update if data actually changed to avoid double-animation jitter
          if (JSON.stringify(series.data) !== JSON.stringify(newData)) {
            series.data = newData;
          }
        }
      } catch (_) {}
    }
  }, [wordsList]);

  return (
    <div className="w-full flex-1 flex flex-col justify-center items-center mx-auto my-auto mb-2 pt-2 relative">
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "360px",
          minHeight: "300px",
          display: wordsList.length > 0 ? "block" : "none"
        }}
        className="overflow-visible"
      />
      {wordsList.length === 0 && (
        <div className="flex items-center justify-center w-full h-[360px] min-h-[300px]">
          <svg viewBox="0 0 24 24" className="w-20 h-20" style={{ color: themeStyles.secondaryTextColor }}>
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
  );
}

// ── Inject global styles once into <head> ──────────────────────────────────────
const GLOBAL_STYLE_ID = "standard-present-styles";
function injectGlobalStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(GLOBAL_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = GLOBAL_STYLE_ID;
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@300;400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
    .font-baskerville { font-family: 'Libre Baskerville', serif; }
    .font-epilogue    { font-family: 'Epilogue', sans-serif; }

    @keyframes sineRibbon {
      0% { transform: translateX(0px); }
      100% { transform: translateX(-36px); }
    }
    .animate-sine-wave {
      animation: sineRibbon 1.6s linear infinite;
    }

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
  if (!text) return "text-2xl md:text-3xl 2xl:text-5xl";
  const len = text.length;
  if (len <= 40) return "text-2xl md:text-3xl 2xl:text-5xl";
  if (len <= 80) return "text-xl md:text-2xl 2xl:text-4xl";
  if (len <= 140) return "text-lg md:text-xl 2xl:text-3xl";
  return "text-sm md:text-base 2xl:text-xl";
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function StandardPresent({
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
  deleteResponse,
  theme = "standard"
}) {
  const themeStyles = getThemeStyles(poll?.theme);
  const isIU = theme === "iu";
  const [confettiActive, setConfettiActive] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef(null);

  const hasAudio = Boolean(
    poll?.enableAudio ||
      poll?.questions?.some((q) => q?.enableAudio)
  );
  // Resolve global audio track for the entire poll session
  const audioTrackUrl = useMemo(() => {
    return (
      poll?.audioUrl ||
      poll?.questions?.find((q) => q?.audioUrl)?.audioUrl ||
      (hasAudio
        ? "https://res.cloudinary.com/dkhxnyat4/video/upload/v1786698983/polls/audio/fpkrhs5gx4tnbpoimwnf.mp3"
        : null)
    );
  }, [poll?.audioUrl, poll?.questions, hasAudio]);

  // Initial autoplay when poll loads if audio is enabled (does NOT re-trigger on question changes)
  const hasAttemptedAutoPlay = useRef(false);
  useEffect(() => {
    if (hasAudio && audioTrackUrl && audioRef.current && !hasAttemptedAutoPlay.current) {
      hasAttemptedAutoPlay.current = true;
      audioRef.current.loop = true;
      audioRef.current.volume = 0.6;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlayingAudio(true))
          .catch(() => {
            setIsPlayingAudio(false);
          });
      }
    }
  }, [hasAudio, audioTrackUrl]);

  // Pause audio automatically when poll ends
  useEffect(() => {
    if (currentQuestionIndex === totalQuestions && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    }
  }, [currentQuestionIndex, totalQuestions]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlayingAudio(true))
        .catch(console.error);
    }
  };

  useEffect(() => { injectGlobalStyles(); }, []);

  const qTypeStr = String(currentQuestion?.type || "").toLowerCase();
  const isRanking = qTypeStr === "ranking" || currentQuestion?.type === 3;
  const isOpenEnded = qTypeStr === "openended" || currentQuestion?.type === 2;
  const isWordCloud =
    !isRanking &&
    !isOpenEnded &&
    (currentQuestion?.type === "WordCloud" ||
      currentQuestion?.type === 1 ||
      qTypeStr === "wordcloud" ||
      (!currentQuestion?.options ||
        currentQuestion.options.length === 0 ||
        currentQuestion.options.every((opt) => {
          const txt = typeof opt === "string" ? opt : opt.text || "";
          return !txt.trim();
        })));

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



  useEffect(() => {
    const onKey = (e) => {
      if (isTransitioning) return;
      if (e.key === "ArrowLeft" && currentQuestionIndex > 0) handlePrevQuestion();
      else if (e.key === "ArrowRight" && currentQuestionIndex < totalQuestions) handleNextQuestion();
      else if (e.key.toLowerCase() === "k") isVotingActive ? handleStopVoting() : handleStartVoting();
      else if (e.key.toLowerCase() === "c") setConfettiActive(true);
      else if (e.key.toLowerCase() === "q") setShowQR(!showQR);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentQuestionIndex, totalQuestions, isVotingActive, handlePrevQuestion, handleNextQuestion, handleStartVoting, handleStopVoting, showQR, setShowQR, isTransitioning]);

  return (
    <div
      className="h-screen max-h-screen w-full flex flex-col justify-between overflow-hidden relative select-none"
      style={{
        ...themeStyles.backgroundStyle,
        ...themeStyles.containerStyle,
      }}
    >
      {/* 10vh Top Header / Navbar */}
      <header className="h-[10vh] w-full flex items-center justify-between z-20 shrink-0 pointer-events-none px-6 md:px-12">
        <img
          src="/RapidPolls.png"
          alt="RapidPolls"
          className="h-6 md:h-8 w-auto object-contain opacity-90 filter drop-shadow-sm select-none"
        />

        {themeStyles.logoUrl ? (
          <img
            src={themeStyles.logoUrl}
            alt="Theme Logo"
            className="h-8 md:h-11 max-w-[160px] md:max-w-[200px] w-auto object-contain filter drop-shadow-md"
          />
        ) : (
          <div className="w-8" />
        )}
      </header>

      {/* 80vh Center Main Content Frame */}
      <main className="h-[80vh] max-h-[80vh] flex flex-col justify-between max-w-6xl 2xl:max-w-7xl mx-auto w-full p-6 md:p-8 z-10 relative bg-transparent overflow-hidden">
        {poll.activeQuestionIndex === -1 || poll.activeQuestionIndex === undefined ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center my-auto">
            <h1
              className="text-5xl md:text-7xl 2xl:text-8xl font-light leading-tight drop-shadow-2xl tracking-wide animate-fade-in"
              style={{ color: themeStyles.primaryTextColor }}
            >
              Welcome to Live Poll
            </h1>
            <p
              className="text-lg md:text-xl 2xl:text-3xl mt-4 opacity-85 tracking-widest uppercase"
              style={{ color: themeStyles.secondaryTextColor }}
            >
              Interactive Presentation
            </p>
          </div>
        ) : currentQuestionIndex === totalQuestions ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center my-auto">
            <h1
              className="text-5xl md:text-7xl 2xl:text-8xl font-light leading-tight drop-shadow-2xl tracking-wide animate-fade-in"
              style={{ color: themeStyles.primaryTextColor }}
            >
              Thank You for Your Participation
            </h1>
            <p
              className="text-lg md:text-xl 2xl:text-3xl mt-4 opacity-85 tracking-widest uppercase"
              style={{ color: themeStyles.secondaryTextColor }}
            >
              The Live Poll has Ended
            </p>
          </div>
        ) : (
          <>
            <div className={`w-full max-w-6xl mx-auto mb-4 mt-1 ${
              currentQuestion?.alignment === "left"
                ? "text-left"
                : currentQuestion?.alignment === "right"
                ? "text-right"
                : "text-center"
            }`}>
              <h2
                className={`${getQuestionFontSize(currentQuestion?.text)} font-light leading-tight drop-shadow-lg tracking-wide`}
                style={{ color: themeStyles.primaryTextColor }}
              >
                {currentQuestion?.text || "No question"}
              </h2>
            </div>

            {isRanking ? (
              <div className="w-full flex-1 flex flex-col justify-center max-w-3xl mx-auto mb-4 px-4 space-y-4">
                {(() => {
                  const rankingsData = poll?.rankingCounts?.[currentQuestionIndex.toString()] || {};
                  const options = currentQuestion?.options || [];
                  const sorted = options
                    .map((opt, idx) => {
                      const text = typeof opt === "string" ? opt : opt.text || "";
                      const points = rankingsData[idx.toString()] || 0;
                      return { idx, text, points };
                    })
                    .sort((a, b) => b.points - a.points);
                  const maxPoints = Math.max(...sorted.map((s) => s.points), 1);
                  const totalPoints = sorted.reduce((acc, curr) => acc + curr.points, 0);

                  return sorted.map((item, rankIdx) => {
                    const hasVotes = item.points > 0;
                    const pct = totalPoints > 0 ? Math.round((item.points / maxPoints) * 100) : 0;
                    const itemColor = themeStyles.paletteColors[rankIdx % themeStyles.paletteColors.length];
                    return (
                      <div key={item.idx} className="flex flex-col gap-1.5 w-full">
                        {/* Rank Badge + Item Text */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="px-2 py-0.5 rounded-md text-xs font-bold border shadow-2xs"
                              style={{
                                backgroundColor: themeStyles.isDarkText ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.12)",
                                borderColor: themeStyles.isDarkText ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.2)",
                                color: themeStyles.primaryTextColor,
                              }}
                            >
                              {rankIdx + 1}
                            </span>
                            <span className="font-semibold text-sm md:text-base" style={{ color: themeStyles.primaryTextColor }}>
                              {item.text}
                            </span>
                          </div>

                          {currentQuestion?.showPercentage ? (
                            <span className="text-xs md:text-sm font-bold" style={{ color: themeStyles.primaryTextColor }}>
                              {pct}%
                            </span>
                          ) : null}
                        </div>

                        {/* Progress Bar Track (Full width with colored fill going forward based on votes) */}
                        <div
                          className="w-full h-3 rounded-full overflow-hidden p-0.5 border"
                          style={{
                            backgroundColor: themeStyles.isDarkText ? "#E2E8F0" : "rgba(255, 255, 255, 0.15)",
                            borderColor: themeStyles.isDarkText ? "#CBD5E1" : "rgba(255, 255, 255, 0.1)",
                          }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: hasVotes ? `${Math.max(pct, 2)}%` : "0%",
                              backgroundColor: itemColor,
                            }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : isOpenEnded ? (
              <div className="w-full flex-1 overflow-y-auto max-h-[58vh] max-w-5xl mx-auto pt-2 pb-4 px-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 items-start">
                {(() => {
                  const responses = poll?.openEndedResponses?.[currentQuestionIndex.toString()] || [];
                  if (responses.length === 0) {
                    return (
                      <div className="col-span-full flex flex-col items-center justify-center py-12">
                        <div className="flex items-center justify-center w-full h-[240px]">
                          <svg viewBox="0 0 24 24" className="w-18 h-18" style={{ color: themeStyles.secondaryTextColor }}>
                            <path
                              d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                              fill="none"
                              stroke="rgba(255, 255, 255, 0.08)"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="animate-cloud-dash"
                            />
                          </svg>
                        </div>
                        <p className="text-sm md:text-base font-medium mt-2" style={{ color: themeStyles.secondaryTextColor }}>
                          Waiting for audience responses...
                        </p>
                      </div>
                    );
                  }

                  // 3-Column Masonry distribution (left-to-right round-robin, shifting upwards into empty vertical space)
                  const cols = [[], [], []];
                  responses.forEach((resp, idx) => {
                    cols[idx % 3].push({ resp, idx });
                  });

                  return cols.map((colItems, colIdx) => (
                    <div key={colIdx} className="flex flex-col gap-3.5 w-full">
                      {colItems.map(({ resp, idx }) => {
                        const respId = resp.responseId || resp.id || resp._id;
                        return (
                          <div
                            key={respId || idx}
                            className="relative group border rounded-xl p-3.5 sm:p-4 shadow-md flex flex-col justify-between transition-all hover:scale-[1.02] w-full"
                            style={{
                              backgroundColor: themeStyles.cardBackgroundColor || (themeStyles.isDarkText ? "#FFFFFF" : "#1E293B"),
                              borderColor: themeStyles.cardBorderColor || (themeStyles.isDarkText ? "#E2E8F0" : "rgba(255,255,255,0.15)"),
                              color: themeStyles.primaryTextColor,
                            }}
                          >
                            <p className="text-sm md:text-[15px] font-semibold leading-snug break-words pr-2">
                              "{resp.text}"
                            </p>
                            <div
                              className="flex justify-between items-center mt-2.5 text-[11px] border-t pt-1.5 opacity-80"
                              style={{
                                borderColor: themeStyles.isDarkText ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.1)",
                                color: themeStyles.secondaryTextColor,
                              }}
                            >
                              <span>{new Date(resp.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <button
                                onClick={async () => {
                                  if (deleteResponse && respId) {
                                    try {
                                      await deleteResponse(pollId, currentQuestionIndex, respId);
                                    } catch (err) {
                                      console.error("Error deleting response:", err);
                                    }
                                  }
                                }}
                                className="p-1 rounded-md text-red-400 bg-red-500/10 hover:bg-red-500/20 cursor-pointer transition-colors"
                                title="Delete response"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            ) : isWordCloud ? (
              <WordCloudView
                wordsList={wordsList}
                themeStyles={themeStyles}
                currentQuestionIndex={currentQuestionIndex}
              />
            ) : (currentQuestion?.visualization === "Pie" || currentQuestion?.visualization === "Donut") ? (
              /* Pie / Donut Visualization */
              <div className="flex flex-col md:flex-row items-center justify-center gap-10 my-auto p-4 w-full max-w-5xl mx-auto">
                <div
                  className="relative w-64 h-64 md:w-80 md:h-80 rounded-full shadow-2xl flex items-center justify-center transition-transform duration-700 hover:scale-105 shrink-0"
                  style={{
                    background: totalVotes > 0
                      ? `conic-gradient(${currentQuestion.options.map((_, idx) => {
                        const v = getVoteCount(idx);
                        const color = themeStyles.paletteColors[idx % themeStyles.paletteColors.length];
                        return { v, color };
                      }).reduce((acc, item, idx, arr) => {
                        const prevPct = idx === 0 ? 0 : arr.slice(0, idx).reduce((sum, curr) => sum + (curr.v / totalVotes) * 100, 0);
                        const currPct = prevPct + (item.v / totalVotes) * 100;
                        acc.push(`${item.color} ${prevPct}% ${currPct}%`);
                        return acc;
                      }, []).join(", ")})`
                      : `conic-gradient(${themeStyles.paletteColors[0]} 0% 100%)`
                  }}
                >
                  {currentQuestion?.visualization === "Donut" && (
                    <div
                      className="w-36 h-36 md:w-44 md:h-44 rounded-full shadow-inner flex flex-col items-center justify-center"
                      style={{
                        backgroundColor: themeStyles.cardBackgroundColor,
                        color: themeStyles.primaryTextColor,
                      }}
                    >
                      <span className="text-3xl font-extrabold">{totalVotes}</span>
                      <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: themeStyles.secondaryTextColor }}>Total Votes</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 max-w-md w-full">
                  {currentQuestion?.options?.map((option, idx) => {
                    const votes = getVoteCount(idx);
                    const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                    const color = themeStyles.paletteColors[idx % themeStyles.paletteColors.length];
                    const text = typeof option === "string" ? option : option?.text || `Option ${idx + 1}`;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3.5 rounded-xl border"
                        style={{
                          backgroundColor: themeStyles.isDarkText ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.06)",
                          borderColor: themeStyles.cardBorderColor,
                          color: themeStyles.primaryTextColor,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          <span className="font-semibold text-sm md:text-base">{text}</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-sm">
                          {currentQuestion?.showPercentage ? (
                            <span className="font-bold">{percentage}%</span>
                          ) : (
                            <>
                              <span className="font-bold">{votes} votes</span>
                              <span style={{ color: themeStyles.secondaryTextColor }}>({percentage}%)</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Vertical Bars Visualization (Default) */
              <div className="w-full flex-1 flex flex-col justify-end mb-6">
                <div
                  className="flex items-end justify-center gap-6 md:gap-12 w-full mx-auto pb-0"
                  style={{
                    borderBottom: themeStyles.isDarkText
                      ? "1.5px solid rgba(0, 0, 0, 0.2)"
                      : "1.5px solid rgba(255, 255, 255, 0.35)",
                  }}
                >
                  {currentQuestion?.options?.map((option, idx) => {
                    const votes = getVoteCount(idx);
                    const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                    const height = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
                    const barBg = themeStyles.paletteColors[idx % themeStyles.paletteColors.length];
                    const displayLabel = currentQuestion?.showPercentage ? `${percentage}%` : votes;
                    return (
                      <div key={idx} className="flex flex-col items-center flex-1 max-w-[140px] 2xl:max-w-[180px] h-[35vh] justify-end">
                        <div className="w-full flex flex-col items-center justify-end" style={votes > 0 ? { height: `${Math.max(height, 16)}%` } : {}}>
                          <div className="font-black text-xl 2xl:text-3xl mb-2 drop-shadow-md" style={{ color: themeStyles.primaryTextColor }}>{displayLabel}</div>
                          {votes > 0 && (
                            <div className="w-full rounded-t border-t-2 border-x-2 border-white flex-1 transition-all duration-700 ease-out"
                              style={{ background: barBg, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-6 md:gap-12 w-full mx-auto mt-4">
                  {currentQuestion?.options?.map((option, idx) => (
                    <div key={idx} className="flex-1 max-w-[140px] 2xl:max-w-[180px] text-center">
                      <div className="font-bold text-xs md:text-sm lg:text-base xl:text-lg 2xl:text-xl whitespace-normal break-words w-full leading-snug drop-shadow-sm px-1" style={{ color: themeStyles.primaryTextColor }} title={option.text}>
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
            <div className="mt-4 flex items-center justify-center gap-2 max-w-full px-2 flex-wrap">
              <a href={pollUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 hover:underline text-sm font-semibold break-all text-center">{pollUrl}</a>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    navigator.clipboard.writeText(pollUrl);
                    toast.success("Link copied to clipboard!");
                  }
                }}
                className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all shrink-0 flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
                title="Copy Link"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10vh Bottom Controls Bar */}
      <footer className="h-[10vh] w-full px-6 md:px-12 z-20 pointer-events-none flex justify-between items-center shrink-0">
        {/* Left: Poll controls */}
        <div className="bg-black/60 border border-white/10 rounded-xl p-2 flex items-center gap-3 shadow-2xl pointer-events-auto">
          {/* Smooth Sine Wave Audio Toggle */}
          {hasAudio && audioTrackUrl && (
            <>
              <button
                type="button"
                onClick={toggleAudio}
                className={`px-3 py-1.5 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                  isPlayingAudio
                    ? "bg-white/15 hover:bg-white/25 text-white border-white/30 shadow-xs"
                    : "bg-white/5 hover:bg-white/10 text-white/40 border-white/10"
                }`}
                title={isPlayingAudio ? "Pause Background Music" : "Play Background Music"}
              >
                {/* Continuous Closed-Loop Sine Wave Canvas */}
                <div className="w-8 h-4 overflow-hidden relative flex items-center justify-center pointer-events-none">
                  <CanvasSineWave isPlaying={isPlayingAudio} />
                </div>
              </button>
              <div className="w-px h-4 bg-white/20" />
            </>
          )}

          {isVotingActive ? (
            <button onClick={handleStopVoting} disabled={isTransitioning} className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">Stop</button>
          ) : (
            <button onClick={handleStartVoting} disabled={isTransitioning} className="px-3 py-1.5 rounded-lg text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" style={{ backgroundColor: themeStyles.accentColor }}>Start</button>
          )}
          <button onClick={handlePrevQuestion} disabled={isTransitioning || currentQuestionIndex <= 0} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer" title="Previous Question">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="bg-white/10 border border-white/10 text-white px-3 py-0.5 rounded font-mono text-sm font-bold min-w-[2rem] text-center">{currentQuestionIndex + 1}</div>
          <button onClick={handleNextQuestion} disabled={isTransitioning || currentQuestionIndex >= totalQuestions} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer" title="Next Question">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={handleEndPoll} className="px-3 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-900/30 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer">End</button>
        </div>

        {/* Right: Stats + QR + fullscreen */}
        <div className="bg-black/60 border border-white/10 rounded-xl p-2 flex items-center gap-2 shadow-2xl pointer-events-auto relative">
          {currentQuestion?.showResponseCount !== false && (
            <>
              <div className="flex items-center gap-1.5 text-slate-300 text-xs font-bold bg-white/5 px-2 py-1.5 rounded-lg border border-white/5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>{totalVotes}</span>
              </div>

              <div className="w-px h-4 bg-white/20" />
            </>
          )}

          <button onClick={() => setShowQR(!showQR)} className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${showQR ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500/20" : "bg-white/5 hover:bg-white/15 text-slate-300 border-white/5"}`} title="Toggle QR Code">QR</button>
          <button onClick={toggleFullscreen} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all border border-white/5 cursor-pointer" title="Toggle Fullscreen">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </footer>

      {hasAudio && audioTrackUrl && (
        <audio ref={audioRef} src={audioTrackUrl} loop preload="auto" />
      )}

      <ConfettiBurst active={confettiActive} onComplete={() => setConfettiActive(false)} />
    </div>
  );
}

