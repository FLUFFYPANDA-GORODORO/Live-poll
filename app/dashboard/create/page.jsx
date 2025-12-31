"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { PlusCircle, Trash2, Save, Type, Plus, ChevronLeft, AlertCircle } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";

const generatePollId = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

export default function CreatePoll() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([
    { text: "", options: ["", ""] },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get current user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addQuestion = () =>
    setQuestions([...questions, { text: "", options: ["", ""] }]);

  const addOption = (questionIndex) => {
    const copy = [...questions];
    copy[questionIndex].options.push("");
    setQuestions(copy);
  };

  const removeQuestion = (questionIndex) => {
    if (questions.length === 1) return;
    const copy = [...questions];
    copy.splice(questionIndex, 1);
    setQuestions(copy);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const copy = [...questions];
    if (copy[questionIndex].options.length > 2) {
      copy[questionIndex].options.splice(optionIndex, 1);
      setQuestions(copy);
    }
  };

  const createPoll = async () => {
    // Check if user is logged in
    if (!user) {
      alert("Please log in to create a poll");
      router.push("/login");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a poll title");
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        alert(`Please enter text for Question ${i + 1}`);
        return;
      }
      
      const validOptions = q.options.filter(opt => opt.trim() !== "");
      if (validOptions.length < 2) {
        alert(`Question ${i + 1} needs at least 2 valid options`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const pollId = generatePollId();

      // Log for debugging
      console.log("Creating poll with creator ID:", user.uid);
      console.log("User email:", user.email);
      console.log("User display name:", user.displayName);

      await setDoc(doc(db, "polls", pollId), {
        title: title.trim(),
        createdBy: user.uid, // This should be the logged-in user's ID
        createdByEmail: user.email, // Store email for reference
        createdByName: user.displayName || "Anonymous", // Store name
        status: "draft",
        activeQuestionIndex: -1,
        currentQuestionActive: false,
        questions: questions.map((q) => ({
          text: q.text.trim(),
          options: q.options
            .filter(opt => opt.trim() !== "")
            .map((o) => ({ 
              text: o.trim(), 
              votes: 0 
            })),
        })),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("Poll created successfully with ID:", pollId);
      
      // Redirect to share page with pollId in query params
      router.push(`/share?pollId=${pollId}`);
    } catch (error) {
      console.error("Error saving poll:", error);
      alert("Failed to save poll. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth required message
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-400 mb-6">
            You need to be logged in to create polls. Please sign in with Google to continue.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push("/login")}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-6 py-3 rounded-xl font-semibold"
            >
              Sign In with Google
            </button>
            <button
              onClick={() => router.push("/")}
              className="border border-gray-600 hover:border-gray-500 px-6 py-3 rounded-xl"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with User Info */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back to Dashboard
                </button>
                <div className="text-sm text-gray-500">
                  Creating as: <span className="text-indigo-400">{user.email}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={addQuestion}
                  className="flex items-center gap-2 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 px-4 py-2 rounded-xl border border-gray-700 transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="w-5 h-5 text-indigo-400" />
                  <span>Add Question</span>
                </button>
                
                <button
                  onClick={createPoll}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/25"
                >
                  <Save className="w-5 h-5" />
                  {isSaving ? "Saving..." : "Save Poll"}
                </button>
              </div>
            </div>
            
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Create Interactive Poll
              </h1>
              <p className="text-gray-400 mt-2">
                Poll will be created under your account: <span className="text-indigo-300">{user.email}</span>
              </p>
            </div>
          </div>

          {/* Poll Title */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <Type className="w-6 h-6 text-indigo-400" />
              <label className="text-lg font-semibold">Poll Title</label>
            </div>
            <input
              type="text"
              placeholder="Enter a compelling title for your poll..."
              className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Questions Section */}
          <div className="space-y-6">
            {questions.map((q, qi) => (
              <div key={qi} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center font-bold">
                      {qi + 1}
                    </div>
                    <h3 className="text-xl font-semibold">Question {qi + 1}</h3>
                  </div>
                  {questions.length > 1 && (
                    <button
                      onClick={() => removeQuestion(qi)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Question Input */}
                <div className="mb-6">
                  <label className="block text-gray-400 mb-3">Question Text</label>
                  <input
                    type="text"
                    placeholder="What would you like to ask?"
                    className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    value={q.text}
                    onChange={(e) => {
                      const copy = [...questions];
                      copy[qi].text = e.target.value;
                      setQuestions(copy);
                    }}
                  />
                </div>

                {/* Options Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-gray-400">Options</label>
                    <span className="text-sm text-gray-500">Minimum 2 options required</span>
                  </div>
                  <div className="space-y-3 mb-6">
                    {q.options.map((o, oi) => (
                      <div key={oi} className="flex items-center gap-3 group">
                        <div className="w-6 h-6 rounded-full border-2 border-gray-600 flex items-center justify-center text-xs">
                          {String.fromCharCode(65 + oi)}
                        </div>
                        <input
                          type="text"
                          placeholder={`Option ${oi + 1}`}
                          className="flex-1 bg-gray-900 border border-gray-600 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          value={o}
                          onChange={(e) => {
                            const copy = [...questions];
                            copy[qi].options[oi] = e.target.value;
                            setQuestions(copy);
                          }}
                        />
                        {q.options.length > 2 && (
                          <button
                            onClick={() => removeOption(qi, oi)}
                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Option Button */}
                  <button
                    onClick={() => addOption(qi)}
                    className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors p-3 hover:bg-indigo-400/10 rounded-xl w-full justify-center border border-dashed border-gray-600"
                  >
                    <PlusCircle className="w-5 h-5" />
                    Add Option
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Add Question Button */}
          <div className="flex justify-center mt-8">
            <button
              onClick={addQuestion}
              className="flex items-center gap-3 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 px-8 py-4 rounded-2xl border border-gray-700 transition-all hover:scale-105 active:scale-95 shadow-xl"
            >
              <Plus className="w-6 h-6 text-indigo-400" />
              <span className="text-lg font-semibold">Add Another Question</span>
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-12 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6">
            <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <PlusCircle className="w-5 h-5" />
              Tips for creating great polls
            </h4>
            <ul className="text-gray-400 space-y-2 list-disc pl-5">
              <li>Keep questions clear and concise</li>
              <li>Use 3-5 options for best engagement</li>
              <li>Add compelling titles to attract participants</li>
              <li>Questions will be saved as draft until published</li>
              <li>You can add unlimited questions and options</li>
              <li>After saving, you'll get a shareable link and QR code</li>
              <li className="text-indigo-400">Poll will be saved under your account: {user.email}</li>
            </ul>
          </div>

          {/* Mobile Action Buttons (Fixed at bottom for mobile) */}
          <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-4 px-4 md:hidden">
            <button
              onClick={addQuestion}
              className="flex items-center gap-2 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 px-6 py-3 rounded-full border border-gray-700 transition-all hover:scale-105 active:scale-95 shadow-xl flex-1 max-w-[160px] justify-center"
            >
              <Plus className="w-5 h-5 text-indigo-400" />
              <span>Add</span>
            </button>
            
            <button
              onClick={createPoll}
              disabled={isSaving}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed px-6 py-3 rounded-full font-semibold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-500/25 flex-1 max-w-[160px] justify-center"
            >
              <Save className="w-5 h-5" />
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}