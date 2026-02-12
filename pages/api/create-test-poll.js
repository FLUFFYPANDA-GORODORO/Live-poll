// pages/api/create-test-poll.js
// API route to create a test poll for load testing

import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const numQuestions = req.body?.numQuestions || 10;
  
  // Generate poll ID
  const pollId = `TEST${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  // Generate questions
  const questions = [];
  for (let i = 0; i < numQuestions; i++) {
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

  // Initialize vote counts map
  const voteCounts = {};
  questions.forEach((q, qIdx) => {
    q.options.forEach((_, optIdx) => {
      voteCounts[`${qIdx}_${optIdx}`] = 0;
    });
  });

  try {
    await setDoc(doc(db, "polls", pollId), {
      title: "Load Test Poll",
      createdBy: "load-test-api",
      createdByEmail: "test@loadtest.com",
      createdByName: "Load Test API",
      status: "live",
      activeQuestionIndex: 0,
      currentQuestionActive: true,
      questions: questions,
      voteCounts: voteCounts,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    res.status(200).json({ 
      success: true, 
      pollId: pollId,
      numQuestions: numQuestions,
      message: `Poll created! Run: node scripts/load-test-voting.js ${pollId}`
    });
  } catch (error) {
    console.error("Error creating test poll:", error);
    res.status(500).json({ error: error.message });
  }
}
