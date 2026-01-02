"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { PlusCircle, Trash2, Save, Type, Plus, ChevronLeft, AlertCircle, FileText, Check, Info, User } from "lucide-react";
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
      <div className="min-h-screen bg-eggshell text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-light-taupe border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-silver-pink">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth required message
  if (!user) {
    return (
      <div className="min-h-screen bg-eggshell text-foreground flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-light-taupe">Authentication Required</h1>
          <p className="text-silver-pink mb-6">
            You need to be logged in to create polls. Please sign in with Google to continue.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/login")}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-light-taupe to-silver-pink hover:from-[#9A7B6A] hover:to-[#B8A190] px-6 py-3 rounded-xl font-semibold text-eggshell transition-all hover:scale-105"
            >
              Sign In with Google
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex items-center justify-center gap-2 border border-light-taupe/30 hover:border-light-taupe px-6 py-3 rounded-xl text-light-taupe transition-colors hover:bg-white/50"
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
      <div className="min-h-screen bg-eggshell text-foreground p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with User Info */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div className="space-y-3">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="flex items-center gap-2 text-light-taupe hover:text-light-taupe/80 transition-colors group"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Back to Dashboard</span>
                </button>
                
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-light-taupe" />
                  <div className="text-sm text-silver-pink">
                    Creating as: <span className="text-light-taupe font-medium">{user.email}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={addQuestion}
                  className="flex items-center justify-center gap-2 border border-light-taupe/30 hover:border-light-taupe px-4 py-3 rounded-xl text-light-taupe transition-colors hover:bg-white/50"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Question</span>
                </button>
                
                <button
                  onClick={createPoll}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-light-taupe to-silver-pink hover:from-[#9A7B6A] hover:to-[#B8A190] disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold text-eggshell transition-all hover:scale-105 active:scale-95 shadow-lg"
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-eggshell border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save Poll</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-light-taupe to-silver-pink bg-clip-text text-transparent">
                Create Interactive Poll
              </h1>
              <p className="text-silver-pink mt-2">
                Poll will be created under your account
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-silver-pink/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-silver-pink">Questions</p>
                  <p className="text-xl font-bold text-light-taupe">{questions.length}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-light-taupe/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-light-taupe" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-silver-pink/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-silver-pink">Total Options</p>
                  <p className="text-xl font-bold text-light-taupe">
                    {questions.reduce((total, q) => total + q.options.length, 0)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-silver-pink/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-silver-pink" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-silver-pink/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-silver-pink">Status</p>
                  <p className="text-xl font-bold text-light-taupe">Draft</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Poll Title */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-5 md:p-6 mb-6 border border-silver-pink/30 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-light-taupe/20 flex items-center justify-center">
                <Type className="w-5 h-5 text-light-taupe" />
              </div>
              <div>
                <label className="text-lg font-semibold text-light-taupe">Poll Title</label>
                <p className="text-sm text-silver-pink">Give your poll a compelling title</p>
              </div>
            </div>
            <input
              type="text"
              placeholder="Enter a compelling title for your poll..."
              className="w-full bg-white/50 border border-silver-pink/30 rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-light-taupe focus:border-transparent transition-all placeholder:text-silver-pink"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Questions Section */}
          <div className="space-y-5">
            {questions.map((q, qi) => (
              <div key={qi} className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-5 md:p-6 border border-silver-pink/30 shadow-sm">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-light-taupe to-silver-pink flex items-center justify-center font-bold text-eggshell">
                      {qi + 1}
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold text-light-taupe">Question {qi + 1}</h3>
                      <p className="text-sm text-silver-pink">Add question text and options</p>
                    </div>
                  </div>
                  {questions.length > 1 && (
                    <button
                      onClick={() => removeQuestion(qi)}
                      className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors self-start md:self-center"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm">Remove</span>
                    </button>
                  )}
                </div>

                {/* Question Input */}
                <div className="mb-6">
                  <label className="block text-silver-pink mb-3 font-medium">Question Text</label>
                  <input
                    type="text"
                    placeholder="What would you like to ask?"
                    className="w-full bg-white/50 border border-silver-pink/30 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-light-taupe focus:border-transparent transition-all placeholder:text-silver-pink"
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
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
                    <label className="text-silver-pink font-medium">Options</label>
                    <span className="text-sm text-silver-pink">Minimum 2 options required</span>
                  </div>
                  <div className="space-y-3 mb-6">
                    {q.options.map((o, oi) => (
                      <div key={oi} className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-full border-2 border-light-taupe/30 flex items-center justify-center text-sm font-medium text-light-taupe flex-shrink-0">
                          {String.fromCharCode(65 + oi)}
                        </div>
                        <input
                          type="text"
                          placeholder={`Option ${oi + 1}`}
                          className="flex-1 bg-white/50 border border-silver-pink/30 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-light-taupe focus:border-transparent transition-all placeholder:text-silver-pink"
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
                            className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                            title="Remove option"
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
                    className="flex items-center justify-center gap-2 text-light-taupe hover:text-light-taupe/80 transition-colors p-3 hover:bg-white/50 rounded-xl w-full border border-dashed border-light-taupe/30"
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
              className="flex items-center gap-3 border border-light-taupe/30 hover:border-light-taupe px-6 py-4 rounded-xl text-light-taupe transition-colors hover:bg-white/50"
            >
              <Plus className="w-6 h-6" />
              <span className="text-lg font-semibold">Add Another Question</span>
            </button>
          </div>

          {/* Tips & Info Box */}
          <div className="mt-8 bg-gradient-to-r from-light-taupe/10 to-silver-pink/10 border border-light-taupe/20 rounded-xl md:rounded-2xl p-5 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-light-taupe/20 flex items-center justify-center">
                <Info className="w-5 h-5 text-light-taupe" />
              </div>
              <div>
                <h4 className="font-semibold text-lg text-light-taupe">Tips for creating great polls</h4>
                <p className="text-sm text-silver-pink">Best practices for engagement</p>
              </div>
            </div>
            <ul className="text-silver-pink space-y-3 list-none pl-0">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-light-taupe/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-light-taupe" />
                </div>
                <span>Keep questions clear and concise</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-light-taupe/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-light-taupe" />
                </div>
                <span>Use 3-5 options for best engagement</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-light-taupe/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-light-taupe" />
                </div>
                <span>Add compelling titles to attract participants</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-light-taupe/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-light-taupe" />
                </div>
                <span>Questions will be saved as draft until published</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-light-taupe/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-light-taupe" />
                </div>
                <span>You can add unlimited questions and options</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-light-taupe/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-light-taupe" />
                </div>
                <span>After saving, you'll get a shareable link and QR code</span>
              </li>
            </ul>
          </div>

          {/* Save Poll Button (Mobile) */}
          <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-10 md:hidden">
            <button
              onClick={createPoll}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-light-taupe to-silver-pink hover:from-[#9A7B6A] hover:to-[#B8A190] disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed px-8 py-4 rounded-full font-semibold text-eggshell transition-all hover:scale-105 active:scale-95 shadow-xl w-full max-w-md"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-eggshell border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Poll...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Poll</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}