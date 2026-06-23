"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, X, Copy, Check, ChevronLeft, ChevronRight, Play, Square } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const GLOBAL_STYLE_ID = "bidding-present-styles";

const SPRITE_SEQUENCE = [
  "/character/CharacterSprite.png",
  "/character/CharacterSprite2.png",
  "/character/CharacterSprite3.png",
  "/character/CharacterSprite2.png",
  "/character/CharacterSprite.png",
  "/character/CharacterSprite4.png"
];

export default function BiddingPresent({
  poll,
  bubbleCounts,
  committedCount,
  theme,
  cleanTitle,
  pollId,
  stopBidding,
  subscribeToPresenter,
  startQuestion,
}) {
  const router = useRouter();
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const [d3Loaded, setD3Loaded] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [loadingD3, setLoadingD3] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [spriteIndex, setSpriteIndex] = useState(0);
  const [shootImageOverride, setShootImageOverride] = useState(null);
  const activeShotsRef = useRef(0);
  const [reactions, setReactions] = useState([]);
  
  // Cohort state: "HR" vs "ACADEMIA"
  const [activeCohort, setActiveCohort] = useState("HR");

  // Retrieve active question index and active skills
  const activeQuestionIndex = poll?.activeQuestionIndex ?? -1;
  const activeQuestion = poll?.questions?.[activeQuestionIndex];
  const activeSkills = activeQuestion?.skills || [];

  // Preload sprites
  useEffect(() => {
    [...SPRITE_SEQUENCE, "/character/CharacterSpriteShoot.png"].forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    const interval = setInterval(() => {
      setSpriteIndex((prev) => (prev + 1) % SPRITE_SEQUENCE.length);
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const getBarrelCoords = () => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = rect.width - 240; 
    const y = rect.height - 260; 
    return { x, y };
  };

  const renderedCountsRef = useRef({});
  const hasInitializedCounts = useRef(false);

  // Initialize and sync counts
  useEffect(() => {
    if (bubbleCounts) {
      renderedCountsRef.current = { ...bubbleCounts };
      hasInitializedCounts.current = true;
    }
  }, [bubbleCounts]);

  const applyCountUpdate = useCallback((targetSkillId) => {
    if (!window.d3 || !simulationRef.current || !activeSkills?.length) return;
    const d3 = window.d3;
    
    const currentCounts = renderedCountsRef.current;
    currentCounts[targetSkillId] = (currentCounts[targetSkillId] || 0) + 1;

    const maxCount = Math.max(1, ...activeSkills.map((s) => currentCounts[s.id] || 0));

    const nodes = simulationRef.current.nodes();
    nodes.forEach((node) => {
      const newCount = currentCounts[node.id] || 0;
      node.count = newCount;
      // Make bubbles expand as coins are added
      node.radius = Math.max(50, 45 + (newCount / maxCount) * 75);
    });

    simulationRef.current.force(
      "collide",
      d3.forceCollide().radius((d) => d.radius + 6)
    );
    simulationRef.current.alpha(0.3).restart();

    // Update SVG
    const svg = d3.select(svgRef.current);
    
    svg
      .selectAll(".bp-node circle")
      .data(nodes)
      .transition()
      .duration(300)
      .attr("r", (d) => d.radius);

    svg
      .selectAll(".bp-node text:first-of-type")
      .data(nodes)
      .text((d) => d.name)
      .attr("font-size", (d) => `${Math.min(d.radius * 0.22, 12)}px`);

    svg
      .selectAll(".bp-node text:last-of-type")
      .data(nodes)
      .text((d) => `${d.count} Coins`)
      .attr("dy", (d) => `${d.radius * 0.25}px`);

    // Pulse bubble on impact
    const targetGroup = svg.selectAll(".bp-node").filter((d) => d.id === targetSkillId);
    const targetNode = nodes.find((n) => n.id === targetSkillId);
    if (targetNode && targetGroup.size() > 0) {
      targetGroup.select("circle")
        .transition()
        .duration(150)
        .attr("r", targetNode.radius * 1.25)
        .transition()
        .duration(250)
        .attr("r", targetNode.radius);
    }
  }, [activeSkills]);

  const shootCoin = useCallback((targetSkillId, shouldApplyUpdate = true) => {
    if (!d3Loaded || !svgRef.current || !simulationRef.current) return;
    const d3 = window.d3;
    const svg = d3.select(svgRef.current);
    
    const nodes = simulationRef.current.nodes();
    const targetNode = nodes.find((n) => n.id === targetSkillId);
    if (!targetNode) return;

    const start = getBarrelCoords();
    
    activeShotsRef.current += 1;
    setShootImageOverride("/character/CharacterSpriteShoot.png");
    setTimeout(() => {
      activeShotsRef.current -= 1;
      if (activeShotsRef.current <= 0) {
        setShootImageOverride(null);
      }
    }, 50);

    const coin = svg
      .append("image")
      .attr("href", "/coin2.png")
      .attr("x", start.x - 16)
      .attr("y", start.y - 16)
      .attr("width", 32)
      .attr("height", 32)
      .style("pointer-events", "none")
      .style("z-index", 100);

    const duration = 350;

    const timer = d3.timer((elapsed) => {
      const t = Math.min(1, elapsed / duration);
      
      const transform = d3.zoomTransform(svgRef.current);
      const currentTargetX = transform.applyX(targetNode.x);
      const currentTargetY = transform.applyY(targetNode.y);

      const easeT = d3.easeQuadOut(t);
      const curX = start.x + (currentTargetX - start.x) * easeT;
      const curY = start.y + (currentTargetY - start.y) * easeT;

      coin.attr("x", curX - 16).attr("y", curY - 16);

      if (t >= 1) {
        timer.stop();
        coin.remove();
        if (shouldApplyUpdate) {
          applyCountUpdate(targetSkillId);
        }
      }
    });
  }, [d3Loaded, applyCountUpdate]);

  const prevBubbleCountsRef = useRef({});

  // Sync bubble count updates to trigger coin shooting
  useEffect(() => {
    if (!bubbleCounts || !activeSkills?.length) return;
    
    const prevCounts = prevBubbleCountsRef.current;
    
    activeSkills.forEach((skill) => {
      const prevVal = prevCounts[skill.id] || 0;
      const newVal = bubbleCounts[skill.id] || 0;
      if (newVal > prevVal) {
        const diff = newVal - prevVal;
        for (let i = 0; i < diff; i++) {
          setTimeout(() => {
            shootCoin(skill.id);
          }, i * 150);
        }
      }
    });

    prevBubbleCountsRef.current = { ...bubbleCounts };
  }, [bubbleCounts, activeSkills, shootCoin]);

  // Subscribe to floating presenter reaction emojis
  useEffect(() => {
    if (!pollId || !subscribeToPresenter) return;
    const unsubscribe = subscribeToPresenter(pollId, (emoji) => {
      const id = Date.now() + Math.random();
      setReactions((prev) => [
        ...prev,
        {
          id,
          emoji,
          left: Math.random() * 80 - 40,
          rotate: Math.random() * 40 - 20,
          scale: 0.7 + Math.random() * 0.6,
        },
      ]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id));
      }, 2000);
    });
    return () => unsubscribe();
  }, [pollId, subscribeToPresenter]);

  const isSynergy = activeCohort === "HR" || theme === "synergy_sphere";
  const isMasterclass = activeCohort === "ACADEMIA" || theme === "masterclass";

  // Dynamic D3 injection
  useEffect(() => {
    let cancelled = false;
    const script = document.createElement("script");
    script.src = "https://d3js.org/d3.v7.min.js";
    script.async = true;
    script.onload = () => {
      if (!cancelled) {
        setD3Loaded(true);
        setLoadingD3(false);
      }
    };
    script.onerror = () => {
      if (!cancelled) {
        console.error("Failed to load D3.js");
        setLoadingD3(false);
      }
    };
    document.head.appendChild(script);
    return () => {
      cancelled = true;
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  // Global Styles
  useEffect(() => {
    if (document.getElementById(GLOBAL_STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = GLOBAL_STYLE_ID;
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@300;400;600;700;800&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');

      @keyframes bp-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      @keyframes bp-fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes bp-glow {
        0%, 100% { box-shadow: 0 0 5px rgba(255,255,255,0.2); }
        50% { box-shadow: 0 0 20px rgba(255,255,255,0.5); }
      }
      @keyframes float-coin-up {
        0% {
          transform: translateY(0) scale(0.5);
          opacity: 0;
        }
        15% {
          opacity: 1;
        }
        85% {
          opacity: 1;
        }
        100% {
          transform: translateY(-300px) scale(1.3);
          opacity: 0;
        }
      }
      .animate-float-coin-up {
        animation: float-coin-up 2s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
      }
      .bp-pulse { animation: bp-pulse 0.4s ease-out; }
      .bp-fadeIn { animation: bp-fadeIn 0.3s ease-out; }
      .bp-glow { animation: bp-glow 2s ease-in-out infinite; }
      .bp-tooltip {
        position: absolute;
        padding: 6px 12px;
        background: rgba(0,0,0,0.85);
        color: #fff;
        border-radius: 8px;
        font-size: 13px;
        font-family: 'Epilogue', sans-serif;
        pointer-events: none;
        white-space: nowrap;
        z-index: 100;
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255,255,255,0.1);
      }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById(GLOBAL_STYLE_ID);
      if (el) el.remove();
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else if (document.exitFullscreen) {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const handleExitPoll = () => {
    router.push("/dashboard/bidding");
  };

  const handleEndPoll = async () => {
    if (confirm("Conclude cohort bidding run? This concludes the session.")) {
      if (stopBidding) {
        await stopBidding(pollId);
      }
      router.push("/dashboard/bidding");
    }
  };

  // Cohort question paging navigation
  const handlePageQuestion = async (direction) => {
    if (!startQuestion || !poll?.questions) return;
    const nextIdx = activeQuestionIndex + direction;
    if (nextIdx >= 0 && nextIdx < poll.questions.length) {
      await startQuestion(pollId, nextIdx, activeCohort);
    }
  };

  // Cohort Toggle handler
  const handleCohortToggle = async (cohortVal) => {
    setActiveCohort(cohortVal);
    if (startQuestion && activeQuestionIndex >= 0) {
      await startQuestion(pollId, activeQuestionIndex, cohortVal);
    }
  };

  // D3 Force Simulation Setup
  useEffect(() => {
    if (!d3Loaded || !svgRef.current || !containerRef.current || !activeSkills?.length) return;

    const d3 = window.d3;
    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const counts = renderedCountsRef.current || {};
    const maxCount = Math.max(1, ...activeSkills.map((s) => counts[s.id] || 0));

    // Initialize bubble sizes and layout positions
    const nodes = activeSkills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      count: counts[skill.id] || 0,
      radius: Math.max(50, 45 + (counts[skill.id] || 0) / maxCount * 75),
    }));

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "collide",
        d3.forceCollide().radius((d) => d.radius + 6)
      )
      .force("manyBody", d3.forceManyBody().strength(-40))
      .force("center", d3.forceCenter(width / 2, height / 2 + 30))
      .force("x", d3.forceX(width / 2).strength(0.08))
      .force("y", d3.forceY(height / 2 + 30).strength(0.08));

    const g = svg.append("g");

    const zoom = d3.zoom().scaleExtent([0.5, 2.5]).on("zoom", (event) => {
      g.attr("transform", event.transform);
    });
    svg.call(zoom);

    // Gradient definitions for bubbles
    const defs = svg.append("defs");
    
    // Add distinct gradients
    const gradients = [
      { id: "grad-emerald", start: "#10b981", end: "#047857" },
      { id: "grad-indigo", start: "#6366f1", end: "#4338ca" },
      { id: "grad-amber", start: "#f59e0b", end: "#b45309" },
      { id: "grad-rose", start: "#f43f5e", end: "#be123c" }
    ];

    gradients.forEach((gData) => {
      const grad = defs.append("radialGradient")
        .attr("id", gData.id)
        .attr("cx", "30%")
        .attr("cy", "30%")
        .attr("r", "70%");
      grad.append("stop").attr("offset", "0%").attr("stop-color", gData.start);
      grad.append("stop").attr("offset", "100%").attr("stop-color", gData.end);
    });

    const nodeGroup = g
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "bp-node")
      .call(
        d3
          .drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Render Options Bubbles
    nodeGroup
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d, i) => `url(#${gradients[i % gradients.length].id})`)
      .attr("opacity", 0.95)
      .attr("stroke", "rgba(255,255,255,0.25)")
      .attr("stroke-width", 2)
      .style("cursor", "grab")
      .style("transition", "r 0.3s ease-out")
      .attr("filter", "url(#bp-glow)");

    // Option Skill Names (rendered from the beginning)
    nodeGroup
      .append("text")
      .text((d) => d.name)
      .attr("text-anchor", "middle")
      .attr("dy", "-0.15em")
      .attr("fill", "#fff")
      .attr("font-size", (d) => `${Math.min(d.radius * 0.22, 12)}px`)
      .attr("font-family", "Epilogue, sans-serif")
      .attr("font-weight", "800")
      .attr("pointer-events", "none")
      .style("text-shadow", "0 2px 4px rgba(0,0,0,0.6)");

    // Bidding coins counter
    nodeGroup
      .append("text")
      .text((d) => `${d.count} Coins`)
      .attr("text-anchor", "middle")
      .attr("dy", (d) => `${d.radius * 0.25}px`)
      .attr("fill", "#fbbf24")
      .attr("font-size", "11px")
      .attr("font-family", "Epilogue, sans-serif")
      .attr("font-weight", "700")
      .attr("pointer-events", "none")
      .style("text-shadow", "0 1px 3px rgba(0,0,0,0.8)");

    simulation.on("tick", () => {
      nodeGroup.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    simulationRef.current = simulation;

    const handleResize = () => {
      if (!containerRef.current) return;
      const { width: w, height: h } = containerRef.current.getBoundingClientRect();
      svg.attr("width", w).attr("height", h);
      simulation.force("center", d3.forceCenter(w / 2, h / 2 + 30));
      simulation.alpha(0.3).restart();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      simulation.stop();
    };
  }, [d3Loaded, activeSkills, isSynergy, isMasterclass]);

  const bgUrl = isSynergy
    ? "/SynegrysphereBG.png"
    : isMasterclass
    ? "/MasterClassNewBg.png"
    : null;

  const bgClass = bgUrl
    ? "bg-cover bg-center bg-no-repeat"
    : isSynergy
    ? "bg-gradient-to-br from-stone-950 via-stone-900 to-rose-950"
    : isMasterclass
    ? "bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950"
    : "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900";

  const accentColor = isSynergy ? "#f43f5e" : isMasterclass ? "#10b981" : "#6366f1";

  if (loadingD3) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`} style={bgUrl ? { backgroundImage: `url(${bgUrl})` } : {}}>
        {bgUrl && <div className="absolute inset-0 bg-black/40 z-0" />}
        <div className="text-center z-10">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: accentColor }} />
          <p className="text-white/60 font-[Epilogue]">Loading visualization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-screen w-full ${bgClass} overflow-hidden`} style={bgUrl ? { backgroundImage: `url(${bgUrl})` } : {}}>
      {bgUrl && <div className="absolute inset-0 bg-black/40 z-0" />}

      {/* Top Header info (cohort logos) */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex items-center justify-between bp-fadeIn">
        <div>
          <h1 className="text-white font-[Epilogue] text-xl font-bold tracking-tight">
            {cleanTitle || "Skill Bidding"}
          </h1>
          <p className="text-white/40 text-xs font-[Epilogue] mt-0.5">
            {isSynergy ? "SynergySphere" : isMasterclass ? "Masterclass" : "Live Bidding"} Arena
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Cohort Toggle Buttons */}
          <div className="bg-black/45 border border-white/10 rounded-xl p-1 flex items-center gap-1 shadow-inner">
            <button
              onClick={() => handleCohortToggle("HR")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all uppercase ${
                activeCohort === "HR" ? "bg-emerald-600 text-white shadow-md" : "text-white/50 hover:text-white"
              }`}
            >
              HR
            </button>
            <button
              onClick={() => handleCohortToggle("ACADEMIA")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all uppercase ${
                activeCohort === "ACADEMIA" ? "bg-indigo-600 text-white shadow-md" : "text-white/50 hover:text-white"
              }`}
            >
              Academia
            </button>
          </div>

          {isSynergy && <img src="/SNSlogo.png" alt="Synergy Sphere Logo" className="h-9 w-auto object-contain" />}
          {isMasterclass && <img src="/mc01.png" alt="Masterclass Logo" className="h-9 w-auto object-contain" />}
        </div>
      </div>

      {/* Active Question Display in the Center (Styled like standard presenter screen) */}
      {activeQuestionIndex !== -1 && activeQuestion ? (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 text-center max-w-2xl px-6 w-full select-none bp-fadeIn pointer-events-none">
          <div className="bg-black/50 backdrop-blur-md border border-white/15 px-6 py-4 rounded-3xl shadow-2xl">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
              Active Question
            </span>
            <h2 className="text-2xl font-black text-white mt-1 leading-snug">
              {activeQuestion.text || activeQuestion.title}
            </h2>
          </div>
        </div>
      ) : (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 text-center select-none bp-fadeIn pointer-events-none">
          <div className="bg-black/50 backdrop-blur-md border border-white/15 px-8 py-4 rounded-3xl shadow-2xl">
            <h2 className="text-xl font-bold text-white/55">
              Standby Mode: Waiting to Start Question
            </h2>
          </div>
        </div>
      )}

      {/* SVG Canvas for Bubbles */}
      <div ref={containerRef} className="absolute inset-0 z-10">
        <svg ref={svgRef} width="100%" height="100%" style={{ display: "block" }} />
      </div>

      {/* Bottom Controls Bar */}
      <div className="fixed bottom-6 left-0 right-0 w-full px-6 md:px-12 z-20 pointer-events-none flex justify-between items-center">
        {/* Left: Exit/End controls */}
        <div className="relative pointer-events-auto flex items-center gap-2">
          {/* Floating Coins Container */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 pointer-events-none w-48 h-72 overflow-visible flex justify-center items-end">
            {reactions.map((r) => (
              <div
                key={r.id}
                className="absolute animate-float-coin-up select-none pointer-events-none"
                style={{
                  left: `calc(50% + ${r.left}px)`,
                  transform: `rotate(${r.rotate}deg) scale(${r.scale})`,
                }}
              >
                <img
                  src="/coin2.png"
                  alt="coin"
                  className="w-12 h-12 object-contain drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]"
                />
              </div>
            ))}
          </div>

          <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-2 flex items-center gap-2 shadow-2xl">
            <button
              onClick={handleExitPoll}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all"
            >
              Exit
            </button>
            <button
              onClick={handleEndPoll}
              className="px-3 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-900/30 text-xs font-bold uppercase tracking-wider transition-all animate-pulse"
            >
              Conclude Run
            </button>
          </div>

          {/* Pager controls for startQuestion */}
          {poll?.questions && (
            <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-2 flex items-center gap-1 shadow-2xl">
              <button
                onClick={() => handlePageQuestion(-1)}
                disabled={activeQuestionIndex <= 0}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent text-white transition-all"
                title="Previous Question"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-white/60 text-xs font-bold px-2 select-none">
                {activeQuestionIndex + 1} / {poll.questions.length}
              </span>
              <button
                onClick={() => handlePageQuestion(1)}
                disabled={activeQuestionIndex >= poll.questions.length - 1}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent text-white transition-all"
                title="Next Question"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Stats, QR, Character and Fullscreen */}
        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-2 flex items-center gap-2 shadow-2xl pointer-events-auto relative">
          {/* Looping Character Sprite */}
          <div 
            className="absolute bottom-full right-4 mb-2 pointer-events-auto z-30 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
            onClick={() => {
              if (activeSkills?.length) {
                const randomSkill = activeSkills[Math.floor(Math.random() * activeSkills.length)];
                shootCoin(randomSkill.id, false);
              }
            }}
          >
            <img
              src={shootImageOverride || SPRITE_SEQUENCE[spriteIndex]}
              alt="Looping Character"
              className="w-64 h-64 object-contain select-none"
              style={{ transform: "scaleX(-1)" }}
            />
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 text-xs font-bold bg-white/5 px-2 py-1.5 rounded-lg border border-white/5">
            <Users className="w-3.5 h-3.5" style={{ color: accentColor }} />
            <span>{committedCount} submitted</span>
          </div>

          <div className="w-px h-4 bg-white/20" />

          <button
            onClick={() => setShowQrCode(!showQrCode)}
            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              showQrCode
                ? "text-white border-white/20"
                : "bg-white/5 hover:bg-white/15 text-slate-300 border-white/5"
            }`}
            style={showQrCode ? { background: accentColor, borderColor: `${accentColor}33` } : {}}
            title="Toggle QR Code"
          >
            QR
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all border border-white/5"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <span className="text-[10px] font-bold uppercase px-0.5">Min</span>
            ) : (
              <span className="text-[10px] font-bold uppercase px-0.5">Max</span>
            )}
          </button>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrCode && (
        <QrCodeModal
          theme={theme}
          pollId={pollId}
          onClose={() => setShowQrCode(false)}
          isSynergy={isSynergy}
          isMasterclass={isMasterclass}
        />
      )}
    </div>
  );
}

function QrCodeModal({ theme, pollId, onClose, isSynergy, isMasterclass }) {
  const [copied, setCopied] = useState(false);
  const accentColor = isSynergy ? "#f43f5e" : isMasterclass ? "#10b981" : "#6366f1";
  const participantUrl = typeof window !== "undefined"
    ? `${window.location.origin}/bidding-poll/${pollId}?theme=${theme}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(participantUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4" onClick={onClose}>
      <div 
        className="relative w-full max-w-sm rounded-3xl p-8 text-center border shadow-2xl transition-all"
        style={{ 
          background: isSynergy ? "#1c0a0a" : isMasterclass ? "#051a10" : "#1e293b", 
          borderColor: `${accentColor}33` 
        }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-white font-[Epilogue] text-2xl font-bold mb-2">Scan to Join</h3>
        <p className="text-white/40 font-[Epilogue] text-sm mb-6">
          Scan the QR code to enter the bidding wallet on your phone
        </p>

        <div className="bg-white p-6 rounded-2xl inline-block shadow-lg border border-white/10 mb-6 bp-glow">
          <QRCodeSVG value={participantUrl} size={220} />
        </div>

        <div className="flex gap-2 mb-6 px-1">
          <input
            type="text"
            value={participantUrl}
            readOnly
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/70 outline-none focus:ring-1 focus:ring-white/20 select-all"
          />
          <button
            onClick={copyLink}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1 active:scale-95 shrink-0"
            style={{ background: accentColor }}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <div className="text-center font-[Epilogue]">
          <p className="text-xs text-white/30 uppercase tracking-wider">Bidding Session Code</p>
          <p className="text-3xl font-bold font-mono mt-1 text-white tracking-widest">{pollId}</p>
        </div>
      </div>
    </div>
  );
}
