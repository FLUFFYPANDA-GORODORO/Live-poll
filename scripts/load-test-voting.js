/**
 * Load Test Script for Live-Poll Application
 * Simulates 50 concurrent users voting on a poll
 * 
 * This script uses the client SDK to test voting only.
 * You need to create a poll first via the dashboard.
 */

const { initializeApp } = require("firebase/app");
const { 
  getFirestore, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  runTransaction, 
  increment,
  serverTimestamp
} = require("firebase/firestore");

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAZMlGYIT6Ap3efcfYRy6qetcQljJr2Gag",
  authDomain: "live-pool-a6560.firebaseapp.com",
  projectId: "live-pool-a6560",
  storageBucket: "live-pool-a6560.firebasestorage.app",
  messagingSenderId: "618183549396",
  appId: "1:618183549396:web:5197dd17171f59b4a2f641"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Configuration - YOU NEED TO CREATE THIS POLL FIRST!
const POLL_ID = process.argv[2] || null;
const NUM_PARTICIPANTS = 50;

// Metrics tracking
let metrics = {
  writes: 0,
  reads: 0,
  errors: 0,
  votesSuccessful: 0,
  startTime: null,
  endTime: null
};

// Simulate a single participant voting
async function simulateParticipant(pollId, participantId, questionIndex) {
  const sessionId = `load_test_participant_${participantId}_${Date.now()}`;
  const optionIndex = Math.floor(Math.random() * 4); // Random option 0-3
  
  const voteRef = doc(db, "polls", pollId, "votes", `${sessionId}_${questionIndex}`);
  const pollRef = doc(db, "polls", pollId);
  
  try {
    // Vote using transaction
    await runTransaction(db, async (transaction) => {
      const checkDoc = await transaction.get(voteRef);
      metrics.reads++;
      
      if (checkDoc.exists()) {
        throw new Error("Already voted");
      }
      
      // Create vote document
      transaction.set(voteRef, {
        sessionId,
        questionIndex,
        optionIndex,
        timestamp: serverTimestamp()
      });
      metrics.writes++;
      
      // Update poll vote counts
      transaction.update(pollRef, {
        [`voteCounts.${questionIndex}_${optionIndex}`]: increment(1)
      });
      metrics.writes++;
    });
    
    metrics.votesSuccessful++;
    return { success: true, option: optionIndex };
    
  } catch (error) {
    metrics.errors++;
    return { success: false, reason: error.message };
  }
}

// Print live metrics
function printLiveMetrics() {
  console.log("\n┌─────────────────────────────────────────┐");
  console.log("│           📊 LIVE METRICS               │");
  console.log("├─────────────────────────────────────────┤");
  console.log(`│  📖 Total Reads:     ${String(metrics.reads).padStart(10)}      │`);
  console.log(`│  📝 Total Writes:    ${String(metrics.writes).padStart(10)}      │`);
  console.log(`│  ✅ Votes Success:   ${String(metrics.votesSuccessful).padStart(10)}      │`);
  console.log(`│  ❌ Errors:          ${String(metrics.errors).padStart(10)}      │`);
  console.log("└─────────────────────────────────────────┘");
}

// Main load test function
async function runLoadTest() {
  if (!POLL_ID) {
    console.log("\n❌ ERROR: Please provide a poll ID");
    console.log("   Usage: node scripts/load-test-voting.js <POLL_ID>");
    console.log("\n   Create a poll first at http://localhost:3000/dashboard/create");
    console.log("   Then run: node scripts/load-test-voting.js YOURPOLLID\n");
    process.exit(1);
  }

  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║     🚀 LIVE-POLL LOAD TEST - 50 CONCURRENT USERS          ║");
  console.log("╠═══════════════════════════════════════════════════════════╣");
  console.log(`║  Poll ID:      ${POLL_ID.padEnd(40)} ║`);
  console.log(`║  Participants: ${String(NUM_PARTICIPANTS).padEnd(40)} ║`);
  console.log("╚═══════════════════════════════════════════════════════════╝");
  
  metrics.startTime = Date.now();
  
  try {
    // Get poll data first
    console.log("\n📖 Fetching poll data...");
    const pollDoc = await getDoc(doc(db, "polls", POLL_ID));
    metrics.reads++;
    
    if (!pollDoc.exists()) {
      console.log("❌ Poll not found! Make sure you created the poll first.");
      process.exit(1);
    }
    
    const pollData = pollDoc.data();
    const questions = pollData.questions || [];
    const numQuestions = questions.length;
    
    console.log(`✅ Found poll: "${pollData.title}" with ${numQuestions} questions\n`);
    
    // Simulate voting for each question
    for (let q = 0; q < numQuestions; q++) {
      console.log(`\n🗳️  Question ${q + 1}/${numQuestions}: "${questions[q].text}"`);
      console.log("─".repeat(50));
      
      // Create all participant voting promises
      const votePromises = [];
      for (let p = 0; p < NUM_PARTICIPANTS; p++) {
        votePromises.push(simulateParticipant(POLL_ID, p, q));
      }
      
      // Execute all votes concurrently
      console.log(`   Executing ${NUM_PARTICIPANTS} concurrent votes...`);
      const startQ = Date.now();
      
      const results = await Promise.all(votePromises);
      
      const endQ = Date.now();
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      console.log(`   ✅ Successful: ${successCount} | ❌ Failed: ${failCount} | ⏱️  ${endQ - startQ}ms`);
      
      // Count votes per option
      const optionCounts = [0, 0, 0, 0];
      results.filter(r => r.success).forEach(r => {
        optionCounts[r.option]++;
      });
      console.log(`   📊 Vote Distribution: A:${optionCounts[0]} B:${optionCounts[1]} C:${optionCounts[2]} D:${optionCounts[3]}`);
      
      printLiveMetrics();
    }
    
    metrics.endTime = Date.now();
    
    // Final Report
    console.log("\n╔═══════════════════════════════════════════════════════════╗");
    console.log("║                  📋 FINAL TEST REPORT                     ║");
    console.log("╠═══════════════════════════════════════════════════════════╣");
    console.log(`║  Poll ID:              ${POLL_ID}                      ║`);
    console.log(`║  Duration:             ${((metrics.endTime - metrics.startTime) / 1000).toFixed(2)}s                          ║`);
    console.log("╠═══════════════════════════════════════════════════════════╣");
    console.log("║                    FIRESTORE METRICS                      ║");
    console.log("╠═══════════════════════════════════════════════════════════╣");
    console.log(`║  📖 Total Reads:       ${String(metrics.reads).padStart(6)}                           ║`);
    console.log(`║  📝 Total Writes:      ${String(metrics.writes).padStart(6)}                           ║`);
    console.log(`║  ✅ Successful Votes:  ${String(metrics.votesSuccessful).padStart(6)}                           ║`);
    console.log(`║  ❌ Errors:            ${String(metrics.errors).padStart(6)}                           ║`);
    console.log("╠═══════════════════════════════════════════════════════════╣");
    console.log("║                    CALCULATED TOTALS                      ║");
    console.log("╠═══════════════════════════════════════════════════════════╣");
    console.log(`║  Total Operations:     ${String(metrics.reads + metrics.writes).padStart(6)}                           ║`);
    console.log(`║  Votes/Second:         ${String((metrics.votesSuccessful / ((metrics.endTime - metrics.startTime) / 1000)).toFixed(1)).padStart(6)}                           ║`);
    console.log("╚═══════════════════════════════════════════════════════════╝");
    
    console.log(`\n🔗 View live results at: http://localhost:3000/present/${POLL_ID}\n`);
    
  } catch (error) {
    console.error("\n❌ Load test failed:", error);
  }
  
  // Exit after completion
  process.exit(0);
}

// Run the test
console.log("\n⏳ Starting load test in 2 seconds...\n");
setTimeout(runLoadTest, 2000);
