"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Upload, 
  BarChart3, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileSpreadsheet,
  TrendingUp,
  Percent,
  Sliders
} from "lucide-react";

const CHART_COLORS = [
  "linear-gradient(to top, #3a7bd5, #3a6073)",
  "linear-gradient(to top, #7fa99b, #a8d3c5)",
  "linear-gradient(to top, #8fbc8f, #b8e2b8)",
  "linear-gradient(to top, #e5a93b, #f5d061)",
  "linear-gradient(to top, #cd5c5c, #f08080)",
];

function WordCloudChart({ wordSubmissions, questionIndex }) {
  const chartInstance = useRef(null);
  const containerId = `wordcloud-chart-${questionIndex}`;

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
        
        if (window.am4themes_animated) {
          window.am4core.useTheme(window.am4themes_animated.default || window.am4themes_animated);
        }

        setTimeout(() => {
          if (disposed) return;
          const container = document.getElementById(containerId);
          if (!container) return;
          
          if (chartInstance.current) chartInstance.current.dispose();
          
          const chart = window.am4core.create(containerId, window.am4plugins_wordCloud.WordCloud);
          if (chart.logo) chart.logo.dispose();
          
          const series = chart.series.push(new window.am4plugins_wordCloud.WordCloudSeries());
          series.accuracy = 4; 
          series.step = 15; 
          series.rotationThreshold = 0.7;
          series.maxCount = 100; 
          series.minWordLength = 2;
          series.randomness = 0;
          series.interpolationDuration = 800;
          series.labels.template.tooltipText = "{word}: {value}";
          series.fontFamily = "Libre Baskerville";
          series.maxFontSize = window.am4core.percent(30);
          series.minFontSize = window.am4core.percent(6);
          series.dataFields.word = "word"; 
          series.dataFields.value = "count";
          
          series.labels.template.adapter.add("fill", (fill, target) => {
            if (target.dataItem?.word) return window.am4core.color(getWordColor(target.dataItem.word));
            return fill;
          });
          
          series.data = wordSubmissions.map(([word, freq]) => ({ word, count: freq }));
          chartInstance.current = chart;
        }, 80);
      } catch (err) { 
        console.error("Failed to load amCharts wordCloud", err); 
      }
    };

    if (wordSubmissions.length > 0) {
      initChart();
    }
    
    return () => { 
      disposed = true; 
      if (chartInstance.current) { 
        chartInstance.current.dispose(); 
        chartInstance.current = null; 
      } 
    };
  }, [wordSubmissions, containerId]);

  return (
    <div className="w-full bg-slate-950/40 backdrop-blur-sm rounded-xl mb-4 border border-emerald-950/20">
      <div id={containerId} className="h-[450px] w-full" />
    </div>
  );
}

export default function AnalyticsPage() {
  const [csvData, setCsvData] = useState(null);
  const [error, setError] = useState(null);
  const [showAsPercentage, setShowAsPercentage] = useState(true);
  const [activeQuestionId, setActiveQuestionId] = useState(null);

  // Helper to parse RFC 4180 CSV
  const parseCSV = (text) => {
    const lines = [];
    let row = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          row[row.length - 1] += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push("");
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip \n
        }
        lines.push(row);
        row = [""];
      } else {
        row[row.length - 1] += char;
      }
    }
    if (row.length > 1 || row[0] !== "") {
      lines.push(row);
    }
    return lines;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = parseCSV(text);
        if (parsed.length < 2) {
          throw new Error("CSV file is empty or invalid.");
        }

        const headers = parsed[0].map(h => h.trim());
        const rawRows = parsed.slice(1).filter(r => r.length >= headers.length);

        // Map rows to objects
        const rows = rawRows.map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] ? row[index].trim() : "";
          });
          return obj;
        });

        processAnalytics(rows);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
  };

  const processAnalytics = (rows) => {
    // 1. Gather all unique questions and their options
    const questionMap = new Map();

    rows.forEach(row => {
      const qIndex = parseInt(row["Question Index"], 10);
      if (isNaN(qIndex)) return;

      const qText = row["Question Text"];
      const qType = row["Question Type"];
      const optIndex = row["Option Index"];
      const optText = row["Option Text"];

      if (!questionMap.has(qIndex)) {
        questionMap.set(qIndex, {
          index: qIndex - 1, // Store as 0-based
          text: qText,
          type: qType,
          options: new Map(),
          votes: []
        });
      }

      const qData = questionMap.get(qIndex);

      // Collect options if they exist
      if (optIndex && optText) {
        const oIdx = parseInt(optIndex, 10);
        if (!qData.options.has(oIdx)) {
          qData.options.set(oIdx, optText);
        }
      }

      // Collect vote if voter session exists
      if (row["Voter Session ID"]) {
        qData.votes.push({
          sessionId: row["Voter Session ID"],
          optionIndex: optIndex ? parseInt(optIndex, 10) : null,
          optionText: optText || null,
          submittedText: row["Submitted Text"] || null,
          votedAt: row["Voted At"] ? new Date(row["Voted At"]) : null
        });
      }
    });

    const questionsList = Array.from(questionMap.values())
      .sort((a, b) => a.index - b.index)
      .map(q => ({
        ...q,
        options: Array.from(q.options.entries())
          .sort((a, b) => a[0] - b[0])
          .map(entry => ({ index: entry[0], text: entry[1] }))
      }));

    // Calculate core metrics
    const allVotes = rows.filter(r => r["Voter Session ID"]);
    const uniqueVoters = new Set(allVotes.map(v => v["Voter Session ID"]));
    
    // Questions answered (with at least 1 vote)
    const answeredCount = questionsList.filter(q => q.votes.length > 0).length;

    // Timeline calculations
    const timestamps = allVotes
      .map(v => v["Voted At"] ? new Date(v["Voted At"]).getTime() : null)
      .filter(t => t !== null)
      .sort((a, b) => a - b);

    let sessionDurationStr = "0 min";
    if (timestamps.length > 0) {
      const diffMs = timestamps[timestamps.length - 1] - timestamps[0];
      const diffMin = Math.round(diffMs / 60000);
      sessionDurationStr = diffMin > 0 ? `~${diffMin} min` : "<1 min";
    }

    // Bucket votes by minute for the timeline chart
    const timelineBuckets = {};
    if (timestamps.length > 0) {
      const startTime = timestamps[0];
      allVotes.forEach(v => {
        if (!v["Voted At"]) return;
        const time = new Date(v["Voted At"]).getTime();
        const minutesFromStart = Math.floor((time - startTime) / 60000);
        timelineBuckets[minutesFromStart] = (timelineBuckets[minutesFromStart] || 0) + 1;
      });
    }

    const timelineData = Object.keys(timelineBuckets)
      .map(min => ({ minute: parseInt(min, 10), count: timelineBuckets[min] }))
      .sort((a, b) => a.minute - b.minute);

    setCsvData({
      pollId: rows[0]?.["Poll ID"] || "UNKNOWN",
      pollTitle: rows[0]?.["Poll Title"] || "Poll Export",
      theme: rows[0]?.["Theme"] || "default",
      questions: questionsList,
      totalVotes: allVotes.length,
      uniqueParticipants: uniqueVoters.size,
      questionsAnswered: answeredCount,
      totalQuestions: questionsList.length,
      sessionDuration: sessionDurationStr,
      timeline: timelineData
    });
  };

  const scrollToQuestion = (id) => {
    setActiveQuestionId(id);
    const element = document.getElementById(`q-card-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const exportToWord = async () => {
    if (!csvData) return;
    
    // In-memory helper to build vector SVGs for Multiple Choice questions
    const generateBarGraphSvg = (question, totalVotes, winnerIndex) => {
      const width = 600;
      const height = 240;
      const paddingBottom = 40;
      const paddingTop = 30;
      const paddingLeft = 40;
      const paddingRight = 40;
      
      const chartWidth = width - paddingLeft - paddingRight;
      const chartHeight = height - paddingTop - paddingBottom;
      
      const options = question.options;
      const numOptions = options.length;
      const colWidth = numOptions > 0 ? (chartWidth / numOptions) * 0.6 : 50;
      const colGap = numOptions > 1 ? (chartWidth - (colWidth * numOptions)) / (numOptions - 1) : 20;
      
      const voteCounts = options.map(o => question.votes.filter(v => v.optionIndex === o.index).length);
      const maxVotes = Math.max(...voteCounts, 1);
      
      const gradients = [
        '<linearGradient id="g0" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#3a7bd5"/><stop offset="100%" stop-color="#3a6073"/></linearGradient>',
        '<linearGradient id="g1" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#7fa99b"/><stop offset="100%" stop-color="#a8d3c5"/></linearGradient>',
        '<linearGradient id="g2" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#8fbc8f"/><stop offset="100%" stop-color="#b8e2b8"/></linearGradient>',
        '<linearGradient id="g3" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#e5a93b"/><stop offset="100%" stop-color="#f5d061"/></linearGradient>',
        '<linearGradient id="g4" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#cd5c5c"/><stop offset="100%" stop-color="#f08080"/></linearGradient>',
      ];
      
      let svgString = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="background-color: #0f172a; font-family: 'Segoe UI', Arial, sans-serif;">`;
      svgString += '<defs>' + gradients.join('') + '</defs>';
      
      const baselineY = height - paddingBottom;
      svgString += `<line x1="${paddingLeft}" y1="${baselineY}" x2="${width - paddingRight}" y2="${baselineY}" stroke="#334155" stroke-width="1" />`;
      
      options.forEach((opt, idx) => {
        const count = question.votes.filter(v => v.optionIndex === opt.index).length;
        const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const colHeight = (count / maxVotes) * chartHeight;
        const isWinner = opt.index === winnerIndex && count > 0;
        
        const x = paddingLeft + idx * (colWidth + colGap);
        const y = baselineY - colHeight;
        
        const gradId = `g${idx % 5}`;
        svgString += `<rect x="${x}" y="${y}" width="${colWidth}" height="${Math.max(colHeight, 4)}" fill="url(#${gradId})" rx="3" ry="3" />`;
        
        if (isWinner) {
          svgString += `<rect x="${x - 2}" y="${y - 2}" width="${colWidth + 4}" height="${Math.max(colHeight + 4, 8)}" fill="none" stroke="#10b981" stroke-width="2" rx="5" ry="5" />`;
        }
        
        svgString += `<text x="${x + colWidth / 2}" y="${y - 8}" fill="#f8fafc" font-size="9" font-weight="bold" text-anchor="middle">${count} (${percentage}%)</text>`;
        
        const labelY = baselineY + 18;
        let labelText = opt.text;
        if (labelText.length > 15) {
          labelText = labelText.substring(0, 12) + '...';
        }
        svgString += `<text x="${x + colWidth / 2}" y="${labelY}" fill="${isWinner ? '#10b981' : '#94a3b8'}" font-size="9" font-weight="${isWinner ? 'bold' : 'normal'}" text-anchor="middle">${labelText}</text>`;
      });
      
      svgString += '</svg>';
      return svgString;
    };

    // Capture PNG snapshots of the active word cloud charts from DOM SVGs
    const wordCloudSnapshots = {};
    for (const question of csvData.questions) {
      const isMC = question.type === "MultipleChoice" || question.type === 0 || String(question.type).toLowerCase().includes("multiple");
      if (!isMC && question.votes.length > 0) {
        const svgElement = document.querySelector(`#wordcloud-chart-${question.index} svg`);
        if (svgElement) {
          try {
            const pngUrl = await new Promise((resolve) => {
              const serializer = new XMLSerializer();
              let svgString = serializer.serializeToString(svgElement);
              
              const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
              const url = URL.createObjectURL(svgBlob);
              
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = (svgElement.clientWidth || 600) * 2;
                canvas.height = (svgElement.clientHeight || 250) * 2;
                const ctx = canvas.getContext('2d');
                ctx.scale(2, 2);
                
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(0, 0, svgElement.clientWidth || 600, svgElement.clientHeight || 250);
                
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);
                resolve(canvas.toDataURL('image/png'));
              };
              img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve(null);
              };
              img.src = url;
            });
            if (pngUrl) {
              wordCloudSnapshots[question.index] = pngUrl;
            }
          } catch (err) {
            console.error("Failed to capture wordcloud SVG snapshot", err);
          }
        }
      }
    }

    // Capture PNG snapshots of MC bar graph SVGs built in-memory
    const barGraphSnapshots = {};
    for (const question of csvData.questions) {
      const isMC = question.type === "MultipleChoice" || question.type === 0 || String(question.type).toLowerCase().includes("multiple");
      if (isMC && question.votes.length > 0) {
        let winnerIndex = -1;
        let maxCount = -1;
        question.options.forEach(opt => {
          const count = question.votes.filter(v => v.optionIndex === opt.index).length;
          if (count > maxCount) {
            maxCount = count;
            winnerIndex = opt.index;
          }
        });

        try {
          const svgString = generateBarGraphSvg(question, question.votes.length, winnerIndex);
          const pngUrl = await new Promise((resolve) => {
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = 1200; // 2x high-res
              canvas.height = 480;
              const ctx = canvas.getContext('2d');
              ctx.scale(2, 2);
              ctx.drawImage(img, 0, 0);
              URL.revokeObjectURL(url);
              resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => {
              URL.revokeObjectURL(url);
              resolve(null);
            };
            img.src = url;
          });
          if (pngUrl) {
            barGraphSnapshots[question.index] = pngUrl;
          }
        } catch (e) {
          console.error("Failed to generate bar graph SVG snapshot", e);
        }
      }
    }
    
    let html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${csvData.pollTitle} - Analytics Report</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; line-height: 1.6; }
          h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; font-size: 24pt; }
          h2 { color: #0f172a; margin-top: 24pt; font-size: 16pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
          h3 { color: #1e293b; margin-top: 18pt; font-size: 13pt; }
          .stats-table { width: 100%; border-collapse: collapse; margin-bottom: 20pt; }
          .stats-table td { padding: 10px; border: 1px solid #e2e8f0; }
          .stats-label { font-weight: bold; color: #64748b; font-size: 10pt; text-transform: uppercase; }
          .stats-val { font-size: 18pt; font-weight: bold; color: #0f172a; }
          .q-card { border: 1px solid #e2e8f0; padding: 15px; margin-bottom: 15pt; border-radius: 8px; }
          .q-num { font-weight: bold; color: #059669; font-size: 11pt; }
          .q-text { font-size: 14pt; font-weight: bold; color: #0f172a; margin: 8px 0; }
          .opt-row { margin-bottom: 6px; }
          .opt-text { font-size: 11pt; color: #334155; }
          .opt-votes { font-weight: bold; color: #059669; }
          .winner-opt { font-weight: bold; color: #059669; background-color: #ecfdf5; padding: 4px; border-left: 3px solid #10b981; }
          .word-list { margin-top: 10px; }
          .word-tag { display: inline-block; background-color: #f1f5f9; padding: 4px 8px; margin: 4px; border-radius: 4px; font-size: 10pt; }
          .word-count { font-weight: bold; color: #059669; }
        </style>
      </head>
      <body>
        <h1>${csvData.pollTitle} - Session Analytics Report</h1>
        <p><strong>Session ID / Poll ID:</strong> ${csvData.pollId}</p>
        <p><strong>Theme:</strong> ${csvData.theme}</p>
        
        <h2>Executive Summary</h2>
        <table class="stats-table" style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px;">
          <tr>
            <td style="padding: 20px; text-align: center; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; width: 50%;">
              <div style="font-size: 9pt; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Total Votes</div>
              <div style="font-size: 26pt; font-weight: 900; color: #0f172a; font-family: 'Courier New', monospace;">${csvData.totalVotes}</div>
              <div style="font-size: 8pt; color: #94a3b8; margin-top: 4px;">Sum of all answers cast</div>
            </td>
            <td style="padding: 20px; text-align: center; border-bottom: 1px solid #cbd5e1; width: 50%;">
              <div style="font-size: 9pt; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Unique Participants</div>
              <div style="font-size: 26pt; font-weight: 900; color: #0f172a; font-family: 'Courier New', monospace;">${csvData.uniqueParticipants}</div>
              <div style="font-size: 8pt; color: #94a3b8; margin-top: 4px;">Unique voter session keys</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px; text-align: center; border-right: 1px solid #cbd5e1; width: 50%;">
              <div style="font-size: 9pt; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Questions Reached</div>
              <div style="font-size: 26pt; font-weight: 900; color: #10b981; font-family: 'Courier New', monospace;">${csvData.questionsAnswered} <span style="font-size: 14pt; color: #94a3b8; font-weight: normal;">/ ${csvData.totalQuestions}</span></div>
              <div style="font-size: 8pt; color: #94a3b8; margin-top: 4px;">${Math.round((csvData.questionsAnswered / csvData.totalQuestions) * 100)}% session coverage</div>
            </td>
            <td style="padding: 20px; text-align: center; width: 50%;">
              <div style="font-size: 9pt; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Session Duration</div>
              <div style="font-size: 26pt; font-weight: 900; color: #0f172a; font-family: 'Courier New', monospace;">${csvData.sessionDuration}</div>
              <div style="font-size: 8pt; color: #94a3b8; margin-top: 4px;">First to last vote span</div>
            </td>
          </tr>
        </table>

        <h2>Question Breakdown</h2>
    `;

    csvData.questions.forEach((question) => {
      const isMC = question.type === "MultipleChoice" || question.type === 0 || String(question.type).toLowerCase().includes("multiple");
      const totalVotesForQ = question.votes.length;

      // Find winner
      let winnerIndex = -1;
      let maxCount = -1;
      if (isMC && question.options.length > 0) {
        question.options.forEach(opt => {
          const count = question.votes.filter(v => v.optionIndex === opt.index).length;
          if (count > maxCount) {
            maxCount = count;
            winnerIndex = opt.index;
          }
        });
      }

      html += `
        <div class="q-card">
          <span class="q-num">Question ${question.index + 1} (${isMC ? 'Multiple Choice' : 'Word Cloud'})</span>
          <div class="q-text">${question.text}</div>
          <p><em>${totalVotesForQ} responses received</em></p>
      `;

      if (totalVotesForQ === 0) {
        html += `<p>No responses received for this question.</p>`;
      } else if (isMC) {
        const snapshotImg = barGraphSnapshots[question.index];
        if (snapshotImg) {
          html += `
            <div style="margin-top: 12px; margin-bottom: 12px; text-align: center;">
              <img src="${snapshotImg}" width="600" style="max-width: 100%; height: auto; border: 1px solid #cbd5e1; border-radius: 8px;" alt="Bar Graph Chart" />
            </div>
          `;
        }
      } else {
        const wordCloudFrequencies = {};
        question.votes.forEach(v => {
          if (!v.submittedText) return;
          const text = v.submittedText.trim();
          wordCloudFrequencies[text] = (wordCloudFrequencies[text] || 0) + 1;
        });
        const sortedWords = Object.entries(wordCloudFrequencies).sort((a, b) => b[1] - a[1]);

        // Render visual Word Cloud
        const maxFreq = sortedWords[0]?.[1] || 1;
        const snapshotImg = wordCloudSnapshots[question.index];
        
        if (snapshotImg) {
          html += `
            <div style="margin-top: 12px; margin-bottom: 12px; text-align: center;">
              <img src="${snapshotImg}" width="650" style="max-width: 100%; height: auto; border: 1px solid #cbd5e1; border-radius: 8px;" alt="Word Cloud Chart" />
            </div>
          `;
        } else {
          // Fallback if chart SVG not found
          html += `
            <div style="text-align: center; border: 1px solid #cbd5e1; padding: 25px; border-radius: 8px; background-color: #f8fafc; margin-top: 10px; margin-bottom: 10px;">
              ${sortedWords.map(([word, freq]) => {
                const fontSize = 10 + Math.round((freq / maxFreq) * 18);
                const colors = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0d9488", "#db2777"];
                const color = colors[Math.abs(word.charCodeAt(0) || 0) % colors.length];
                return `<span style="font-size: ${fontSize}pt; color: ${color}; font-weight: bold; margin: 0 12px; display: inline-block;">${word}</span>`;
              }).join(' ')}
            </div>
          `;
        }
        
        html += `
          <div class="word-list">
            <p style="font-size: 9pt; color: #475569; margin-bottom: 5px;"><strong>Frequencies list:</strong></p>
            ${sortedWords.map(([word, freq]) => `
              <span class="word-tag"><strong>${word}</strong> (<span class="word-count">${freq}</span>)</span>
            `).join('')}
          </div>
        `;
      }

      html += `</div>`;
    });

    html += `
        <h2>Participant Funnel Reach</h2>
        <ul>
    `;

    csvData.questions.filter(q => q.votes.length > 0).forEach((question) => {
      const uniqueVotersCount = new Set(question.votes.map(v => v.sessionId)).size;
      const percentOfTotal = csvData.uniqueParticipants > 0 
        ? Math.round((uniqueVotersCount / csvData.uniqueParticipants) * 100) 
        : 0;
      html += `<li>Question ${question.index + 1}: ${question.text} - ${uniqueVotersCount} unique participants (${percentOfTotal}%)</li>`;
    });

    html += `
        </ul>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${csvData.pollTitle.replace(/\s+/g, '_')}_Analytics_Report.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 bg-[url('/MasterClassNewBg.png')] bg-cover bg-center bg-fixed bg-no-repeat bg-[#02130d] text-emerald-50 min-h-screen p-6 md:p-10 font-epilogue">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-emerald-950/40 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3 font-baskerville">
              <BarChart3 className="w-8 h-8 text-[#10b981]" />
              Detailed Session Analytics
            </h1>
            <p className="text-emerald-300 mt-1 text-sm opacity-80">
              Upload your generated CSV to build high-fidelity interactive engagement reports.
            </p>
          </div>
          
          {csvData && (
            <div className="flex gap-3">
              <button
                onClick={exportToWord}
                className="px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-white text-sm font-semibold rounded-lg transition-colors border border-[#10b981] shadow-md flex items-center gap-2"
              >
                Export Word Doc
              </button>
              <button
                onClick={() => setCsvData(null)}
                className="px-4 py-2 bg-slate-900/60 hover:bg-slate-850/80 text-emerald-100 text-sm font-semibold rounded-lg transition-colors border border-emerald-900/40 backdrop-blur-sm"
              >
                Upload New CSV
              </button>
            </div>
          )}
        </div>

        {/* Upload State */}
        {!csvData ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-900/30 rounded-3xl p-12 bg-slate-950/50 backdrop-blur-md max-w-xl mx-auto my-12 shadow-2xl">
            <div className="w-16 h-16 bg-[#10b981]/10 rounded-2xl flex items-center justify-center mb-6">
              <Upload className="w-8 h-8 text-[#10b981]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-baskerville">Upload Session CSV</h3>
            <p className="text-emerald-300/80 text-sm text-center mb-6 max-w-sm">
              Drop or select the export CSV file generated from your dashboard to calculate participation funnels and curves.
            </p>
            <label className="cursor-pointer bg-[#10b981] hover:bg-[#059669] text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Choose Export File
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {error && (
              <div className="mt-6 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-10 animate-fade-in">
            {/* Stats Dashboard Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950/50 backdrop-blur-md border border-emerald-950/40 rounded-2xl p-5 shadow-lg">
                <div className="flex justify-between items-start text-emerald-300 mb-3">
                  <span className="text-xs uppercase tracking-wider font-semibold">Total Votes</span>
                  <CheckCircle className="w-4 h-4 text-[#10b981]" />
                </div>
                <div className="text-3xl font-black text-white font-mono">{csvData.totalVotes}</div>
                <div className="text-xs text-emerald-400/60 mt-1">Sum of all answers cast</div>
              </div>

              <div className="bg-slate-950/50 backdrop-blur-md border border-emerald-950/40 rounded-2xl p-5 shadow-lg">
                <div className="flex justify-between items-start text-emerald-300 mb-3">
                  <span className="text-xs uppercase tracking-wider font-semibold">Unique Participants</span>
                  <Users className="w-4 h-4 text-[#10b981]" />
                </div>
                <div className="text-3xl font-black text-white font-mono">{csvData.uniqueParticipants}</div>
                <div className="text-xs text-emerald-400/60 mt-1">Unique voter session keys</div>
              </div>

              <div className="bg-slate-950/50 backdrop-blur-md border border-emerald-950/40 rounded-2xl p-5 shadow-lg">
                <div className="flex justify-between items-start text-emerald-300 mb-3">
                  <span className="text-xs uppercase tracking-wider font-semibold">Questions Reached</span>
                  <Sliders className="w-4 h-4 text-[#10b981]" />
                </div>
                <div className="text-3xl font-black text-white font-mono">
                  {csvData.questionsAnswered} <span className="text-sm text-emerald-400/50 font-normal">/ {csvData.totalQuestions}</span>
                </div>
                <div className="text-xs text-emerald-400/60 mt-1">
                  {Math.round((csvData.questionsAnswered / csvData.totalQuestions) * 100)}% session coverage
                </div>
              </div>

              <div className="bg-slate-950/50 backdrop-blur-md border border-emerald-950/40 rounded-2xl p-5 shadow-lg">
                <div className="flex justify-between items-start text-emerald-300 mb-3">
                  <span className="text-xs uppercase tracking-wider font-semibold">Session Duration</span>
                  <Clock className="w-4 h-4 text-[#10b981]" />
                </div>
                <div className="text-3xl font-black text-white font-mono">{csvData.sessionDuration}</div>
                <div className="text-xs text-emerald-400/60 mt-1">First to last vote span</div>
              </div>
            </div>

            {/* Question Cards - Full Width */}
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-2">
                <h3 className="text-xl font-bold text-white font-baskerville">Question Breakdown</h3>
                
                {/* Toggle Mode */}
                <div className="bg-slate-950/80 p-0.5 rounded-lg border border-emerald-950/20 flex">
                  <button
                    onClick={() => setShowAsPercentage(false)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      !showAsPercentage ? "bg-[#10b981] text-white" : "text-emerald-350 hover:text-white"
                    }`}
                  >
                    Count
                  </button>
                  <button
                    onClick={() => setShowAsPercentage(true)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      showAsPercentage ? "bg-[#10b981] text-white" : "text-emerald-350 hover:text-white"
                    }`}
                  >
                    Percent
                  </button>
                </div>
              </div>

              {csvData.questions.map((question) => {
                const isMC = question.type === "MultipleChoice" || question.type === 0 || String(question.type).toLowerCase().includes("multiple");
                const totalVotesForQ = question.votes.length;

                // Find MC Winner
                let winnerIndex = -1;
                let maxCount = -1;
                if (isMC && question.options.length > 0) {
                  question.options.forEach(opt => {
                    const count = question.votes.filter(v => v.optionIndex === opt.index).length;
                    if (count > maxCount) {
                      maxCount = count;
                      winnerIndex = opt.index;
                    }
                  });
                }

                // Word Cloud Frequencies
                const wordCloudFrequencies = {};
                if (!isMC) {
                  question.votes.forEach(v => {
                    if (!v.submittedText) return;
                    const text = v.submittedText.trim();
                    wordCloudFrequencies[text] = (wordCloudFrequencies[text] || 0) + 1;
                  });
                }
                const sortedWordSubmissions = Object.entries(wordCloudFrequencies)
                  .sort((a, b) => b[1] - a[1]);

                const isQActive = activeQuestionId === question.index;

                return (
                  <div 
                    key={question.index}
                    id={`q-card-${question.index}`}
                    className={`bg-slate-950/50 backdrop-blur-md border rounded-2xl p-6 transition-all duration-300 ${
                      isQActive ? "border-[#10b981] shadow-lg shadow-[#10b981]/10" : "border-emerald-950/30"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-slate-900/60 border border-emerald-950/30 text-emerald-250 font-mono text-xs font-bold px-2.5 py-1 rounded-lg">
                          Q{question.index + 1}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400/60 bg-slate-900/40 px-2 py-0.5 rounded border border-emerald-950/20">
                          {isMC ? "Multiple Choice" : "Word Cloud"}
                        </span>
                      </div>
                      <span className="text-xs text-emerald-300 font-mono opacity-80">
                        {totalVotesForQ} respondent{totalVotesForQ !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-md font-bold text-white mb-6 leading-snug font-baskerville">
                      {question.text}
                    </h4>

                    {/* Display Data */}
                    {totalVotesForQ === 0 ? (
                      <div className="bg-slate-900/40 border border-emerald-950/20 p-4 rounded-xl text-center text-emerald-400/50 text-sm italic">
                        No responses received for this question.
                      </div>
                    ) : isMC ? (
                      <div className="w-full">
                        <div className="flex items-end justify-center gap-4 w-full border-b border-emerald-950/20 pb-0 pt-8 min-h-[180px]">
                          {question.options.map((opt, idx) => {
                            const count = question.votes.filter(v => v.optionIndex === opt.index).length;
                            const percentage = totalVotesForQ > 0 ? Math.round((count / totalVotesForQ) * 100) : 0;
                            
                            // Find max count for height scaling
                            const maxCount = Math.max(...question.options.map(o => question.votes.filter(v => v.optionIndex === o.index).length), 1);
                            const heightPercent = (count / maxCount) * 100;
                            const gradient = CHART_COLORS[idx % CHART_COLORS.length];
                            const isWinner = opt.index === winnerIndex && count > 0;

                            return (
                              <div key={opt.index} className="flex flex-col items-center flex-1 max-w-[100px] h-[150px] justify-end group/bar relative">
                                {/* Tooltip on hover */}
                                <div className="absolute bottom-full mb-1 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-slate-950 text-white text-[10px] font-mono px-2 py-0.5 rounded border border-slate-800 pointer-events-none whitespace-nowrap z-10">
                                  {count} vote{count !== 1 ? 's' : ''} ({percentage}%)
                                </div>

                                <div className="w-full flex flex-col items-center justify-end" style={count > 0 ? { height: `${Math.max(heightPercent, 16)}%` } : { height: '16%' }}>
                                  <span className="text-xs font-bold font-mono text-emerald-100 mb-1.5">{showAsPercentage ? `${percentage}%` : count}</span>
                                  <div 
                                    className={`w-full rounded-t border-t border-x ${isWinner ? 'border-[#10b981] shadow-lg shadow-[#10b981]/15' : 'border-white/10'} flex-1 transition-all duration-500`}
                                    style={{ background: gradient }} 
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Option labels row */}
                        <div className="flex justify-center gap-4 w-full mt-3">
                          {question.options.map((opt) => {
                            const count = question.votes.filter(v => v.optionIndex === opt.index).length;
                            const isWinner = opt.index === winnerIndex && count > 0;
                            return (
                              <div key={opt.index} className="flex-1 max-w-[100px] text-center">
                                <div className={`text-[10px] md:text-xs font-medium leading-tight line-clamp-2 px-0.5 ${isWinner ? 'text-[#10b981] font-bold' : 'text-emerald-300/60'}`} title={opt.text}>
                                  {opt.text}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <WordCloudChart wordSubmissions={sortedWordSubmissions} questionIndex={question.index} />
                        
                        {/* Word submissions frequencies list */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {sortedWordSubmissions.map(([word, freq]) => (
                            <span 
                              key={word} 
                              className="bg-slate-900/80 border border-emerald-950/30 hover:border-emerald-800 text-emerald-100 px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-2.5 transition-colors font-medium"
                            >
                              <span className="text-white font-bold">{word}</span>
                              <span className="bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] px-2 py-0.5 rounded-md text-[10px] font-mono font-bold">
                                {freq}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Engagement Funnel Graph */}
            <div className="bg-slate-950/50 backdrop-blur-md border border-emerald-950/40 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2 font-baskerville">
                <TrendingUp className="w-5 h-5 text-[#10b981]" />
                Participant Funnel Curve (Unique Voters)
              </h3>
              <p className="text-emerald-300/60 text-xs mb-6">
                Shows room attention level. Click on any bar to jump to the details card for that question.
              </p>
              
              <div className="space-y-3">
                {csvData.questions.filter(q => q.votes.length > 0).map((question) => {
                  const uniqueVotersCount = new Set(question.votes.map(v => v.sessionId)).size;
                  const percentOfTotal = csvData.uniqueParticipants > 0 
                    ? Math.round((uniqueVotersCount / csvData.uniqueParticipants) * 100) 
                    : 0;

                  return (
                    <div 
                      key={question.index}
                      onClick={() => scrollToQuestion(question.index)}
                      className="group flex items-center gap-3 cursor-pointer"
                    >
                      <span className="w-10 text-xs font-bold text-emerald-300 font-mono">Q{question.index + 1}</span>
                      <div className="flex-1 bg-slate-950/60 h-6 rounded-md overflow-hidden relative border border-emerald-950/20">
                        <div 
                          className="h-full bg-gradient-to-r from-[#10b981]/50 to-[#10b981] rounded-r-sm transition-all duration-500 group-hover:opacity-90"
                          style={{ width: `${percentOfTotal}%` }}
                        />
                        <span className="absolute inset-y-0 left-2 flex items-center text-[11px] font-medium text-emerald-100 truncate pr-4 max-w-full">
                          {question.text}
                        </span>
                      </div>
                      <span className="w-16 text-right text-xs font-bold font-mono text-white">
                        {uniqueVotersCount} <span className="text-emerald-400/50 font-normal">({percentOfTotal}%)</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
