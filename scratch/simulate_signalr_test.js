/**
 * Word Cloud Real-Time Simulation Script
 * 
 * NOTE: Exposes and reuses the active WebSocket connection on the page 
 * (bypassing browser Content Security Policy (CSP) blocking external scripts).
 * 
 * Instructions:
 * 1. Open http://localhost:3000/poll/ORO2MV or http://localhost:3000/present/ORO2MV
 * 2. Open Developer Tools Console (F12).
 * 3. Paste this script and press Enter.
 */

const words = [
  "Innovation", "Scalable", "Velocity", "Cloud", "Database", 
  "Synchronous", "Realtime", "Dynamic", "Latency", "Efficiency", 
  "Framework", "Component", "Architecture", "Node", "Async", 
  "Thread", "Queue", "Responsive", "Performance", "Container"
];

const pollId = "ORO2MV";
// Note: questionIndex is 0-indexed. Adjust this if your Word Cloud question is at index 15.
const questionIndex = 15; 
const apiBase = "https://pollserver.sumedhsangle.space";

async function simulateSubmissions(totalSubmissions = 200) {
  const connection = window.signalrConnection;
  if (!connection) {
    console.error("❌ Active SignalR connection not found on window. Make sure you are on a live presenter or poll room page where the socket has connected.");
    return;
  }

  console.log("🔌 Reusing active window.signalrConnection...");

  // Register listener for word cloud updates
  const updateHandler = (data) => {
    console.log("⚡ [Socket Broadcast] WordCloudUpdated received:", data.words);
  };
  connection.on("WordCloudUpdated", updateHandler);

  console.log(`🚀 Starting simulation of ${totalSubmissions} submissions...`);
  
  for (let i = 0; i < totalSubmissions; i++) {
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const sessionId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    try {
      const response = await fetch(`${apiBase}/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionIndex: questionIndex,
          sessionId: sessionId,
          text: randomWord
        })
      });
      
      if (response.ok) {
        console.log(`✅ [${i+1}/${totalSubmissions}] Submitted: "${randomWord}"`);
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error(`❌ [${i+1}/${totalSubmissions}] Failed: ${response.status}`, errData);
      }
    } catch (error) {
      console.error(`❌ Error on submission ${i+1}:`, error);
    }
    
    // 100ms delay to prevent choking resources
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log("🏁 Simulation complete. Cleaning up listener...");
  connection.off("WordCloudUpdated", updateHandler);
  console.log("🔌 Listener cleaned up.");
}

simulateSubmissions(200);
