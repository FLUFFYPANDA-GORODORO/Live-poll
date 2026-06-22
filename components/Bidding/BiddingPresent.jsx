"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, Play, Square, BarChart3, X, Users, QrCode, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const GLOBAL_STYLE_ID = "bidding-present-styles";

export default function BiddingPresent({
  skills,
  bubbleCounts,
  committedCount,
  theme,
  cleanTitle,
  pollId,
  startBidding,
  stopBidding,
  fetchBiddingAnalytics,
  isBiddingActive,
  biddingClosed,
}) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const [d3Loaded, setD3Loaded] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [loadingD3, setLoadingD3] = useState(true);

  const isSynergy = theme === "synergy_sphere";
  const isMasterclass = theme === "masterclass";

  // Dynamic D3 injection (presenter only — keeps client bundle light)
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

  // Dynamic styles
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

  // Load analytics
  const handleViewAnalytics = useCallback(async () => {
    if (!pollId || !fetchBiddingAnalytics) return;
    setShowAnalytics(true);
    try {
      await fetchBiddingAnalytics(pollId);
      // Store accesses biddingAnalytics from the store directly
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  }, [pollId, fetchBiddingAnalytics]);

  // D3 Force Simulation
  useEffect(() => {
    if (!d3Loaded || !svgRef.current || !containerRef.current || !skills?.length) return;

    const d3 = window.d3;
    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Determine max count for radius scaling
    const counts = bubbleCounts || {};
    const maxCount = Math.max(1, ...skills.map((s) => counts[s.id] || 0));

    const nodes = skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      count: counts[skill.id] || 0,
      radius: Math.max(20, 15 + (counts[skill.id] || 0) / maxCount * 45),
    }));

    // Color mapping by category
    const categoryColors = {
      Leadership: isSynergy ? "#f43f5e" : isMasterclass ? "#10b981" : "#6366f1",
      Technical: isSynergy ? "#fb923c" : isMasterclass ? "#34d399" : "#8b5cf6",
      Cognitive: isSynergy ? "#a78bfa" : isMasterclass ? "#6ee7b7" : "#ec4899",
      Interpersonal: isSynergy ? "#f472b6" : isMasterclass ? "#a7f3d0" : "#f59e0b",
    };

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "collide",
        d3.forceCollide().radius((d) => d.radius + 3)
      )
      .force("manyBody", d3.forceManyBody().strength(-25))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05));

    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom().scaleExtent([0.3, 3]).on("zoom", (event) => {
      g.attr("transform", event.transform);
    });
    svg.call(zoom);

    const tooltip = d3.select(container.parentElement)
      .append("div")
      .attr("class", "bp-tooltip")
      .style("opacity", 0);

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

    // Bubbles
    nodeGroup
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => categoryColors[d.category] || "#64748b")
      .attr("opacity", 0.85)
      .attr("stroke", "rgba(255,255,255,0.15)")
      .attr("stroke-width", 1.5)
      .style("cursor", "grab")
      .style("transition", "r 0.3s ease-out");

    // Glow filter
    const defs = svg.append("defs");
    const filter = defs
      .append("filter")
      .attr("id", "bp-glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "blur");
    const merge = filter.append("feMerge");
    merge.append("feMergeNode").attr("in", "blur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    // Labels (only if radius > 30)
    nodeGroup
      .append("text")
      .text((d) => (d.radius > 30 ? d.name : ""))
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "#fff")
      .attr("font-size", (d) => `${Math.min(d.radius * 0.35, 14)}px`)
      .attr("font-family", "Epilogue, sans-serif")
      .attr("font-weight", "600")
      .attr("pointer-events", "none")
      .style("text-shadow", "0 1px 3px rgba(0,0,0,0.5)");

    // Count badge
    nodeGroup
      .append("text")
      .text((d) => (d.count > 0 ? d.count : ""))
      .attr("text-anchor", "middle")
      .attr("dy", (d) => `${-d.radius - 8}px`)
      .attr("fill", (d) => categoryColors[d.category] || "#64748b")
      .attr("font-size", "12px")
      .attr("font-family", "Epilogue, sans-serif")
      .attr("font-weight", "700")
      .attr("pointer-events", "none");

    // Hover interactions
    nodeGroup
      .on("mouseenter", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${d.name}</strong><br/>Category: ${d.category}<br/>Votes: ${d.count}`
          )
          .style("left", `${event.pageX + 12}px`)
          .style("top", `${event.pageY - 10}px`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.pageX + 12}px`)
          .style("top", `${event.pageY - 10}px`);
      })
      .on("mouseleave", () => {
        tooltip.style("opacity", 0);
      });

    simulation.on("tick", () => {
      nodeGroup.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    simulationRef.current = simulation;

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const { width: w, height: h } = containerRef.current.getBoundingClientRect();
      svg.attr("width", w).attr("height", h);
      simulation.force("center", d3.forceCenter(w / 2, h / 2));
      simulation.alpha(0.3).restart();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      simulation.stop();
      tooltip.remove();
    };
  }, [d3Loaded, skills, bubbleCounts, isSynergy, isMasterclass]);

  // Update bubble sizes when bubbleCounts changes
  useEffect(() => {
    if (!window.d3 || !simulationRef.current || !skills?.length) return;
    const d3 = window.d3;
    const counts = bubbleCounts || {};
    const maxCount = Math.max(1, ...skills.map((s) => counts[s.id] || 0));

    const nodes = simulationRef.current.nodes();
    nodes.forEach((node) => {
      const newCount = counts[node.id] || 0;
      node.count = newCount;
      const newRadius = Math.max(20, 15 + (newCount / maxCount) * 45);
      node.radius = newRadius;
    });

    simulationRef.current.alpha(0.3).restart();

    // Update SVG visuals
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
      .text((d) => (d.radius > 30 ? d.name : ""))
      .attr("font-size", (d) => `${Math.min(d.radius * 0.35, 14)}px`);

    svg
      .selectAll(".bp-node text:last-of-type")
      .data(nodes)
      .text((d) => (d.count > 0 ? d.count : ""))
      .attr("dy", (d) => `${-d.radius - 8}px`);
  }, [bubbleCounts, skills]);

  const bgClass = isSynergy
    ? "bg-gradient-to-br from-stone-950 via-stone-900 to-rose-950"
    : isMasterclass
    ? "bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950"
    : "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900";

  const accentColor = isSynergy ? "#f43f5e" : isMasterclass ? "#10b981" : "#6366f1";

  if (loadingD3) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: accentColor }} />
          <p className="text-white/60 font-[Epilogue]">Loading visualization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen ${bgClass} overflow-hidden`}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex items-center justify-between bp-fadeIn">
        <div>
          <h1 className="text-white font-[Epilogue] text-xl font-bold tracking-tight">
            {cleanTitle || "Skill Bidding"}
          </h1>
          <p className="text-white/40 text-sm font-[Epilogue] mt-1">
            {isSynergy ? "SynergySphere" : isMasterclass ? "Masterclass" : "Live Poll"} • Bubble Chart
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isBiddingActive && !biddingClosed && (
            <button
              onClick={() => startBidding?.(pollId)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold font-[Epilogue] transition-all hover:scale-105 bp-glow"
              style={{ background: accentColor, color: "#fff" }}
            >
              <Play className="w-4 h-4" />
              Start Bidding
            </button>
          )}
          {isBiddingActive && (
            <button
              onClick={() => stopBidding?.(pollId)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold font-[Epilogue] transition-all hover:scale-105"
              style={{ background: "#ef4444", color: "#fff" }}
            >
              <Square className="w-4 h-4" />
              Close Bidding
            </button>
          )}
          <button
            onClick={() => setShowQrCode(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-[Epilogue] transition-all hover:scale-105 bg-white/10 text-white/80 hover:bg-white/20"
          >
            <QrCode className="w-4 h-4" />
            Join QR
          </button>
          <button
            onClick={handleViewAnalytics}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-[Epilogue] transition-all hover:scale-105 bg-white/10 text-white/80 hover:bg-white/20"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-white/70 text-sm font-[Epilogue]">
            <Users className="w-4 h-4" />
            <span>{committedCount} submitted</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div ref={containerRef} className="absolute inset-0 z-10">
        <svg ref={svgRef} width="100%" height="100%" style={{ display: "block" }} />
      </div>

      {/* No skills placeholder */}
      {(!skills || skills.length === 0) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="text-center text-white/40 font-[Epilogue]">
            <p className="text-lg mb-2">No skills available</p>
            <p className="text-sm">Add skills via the admin panel to start bidding</p>
          </div>
        </div>
      )}

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

      {/* Analytics Modal */}
      {showAnalytics && (
        <AnalyticsModal
          theme={theme}
          pollId={pollId}
          onClose={() => setShowAnalytics(false)}
          fetchBiddingAnalytics={fetchBiddingAnalytics}
          isSynergy={isSynergy}
          isMasterclass={isMasterclass}
        />
      )}
    </div>
  );
}

function AnalyticsModal({
  theme,
  pollId,
  onClose,
  fetchBiddingAnalytics,
  isSynergy,
  isMasterclass,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const accentColor = isSynergy ? "#f43f5e" : isMasterclass ? "#10b981" : "#6366f1";

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5065"}/api/bidding/analytics/${pollId}`
        );
        if (!res.ok) throw new Error("Failed to load analytics");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [pollId]);

  const barMax = data?.skills?.length
    ? Math.max(1, ...data.skills.map((s) => Math.max(s.hrVotes || 0, s.academiaVotes || 0)))
    : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[85vh] mx-4 overflow-y-auto rounded-2xl p-8"
        style={{ background: isSynergy ? "#1c0a0a" : isMasterclass ? "#051a10" : "#1e293b", border: `1px solid ${accentColor}33` }}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-white font-[Epilogue] text-2xl font-bold mb-2">Bidding Analytics</h2>
        <p className="text-white/40 font-[Epilogue] text-sm mb-8">
          {isSynergy ? "SynergySphere (HR)" : isMasterclass ? "Masterclass (ACADEMIA)" : "Cross-Cohort"} Comparison
        </p>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: accentColor }} />
          </div>
        )}

        {error && (
          <div className="text-center py-10">
            <p className="text-red-400 font-[Epilogue]">{error}</p>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="rounded-xl p-4 bg-white/5">
                <p className="text-white/50 text-xs font-[Epilogue] uppercase tracking-wider">Total Skills</p>
                <p className="text-white text-2xl font-bold font-[Epilogue] mt-1">{data.skills?.length || 0}</p>
              </div>
              <div className="rounded-xl p-4 bg-white/5">
                <p className="text-white/50 text-xs font-[Epilogue] uppercase tracking-wider">HR Votes</p>
                <p className="text-2xl font-bold font-[Epilogue] mt-1" style={{ color: isSynergy ? "#f43f5e" : "#a78bfa" }}>
                  {data.skills?.reduce((sum, s) => sum + (s.hrVotes || 0), 0) || 0}
                </p>
              </div>
              <div className="rounded-xl p-4 bg-white/5">
                <p className="text-white/50 text-xs font-[Epilogue] uppercase tracking-wider">Academia Votes</p>
                <p className="text-2xl font-bold font-[Epilogue] mt-1" style={{ color: isMasterclass ? "#10b981" : "#34d399" }}>
                  {data.skills?.reduce((sum, s) => sum + (s.academiaVotes || 0), 0) || 0}
                </p>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="space-y-4">
              {data.skills?.map((skill, idx) => {
                const hrWidth = ((skill.hrVotes || 0) / barMax) * 100;
                const acWidth = ((skill.academiaVotes || 0) / barMax) * 100;
                const divergence = skill.divergenceScore || Math.abs((skill.hrVotes || 0) - (skill.academiaVotes || 0));
                return (
                  <div key={idx} className="bp-fadeIn" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-white/80 text-sm font-[Epilogue] font-semibold">{skill.name}</span>
                      <span className="text-white/40 text-xs font-[Epilogue]">
                        Δ {divergence}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/40 w-12 font-[Epilogue]">HR</span>
                        <div className="flex-1 h-4 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${hrWidth}%`, background: isSynergy ? "#f43f5e" : "#a78bfa" }}
                          />
                        </div>
                        <span className="text-xs text-white/60 w-8 text-right font-[Epilogue]">{skill.hrVotes || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/40 w-12 font-[Epilogue]">ACA</span>
                        <div className="flex-1 h-4 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${acWidth}%`, background: isMasterclass ? "#10b981" : "#34d399" }}
                          />
                        </div>
                        <span className="text-xs text-white/60 w-8 text-right font-[Epilogue]">{skill.academiaVotes || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {(!data.skills || data.skills.length === 0) && (
              <div className="text-center py-10 text-white/40 font-[Epilogue]">
                No bidding data yet
              </div>
            )}
          </div>
        )}
      </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in" onClick={onClose}>
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

        {/* QR Code Container */}
        <div className="bg-white p-6 rounded-2xl inline-block shadow-lg border border-white/10 mb-6 bp-glow">
          <QRCodeSVG value={participantUrl} size={220} />
        </div>

        {/* Link Input & Copy */}
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
