/**
 * Reusable Performance Load Test Script for Live-Poll
 * 
 * Usage:
 *   node scratch/perf_test_V0B2LF.js [POLL_ID] [TOTAL_VOTES]
 * 
 * Example:
 *   node scratch/perf_test_V0B2LF.js V0B2LF 500
 */

const API_BASE = process.env.API_BASE || "http://localhost:5065";
const POLL_ID = process.argv[2] || "V0B2LF";
const TOTAL_VOTES = parseInt(process.argv[3] || "500", 10);

const sampleWords = [
  "Innovation", "Scalable", "Velocity", "Cloud", "Database", 
  "Realtime", "Dynamic", "Latency", "Efficiency", "Architecture", 
  "Performance", "Microservices", "Container", "Resilient", "Concurrency"
];

const sampleResponses = [
  "This poll platform works really fast and looks sleek!",
  "Great real-time response visualization on presenter mode.",
  "Love the dark mode aesthetic and animated vertical bars.",
  "The ranking drag-and-drop mechanism feels super intuitive.",
  "Word cloud updates almost instantaneously via SignalR sockets.",
  "Very high performance under heavy concurrent load!",
  "Clean user experience across mobile voter screen and desktop presenter.",
  "Excellent response handling and response deletion capabilities."
];

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function castVote(pollId, questionIndex, payload) {
  const sessionId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const body = {
    questionIndex,
    sessionId,
    ...payload
  };

  try {
    const res = await fetch(`${API_BASE}/api/polls/${pollId}/votes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error(`Status ${res.status}: ${txt}`);
    }
    return res.ok;
  } catch (err) {
    console.error(`Fetch error: ${err.message}`);
    return false;
  }
}

async function runPerformanceTest(pollId = POLL_ID, totalSubmissions = TOTAL_VOTES) {
  console.log(`🚀 Starting load test (${totalSubmissions} submissions) for Poll: ${pollId}`);
  console.log(`Targeting backend at ${API_BASE}`);

  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  // Fetch initial poll structure to know question counts and types
  let pollData = null;
  try {
    const pollRes = await fetch(`${API_BASE}/api/polls/${pollId}`);
    if (pollRes.ok) {
      pollData = await pollRes.json();
    }
  } catch (e) {
    console.error("❌ Failed to fetch poll structure:", e.message);
  }

  for (let i = 1; i <= totalSubmissions; i++) {
    let activeQIndex = 0;
    try {
      const pollRes = await fetch(`${API_BASE}/api/polls/${pollId}`);
      if (pollRes.ok) {
        const curData = await pollRes.json();
        activeQIndex = curData.activeQuestionIndex;
        pollData = curData;
      }
    } catch (e) {}

    const currentQuestion = pollData?.questions?.[activeQIndex] || { type: "MultipleChoice", options: [{},{},{},{}] };
    const qType = currentQuestion.type || "MultipleChoice";

    let resSuccess = false;
    if (qType === "MultipleChoice") {
      const optCount = currentQuestion.options?.length || 4;
      const mcqOpt = Math.floor(Math.random() * optCount);
      resSuccess = await castVote(pollId, activeQIndex, { optionIndex: mcqOpt });
    } else if (qType === "WordCloud") {
      const word = sampleWords[Math.floor(Math.random() * sampleWords.length)];
      resSuccess = await castVote(pollId, activeQIndex, { text: word });
    } else if (qType === "Ranking") {
      const optCount = currentQuestion.options?.length || 4;
      const order = Array.from({ length: optCount }, (_, idx) => idx);
      const rankingOrder = shuffleArray(order);
      resSuccess = await castVote(pollId, activeQIndex, { rankingOrder });
    } else if (qType === "OpenEnded") {
      const respText = sampleResponses[Math.floor(Math.random() * sampleResponses.length)];
      resSuccess = await castVote(pollId, activeQIndex, { text: respText });
    }

    if (resSuccess) {
      successCount++;
    } else {
      failCount++;
    }

    if (i % 25 === 0 || i === totalSubmissions) {
      console.log(`📊 [${i}/${totalSubmissions}] Sent vote to active Question #${activeQIndex + 1} (${qType}) (Success: ${successCount})`);
    }

    await new Promise(r => setTimeout(r, 25));
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n🎉 Completed ${totalSubmissions} votes in ${duration} seconds! Success: ${successCount}/${totalSubmissions}`);
}

runPerformanceTest();
