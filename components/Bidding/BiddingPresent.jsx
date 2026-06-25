"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, X, Copy, Check, ChevronLeft, ChevronRight, Play, Square, Trophy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";

const GLOBAL_STYLE_ID = "bidding-present-styles";

const SPRITE_SEQUENCE = [
  "/character/CharacterSpriteU.png",
  "/character/CharacterSprite2U.png",
  "/character/CharacterSprite3U.png",
  "/character/CharacterSprite2U.png",
  "/character/CharacterSpriteU.png",
  "/character/CharacterSprite4U.png"
];

export default function BiddingPresent({
  poll,
  bubbleCounts,
  committedCount,
  theme,
  cohortParam,
  cleanTitle,
  pollId,
  stopBidding,
  subscribeToPresenter,
  startQuestion,
  biddingClosed,
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
  const activeShotsRef = useRef(0);
  const [shootImageOverride, setShootImageOverride] = useState(null);
  const [floatingEmojis, setFloatingEmojis] = useState([]);

  useEffect(() => {
    if (!pollId || !subscribeToPresenter) return;
    const unsubscribe = subscribeToPresenter(pollId, (emoji) => {
      const id = Date.now() + Math.random();
      const flow = ["one", "two", "three"][Math.floor(Math.random() * 3)];
      const timing = (Math.random() * (1.3 - 1.0) + 1.0).toFixed(1);
      const size = Math.floor(Math.random() * (30 - 22) + 22);
      setFloatingEmojis((prev) => [...prev, { id, emoji, flow, timing, size }]);
      setTimeout(() => {
        setFloatingEmojis((prev) => prev.filter((r) => r.id !== id));
      }, timing * 1000 + 200);
    });
    return () => unsubscribe();
  }, [pollId, subscribeToPresenter]);


  // Cohort state: "HR" vs "ACADEMIA"
  // Initialize directly from the URL param (cohortParam) to avoid flashing the
  // wrong theme before the poll data loads. Falls back to poll.currentCohort
  // or "HR" if neither is available.
  const [activeCohort, setActiveCohort] = useState(
    cohortParam?.toUpperCase() || poll?.currentCohort || "HR"
  );

  useEffect(() => {
    if (poll?.currentCohort) {
      setActiveCohort(poll.currentCohort);
    }
  }, [poll?.currentCohort]);

  // Retrieve active question index and active skills
  const activeQuestionIndex = poll?.activeQuestionIndex ?? -1;
  const activeQuestion = poll?.questions?.[activeQuestionIndex];
  const activeSkills = activeQuestion?.skills || [];

  // Preload sprites
  useEffect(() => {
    [...SPRITE_SEQUENCE, "/character/CharacterSpriteShootU.png"].forEach((src) => {
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
    const vh = window.innerHeight / 100;
    // Character is at bottom-[22vh] right-[6vh] with size 25vh.
    // The gun muzzle is at the left-most edge of the sprite (right-[6vh + 25vh] = right-[31vh])
    // and about 66% up the sprite's height (bottom-[22vh + (25vh * 0.66)] = bottom-[38.5vh]).
    const x = rect.width - (31 * vh);
    const y = rect.height - (38.5 * vh);
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

  const syncBubbleCounts = useCallback(() => {
    if (!window.d3 || !simulationRef.current || !activeSkills?.length || !containerRef.current) return;
    const d3 = window.d3;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;

    let scale = 1.0;
    if (width > 2500) scale = 1.7;
    else if (width > 1850) scale = 1.45;
    else if (width > 1400) scale = 1.15;

    const currentCounts = renderedCountsRef.current;
    const maxCount = Math.max(1, ...activeSkills.map((s) => currentCounts[s.id] || 0));

    const nodes = simulationRef.current.nodes();
    nodes.forEach((node) => {
      const newCount = currentCounts[node.id] || 0;
      node.count = newCount;
      // Make bubbles expand as coins are added or shrink as they are removed
      node.radius = Math.max(50, 45 + (newCount / maxCount) * 75) * scale;
    });

    simulationRef.current.force(
      "collide",
      d3.forceCollide().radius((d) => d.radius + 6)
    );
    simulationRef.current.alpha(0.3).restart();

    // Update SVG
    const svg = d3.select(svgRef.current);

    svg
      .selectAll(".bp-node circle:first-child")
      .data(nodes)
      .transition()
      .duration(300)
      .attr("r", (d) => d.radius);

    svg
      .selectAll(".bp-node circle:nth-child(2)")
      .data(nodes)
      .transition()
      .duration(300)
      .attr("r", (d) => d.radius);

    svg
      .selectAll(".bp-node circle:nth-child(3)")
      .data(nodes)
      .transition()
      .duration(300)
      .attr("r", (d) => d.radius * 0.5);

    svg
      .selectAll(".bp-node foreignObject")
      .data(nodes)
      .transition()
      .duration(300)
      .attr("x", (d) => -d.radius * 0.95)
      .attr("y", (d) => -d.radius * 0.95)
      .attr("width", (d) => d.radius * 1.9)
      .attr("height", (d) => d.radius * 1.9);

    svg
      .selectAll(".bp-node foreignObject div")
      .data(nodes)
      .style("opacity", (d) => d.count > 0 ? 1 : 0);

    svg
      .selectAll(".bp-node .skill-name")
      .data(nodes)
      .text((d) => d.name)
      .style("font-size", (d) => `${Math.max(10, Math.min(d.radius * 0.22, 13 * scale))}px`);

    svg
      .selectAll(".bp-node .skill-coins")
      .data(nodes)
      .text((d) => `${d.count} Coins`)
      .style("font-size", (d) => `${Math.max(9, Math.min(d.radius * 0.18, 11 * scale))}px`);
  }, [activeSkills]);

  const applyCountUpdate = useCallback((targetSkillId) => {
    if (!window.d3 || !simulationRef.current || !activeSkills?.length) return;
    const d3 = window.d3;

    // ⚠️ DO NOT increment the count here! The server's 100ms debounce timer
    // broadcasts the correct aggregate count via ReceiveBubbleData BEFORE the
    // 350ms coin animation completes. By the time this runs, renderedCountsRef
    // already has the correct server value. Incrementing it would cause a
    // permanent double-count (e.g., server says 1, this makes it 2).
    // The coin animation is purely decorative — the data comes from the server.
    syncBubbleCounts();

    // Pulse bubble on impact — animate both the main circle and sheen
    const svg = d3.select(svgRef.current);
    const nodes = simulationRef.current.nodes();
    const targetGroup = svg.selectAll(".bp-node").filter((d) => d.id === targetSkillId);
    const targetNode = nodes.find((n) => n.id === targetSkillId);
    if (targetNode && targetGroup.size() > 0) {
      // Main circle pulse
      targetGroup.select("circle:first-child")
        .interrupt()
        .transition()
        .duration(120)
        .attr("r", targetNode.radius * 1.3)
        .attr("stroke-width", 6)
        .attr("stroke", "rgba(255,255,255,1)")
        .transition()
        .duration(280)
        .attr("r", targetNode.radius)
        .attr("stroke-width", 3)
        .attr("stroke", "rgba(255,255,255,0.85)");

      // Sheen circle follows
      targetGroup.select("circle:nth-child(2)")
        .interrupt()
        .transition()
        .duration(120)
        .attr("r", targetNode.radius * 1.3)
        .transition()
        .duration(280)
        .attr("r", targetNode.radius);

      // Ambient glow pulse
      targetGroup.select("circle:nth-child(3)")
        .interrupt()
        .transition()
        .duration(120)
        .attr("r", targetNode.radius * 0.7)
        .attr("opacity", 0.2)
        .transition()
        .duration(280)
        .attr("r", targetNode.radius * 0.5)
        .attr("opacity", 0.08);
    }
  }, [activeSkills, syncBubbleCounts]);

  const shootCoin = useCallback((targetSkillId, shouldApplyUpdate = true) => {
    if (!d3Loaded || !svgRef.current || !simulationRef.current) return;
    const d3 = window.d3;
    const svg = d3.select(svgRef.current);

    const nodes = simulationRef.current.nodes();
    const targetNode = nodes.find((n) => n.id === targetSkillId);
    if (!targetNode) return;

    const start = getBarrelCoords();

    activeShotsRef.current += 1;
    setShootImageOverride("/character/CharacterSpriteShootU.png");
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

    const duration = 150;

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
    let hasDecrements = false;

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
      } else if (newVal < prevVal) {
        renderedCountsRef.current[skill.id] = newVal;
        hasDecrements = true;
      }
    });

    if (hasDecrements) {
      syncBubbleCounts();
    }

    prevBubbleCountsRef.current = { ...bubbleCounts };
  }, [bubbleCounts, activeSkills, shootCoin, syncBubbleCounts]);



  const isSynergy = theme === "synergy_sphere";
  const isMasterclass = theme === "masterclass";

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

      @keyframes sn-flowOne {
        0%   { opacity: 0; bottom: 0;   left: 35%; }
        40%  { opacity: .8; }
        50%  { opacity: 1;  left: 45%; }
        60%  { opacity: .2; }
        80%  { bottom: 80%; }
        100% { opacity: 0;  bottom: 100%; left: 68%; }
      }
      @keyframes sn-flowTwo {
        0%   { opacity: 0; bottom: 0;  left: 45%; }
        40%  { opacity: .8; }
        50%  { opacity: 1;  left: 61%; }
        60%  { opacity: .2; }
        80%  { bottom: 60%; }
        100% { opacity: 0;  bottom: 80%; left: 45%; }
      }
      @keyframes sn-flowThree {
        0%   { opacity: 0; bottom: 0;  left: 45%; }
        40%  { opacity: .8; }
        50%  { opacity: 1;  left: 25%; }
        60%  { opacity: .2; }
        80%  { bottom: 70%; }
        100% { opacity: 0;  bottom: 90%; left: 45%; }
      }
      .sn-flow-one   { animation: sn-flowOne   linear forwards; }
      .sn-flow-two   { animation: sn-flowTwo   linear forwards; }
      .sn-flow-three { animation: sn-flowThree linear forwards; }

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
      @media (min-width: 2500px) {
        .wide-logo-gryphon {
          height: 7rem !important;
        }
        .wide-logo-event {
          height: 6rem !important;
        }
        .wide-qr-modal {
          max-width: 48rem !important;
          padding: 3rem !important;
        }
        .wide-qr-modal h3 {
          font-size: 3rem !important;
          margin-bottom: 1rem !important;
        }
        .wide-qr-modal p {
          font-size: 1.5rem !important;
          margin-bottom: 2.5rem !important;
        }
        .wide-qr-container {
          padding: 2.5rem !important;
          margin-bottom: 2.5rem !important;
        }
        .wide-qr-container svg {
          width: 550px !important;
          height: 550px !important;
        }
        .wide-qr-modal input, .wide-qr-modal button {
          font-size: 1.25rem !important;
          padding-top: 1rem !important;
          padding-bottom: 1rem !important;
          border-radius: 1.25rem !important;
        }
        .wide-qr-modal .tracking-widest {
          font-size: 4.5rem !important;
          margin-top: 1rem !important;
        }
        .wide-qr-modal .uppercase {
          font-size: 1.25rem !important;
        }
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
    if (nextIdx >= -1 && nextIdx < poll.questions.length) {
      try {
        await startQuestion(pollId, nextIdx, activeCohort);
      } catch (err) {
        toast.error("Failed to switch question: " + (err.message || err));
      }
    }
  };

  // Cohort Toggle handler
  const handleCohortToggle = async (cohortVal) => {
    setActiveCohort(cohortVal);
    if (startQuestion && activeQuestionIndex >= 0) {
      try {
        await startQuestion(pollId, activeQuestionIndex, cohortVal);
      } catch (err) {
        toast.error("Failed to switch cohort: " + (err.message || err));
      }
    }
  };

  const pageQuestionRef = useRef(handlePageQuestion);
  useEffect(() => {
    pageQuestionRef.current = handlePageQuestion;
  });

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (document.activeElement && (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA" ||
        document.activeElement.isContentEditable
      )) {
        return;
      }

      if (event.key === "ArrowRight") {
        pageQuestionRef.current(1);
      } else if (event.key === "ArrowLeft") {
        pageQuestionRef.current(-1);
      } else if (event.key.toLowerCase() === "q") {
        setShowQrCode((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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

    let scale = 1.0;
    if (width > 2500) scale = 1.7;
    else if (width > 1850) scale = 1.45;
    else if (width > 1400) scale = 1.15;

    // Initialize bubble sizes and layout positions
    const nodes = activeSkills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      count: counts[skill.id] || 0,
      radius: Math.max(50, 45 + (counts[skill.id] || 0) / maxCount * 75) * scale,
    }));

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "collide",
        d3.forceCollide().radius((d) => d.radius + 6)
      )
      .force("manyBody", d3.forceManyBody().strength(-40))
      .force("center", d3.forceCenter(width / 2, height / 2 + 90))
      .force("x", d3.forceX(width / 2).strength(0.08))
      .force("y", d3.forceY(height / 2 + 90).strength(0.08));

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

    // Glow filter for bubbles
    const glowFilter = defs.append("filter")
      .attr("id", "bp-glow")
      .attr("x", "-20%")
      .attr("y", "-20%")
      .attr("width", "140%")
      .attr("height", "140%");
    glowFilter.append("feGaussianBlur")
      .attr("stdDeviation", "6")
      .attr("result", "blur");
    const glowMerge = glowFilter.append("feMerge");
    glowMerge.append("feMergeNode").attr("in", "blur");
    glowMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Ambient glow for bubble backgrounds
    const ambientGlow = defs.append("filter")
      .attr("id", "bp-ambient-glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    ambientGlow.append("feGaussianBlur")
      .attr("stdDeviation", "12")
      .attr("result", "blur");
    const ambientMerge = ambientGlow.append("feMerge");
    ambientMerge.append("feMergeNode").attr("in", "blur");
    ambientMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Inner highlight / sheen on bubbles
    gradients.forEach((gData) => {
      const sheenGrad = defs.append("radialGradient")
        .attr("id", `sheen-${gData.id}`)
        .attr("cx", "35%")
        .attr("cy", "25%")
        .attr("r", "60%");
      sheenGrad.append("stop").attr("offset", "0%").attr("stop-color", "rgba(255,255,255,0.4)");
      sheenGrad.append("stop").attr("offset", "50%").attr("stop-color", "rgba(255,255,255,0.05)");
      sheenGrad.append("stop").attr("offset", "100%").attr("stop-color", "rgba(255,255,255,0)");
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
      .attr("opacity", 0.9)
      .attr("stroke", "rgba(255,255,255,0.85)")
      .attr("stroke-width", 3)
      .attr("filter", "url(#bp-glow)")
      .style("cursor", "grab")
      .style("transition", "r 0.3s ease-out, stroke-width 0.2s ease-out, filter 0.2s ease-out");

    // Sheen overlay for glossy effect
    nodeGroup
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d, i) => `url(#sheen-${gradients[i % gradients.length].id})`)
      .attr("stroke", "none")
      .style("pointer-events", "none");

    // Ambient glow ring behind bubble
    nodeGroup
      .append("circle")
      .attr("r", (d) => d.radius * 0.5)
      .attr("fill", (d, i) => {
        const g = gradients[i % gradients.length];
        return g.start;
      })
      .attr("opacity", 0.08)
      .attr("filter", "url(#bp-ambient-glow)")
      .attr("transform", "translate(0, 0)")
      .style("pointer-events", "none");

    // Hover interaction: enlarge and brighten on mouse enter
    nodeGroup
      .on("mouseenter", function () {
        d3.select(this).select("circle:first-child")
          .transition()
          .duration(200)
          .attr("stroke", "rgba(255,255,255,1)")
          .attr("stroke-width", 5);
      })
      .on("mouseleave", function () {
        d3.select(this).select("circle:first-child")
          .transition()
          .duration(200)
          .attr("stroke", "rgba(255,255,255,0.85)")
          .attr("stroke-width", 3);
      });

    // Render text block inside foreignObject (ensures text is wrapped and fully contained inside the sphere)
    const fo = nodeGroup
      .append("foreignObject")
      .attr("x", (d) => -d.radius * 0.95)
      .attr("y", (d) => -d.radius * 0.95)
      .attr("width", (d) => d.radius * 1.9)
      .attr("height", (d) => d.radius * 1.9)
      .style("pointer-events", "none");

    const bodyDiv = fo
      .append("xhtml:div")
      .style("width", "100%")
      .style("height", "100%")
      .style("display", "flex")
      .style("flex-direction", "column")
      .style("align-items", "center")
      .style("justify-content", "center")
      .style("font-family", "'Epilogue', sans-serif")
      .style("text-align", "center")
      .style("color", "#fff")
      .style("padding", "6px")
      .style("box-sizing", "border-box")
      .style("text-shadow", "0 2px 4px rgba(0,0,0,0.8)")
      .style("opacity", (d) => d.count > 0 ? 1 : 0)
      .style("transition", "opacity 0.3s ease-out");

    bodyDiv.append("p")
      .attr("class", "skill-name")
      .style("margin", "0")
      .style("font-weight", "800")
      .style("line-height", "1.15")
      .style("font-size", (d) => `${Math.max(10, Math.min(d.radius * 0.22, 13 * scale))}px`)
      .text((d) => d.name);

    bodyDiv.append("p")
      .attr("class", "skill-coins")
      .style("margin", "4px 0 0 0")
      .style("font-weight", "700")
      .style("color", "#fbbf24")
      .style("font-size", (d) => `${Math.max(9, Math.min(d.radius * 0.18, 11 * scale))}px`)
      .text((d) => `${d.count} Coins`);

    const minYBoundary = 180 * scale;

    simulation.on("tick", () => {
      nodes.forEach((d) => {
        // Clamp Y to prevent overlapping with top question banner
        const minY = minYBoundary + d.radius;
        if (d.y < minY) {
          d.y = minY;
        }
      });
      nodeGroup.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    simulationRef.current = simulation;

    const handleResize = () => {
      if (!containerRef.current) return;
      const { width: w, height: h } = containerRef.current.getBoundingClientRect();
      svg.attr("width", w).attr("height", h);
      simulation.force("center", d3.forceCenter(w / 2, h / 2 + 90));
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

  const isSessionEnded = biddingClosed || poll?.biddingClosed;

  if (isSessionEnded) {
    return (
      <div className={`relative h-screen w-full ${bgClass} overflow-hidden flex flex-col justify-between p-6`} style={bgUrl ? { backgroundImage: `url(${bgUrl})` } : {}}>
        {bgUrl && <div className="absolute inset-0 bg-black/40 z-0" />}

        {/* Top Header */}
        <div className="z-20 p-6 flex items-center justify-between w-full">
          <img src="/GryphonWhite.png" alt="Gryphon Logo" className="h-14 w-auto object-contain wide-logo-gryphon" />
          {isSynergy && <img src="/SNSlogo.png" alt="Synergy Sphere Logo" className="h-12 w-auto object-contain wide-logo-event" />}
          {isMasterclass && <img src="/mc01.png" alt="Masterclass Logo" className="h-12 w-auto object-contain wide-logo-event" />}
        </div>

        {/* Center Concluded Card */}
        <div className="z-20 text-center select-none w-full max-w-lg mx-auto my-auto px-4">
          <div className="bg-black/80 backdrop-blur-lg border border-white/15 px-10 py-10 rounded-3xl shadow-2xl flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <Trophy className="w-10 h-10 text-emerald-500 animate-bounce" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                Bidding Arena
              </span>
              <h2 className="text-3xl font-black text-white mt-2">
                Session Concluded
              </h2>
            </div>
            <p className="text-white/60 text-sm leading-relaxed max-w-md">
              The Skill Bidding session has ended. Thank you to all participants for entering their bids!
            </p>

            <button
              onClick={() => router.push("/dashboard/bidding")}
              className={`py-3 px-8 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] ${
                isSynergy
                  ? "bg-rose-600 hover:bg-rose-500"
                  : isMasterclass
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-slate-700 hover:bg-slate-600"
              }`}
            >
              Exit to Dashboard
            </button>
          </div>
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
          <img
            src="/GryphonWhite.png"
            alt="Gryphon Logo"
            className="h-14 w-auto object-contain filter drop-shadow-md wide-logo-gryphon"
          />
        </div>
        <div className="flex items-center gap-4">
          {isSynergy && <img src="/SNSlogo.png" alt="Synergy Sphere Logo" className="h-12 w-auto object-contain wide-logo-event" />}
          {isMasterclass && <img src="/mc01.png" alt="Masterclass Logo" className="h-12 w-auto object-contain wide-logo-event" />}
        </div>
      </div>

      {/* Active Question Display in the Center (Styled like standard presenter screen) */}
      {activeQuestionIndex !== -1 && activeQuestion ? (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 text-center max-w-2xl xl:max-w-4xl 2xl:max-w-6xl px-6 w-full select-none bp-fadeIn pointer-events-none">
          <div className="bg-black/50 backdrop-blur-md border border-white/15 px-6 py-4 md:px-8 md:py-5 lg:px-10 lg:py-6 rounded-3xl shadow-2xl">
            <h2 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-4xl font-light text-white leading-snug" style={{ fontFamily: "'Libre Baskerville', serif" }}>
              {activeQuestion.text || activeQuestion.title}
            </h2>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 z-15 flex flex-col items-center justify-center select-none bp-fadeIn pointer-events-none text-center">
          <h1 className="text-white text-5xl md:text-7xl font-light tracking-wide mb-4" style={{ fontFamily: "'Libre Baskerville', serif" }}>
            {isMasterclass ? "Welcome to Masterclass 3.0" : isSynergy ? "Welcome to Synergy Sphere 2.0" : "Welcome to Bidding Arena"}
          </h1>
          <p className="text-white/80 text-lg md:text-xl font-light italic tracking-wide mt-2" style={{ fontFamily: "'Libre Baskerville', serif" }}>
            {(isMasterclass || isSynergy) ? "The adventurous Intelligence" : "Interactive Skill Bidding"}
          </p>
        </div>
      )}

      {/* SVG Canvas for Bubbles */}
      {activeQuestionIndex !== -1 && (
        <div ref={containerRef} className="absolute inset-0 z-10">
          <svg ref={svgRef} width="100%" height="100%" style={{ display: "block" }} />
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div className="fixed bottom-6 left-0 right-0 w-full px-6 md:px-12 z-20 pointer-events-none flex justify-between items-center">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-2 flex items-center gap-2 shadow-2xl pointer-events-auto relative">
          {/* Float zone: emojis drift upward through here, relative to the container */}
          <div className="absolute bottom-full right-4 pointer-events-none z-50 w-36 h-72 overflow-visible flex justify-center items-end mb-2">
            {floatingEmojis.map((r) => (
              <span
                key={r.id}
                className={`sn-flow-${r.flow} absolute select-none pointer-events-none`}
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
          {activeQuestionIndex === -1 && (
            <button
              onClick={() => handlePageQuestion(1)}
              className={`px-3 py-1.5 rounded-lg text-white font-bold text-xs uppercase tracking-wider transition-all ${
                isSynergy
                  ? "bg-rose-600 hover:bg-rose-500"
                  : isMasterclass
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-slate-700 hover:bg-slate-600"
              }`}
            >
              Start
            </button>
          )}

          <button
            onClick={() => handlePageQuestion(-1)}
            disabled={activeQuestionIndex <= -1}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent text-white transition-all"
            title="Previous Question"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-white/60 text-xs font-bold px-2 select-none min-w-[3rem] text-center">
            {activeQuestionIndex === -1 ? "0" : activeQuestionIndex + 1} / {poll.questions.length}
          </span>
          <button
            onClick={() => handlePageQuestion(1)}
            disabled={activeQuestionIndex >= poll.questions.length - 1}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent text-white transition-all"
            title="Next Question"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleEndPoll}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
          >
            End
          </button>

          <div className="w-px h-4 bg-white/20 mx-1" />

          <button
            onClick={() => setShowQrCode(!showQrCode)}
            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all border ${showQrCode
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

      {/* Character and Platform Wrapper - 40% screen height */}
      <div className="fixed bottom-0 right-0 z-20 pointer-events-none w-[35vh] h-[40vh]">
        {/* Looping Character Sprite */}
        <div
          className="absolute bottom-[22vh] right-[6vh] w-[25vh] h-[25vh] pointer-events-auto z-30 cursor-pointer hover:scale-105 transition-transform"
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
            className="w-full h-full object-contain select-none"
            style={{ transform: "scaleX(-1)" }}
          />
        </div>

        {/* Branch Sprite */}
        <div className="absolute bottom-[-8vh] right-[-3vh] w-[33vh] h-auto pointer-events-none z-20">
          <img
            src={isSynergy ? "/GameSprites/platform.png" : "/GameSprites/branch.png"}
            alt="Branch Platform"
            className="w-full h-auto object-contain select-none"
          />
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
        className="relative w-full max-w-lg rounded-3xl p-8 text-center border shadow-2xl transition-all wide-qr-modal"
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

        <div className="bg-white p-6 rounded-2xl inline-block shadow-lg border border-white/10 mb-6 bp-glow wide-qr-container">
          <QRCodeSVG value={participantUrl} size={400} />
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
