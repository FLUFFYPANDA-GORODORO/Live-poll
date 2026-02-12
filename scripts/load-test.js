/**
 * Load Test Script for Live-Poll Application
 * Simulates 50 concurrent users voting on a poll
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
  serverTimestamp,
  onSnapshot
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

// Configuration
const NUM_PARTICIPANTS = 50;
const NUM_QUESTIONS = 10;
const POLL_TITLE = "Load Test Poll";

// Metrics tracking
let metrics = {
  writes: 0,
  reads: 0,
  errors: 0,
  votesSuccessful: 0,
  startTime: null,
  endTime: null
};

// Generate unique poll ID
const generatePollId = () => 
  `TEST${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

// Generate test questions
function generateQuestions(count) {
  const questions = [];
  for (let i = 0; i < count; i++) {
    questions.push({
      text: `Test Question ${i + 1}`,
      options: [
        { text: "Option A" },
        { text: "Option B" },
        { text: "Option C" },
        { text: "Option D" }
      ]
    });
  }
  return questions;
}

// Initialize vote counts map
function initVoteCounts(questions) {
  const voteCounts = {};
  questions.forEach((q, qIdx) => {
    q.options.forEach((_, optIdx) => {
      voteCounts[`${qIdx}_${optIdx}`] = 0;
    });
  });
  return voteCounts;
}

// Create a test poll
async function createTestPoll(pollId, questions) {
  console.log(`\n📝 Creating test poll: ${pollId}`);
  
  const voteCounts = initVoteCounts(questions);
  
  await setDoc(doc(db, "polls", pollId), {
    title: POLL_TITLE,
    createdBy: "load-test-script",
    createdByEmail: "test@loadtest.com",
    createdByName: "Load Test",
    status: "live",
    activeQuestionIndex: 0,
    currentQuestionActive: true,
    questions: questions,
    voteCounts: voteCounts,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  metrics.writes++;
  console.log(`✅ Poll created successfully!\n`);
}

// Simulate a single participant voting
async function simulateParticipant(pollId, participantId, questionIndex) {
  const sessionId = `load_test_participant_${participantId}`;
  const optionIndex = Math.floor(Math.random() * 4); // Random option 0-3
  
  const voteRef = doc(db, "polls", pollId, "votes", `${sessionId}_${questionIndex}`);
  const pollRef = doc(db, "polls", pollId);
  
  try {
    // Check if already voted (read)
    const voteDoc = await getDoc(voteRef);
    metrics.reads++;
    
    if (voteDoc.exists()) {
      return { success: false, reason: "already_voted" };
    }
    
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

// Move to next question
async function moveToNextQuestion(pollId, questionIndex) {
  try {
    await updateDoc(doc(db, "polls", pollId), {
      activeQuestionIndex: questionIndex,
      currentQuestionActive: true
    });
    metrics.writes++;
  } catch (error) {
    console.error(`Error moving to question ${questionIndex}:`, error.message);
  }
}

// Print progress bar
function printProgress(current, total, label) {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round(percentage / 5);
  const empty = 20 - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  process.stdout.write(`\r${label}: [${bar}] ${percentage}% (${current}/${total})`);
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
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║     🚀 LIVE-POLL LOAD TEST - 50 CONCURRENT USERS          ║");
  console.log("╠═══════════════════════════════════════════════════════════╣");
  console.log(`║  Participants: ${NUM_PARTICIPANTS}                                        ║`);
  console.log(`║  Questions:    ${NUM_QUESTIONS}                                         ║`);
  console.log(`║  Total Votes:  ${NUM_PARTICIPANTS * NUM_QUESTIONS}                                       ║`);
  console.log("╚═══════════════════════════════════════════════════════════╝");
  
  const pollId = generatePollId();
  const questions = generateQuestions(NUM_QUESTIONS);
  
  metrics.startTime = Date.now();
  
  try {
    // Step 1: Create the poll
    await createTestPoll(pollId, questions);
    
    // Step 2: Simulate voting for each question
    for (let q = 0; q < NUM_QUESTIONS; q++) {
      console.log(`\n🗳️  Question ${q + 1}/${NUM_QUESTIONS}: "${questions[q].text}"`);
      console.log("─".repeat(50));
      
      // Move to this question
      await moveToNextQuestion(pollId, q);
      
      // Create all participant voting promises
      const votePromises = [];
      for (let p = 0; p < NUM_PARTICIPANTS; p++) {
        votePromises.push(simulateParticipant(pollId, p, q));
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
    
    // Step 3: End the poll
    await updateDoc(doc(db, "polls", pollId), {
      status: "ended",
      currentQuestionActive: false
    });
    metrics.writes++;
    
    metrics.endTime = Date.now();
    
    // Final Report
    console.log("\n╔═══════════════════════════════════════════════════════════╗");
    console.log("║                  📋 FINAL TEST REPORT                     ║");
    console.log("╠═══════════════════════════════════════════════════════════╣");
    console.log(`║  Poll ID:              ${pollId}                      ║`);
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
    
    console.log(`\n🔗 View results at: http://localhost:3000/dashboard/results/${pollId}\n`);
    
  } catch (error) {
    console.error("\n❌ Load test failed:", error);
  }
  
  // Exit after completion
  process.exit(0);
}

// Run the test
console.log("\n⏳ Starting load test in 3 seconds...\n");
setTimeout(runLoadTest, 3000);
