import { create } from "zustand";
import { api } from "@/lib/api";
import { subscribeToPoll, subscribeToPresenter, sendEmoji, sendBidChange } from "@/lib/pollHub";

/**
 * Normalize a poll from the .NET API shape to the shape components expect.
 * - status: "Draft" → "draft"
 * - createdAt: ISO string → Date object
 */
function normalizePoll(poll) {
  if (!poll) return poll;
  
  const normalizedQuestions = poll.questions?.map((q) => {
    let normalizedType = q.type;
    if (q.type === 1 || q.type === "1" || String(q.type).toLowerCase() === "wordcloud") {
      normalizedType = "WordCloud";
    } else if (q.type === 0 || q.type === "0" || String(q.type).toLowerCase() === "multiplechoice") {
      normalizedType = "MultipleChoice";
    }
    return {
      ...q,
      type: normalizedType,
    };
  });

  return {
    ...poll,
    status: poll.status?.toLowerCase() || "draft",
    createdAt: poll.createdAt ? new Date(poll.createdAt) : new Date(),
    updatedAt: poll.updatedAt ? new Date(poll.updatedAt) : new Date(),
    questions: normalizedQuestions || [],
    wordCloudCounts: poll.wordCloudCounts || {},
  };
}

export const usePollStore = create((set, get) => ({
  polls: [],
  currentPoll: null,
  loading: false,
  loadingCurrent: false,
  error: null,
  isSaving: false,
  isTransitioning: false,

  // ── Bidding State ──
  biddingPolls: [],
  currentBiddingPoll: null,
  loadingBiddingCurrent: false,
  biddingAnalytics: null,
  bubbleCounts: {},
  committedCount: 0,
  activeQuestionIndex: -1,
  currentCohort: "",
  userBids: {},

  // ── Fetch all polls created by a user ──
  fetchPolls: async (userId) => {
    if (!userId) return;
    set({ loading: true, error: null });
    try {
      const data = await api.getPolls(userId);
      const normalized = data.map(normalizePoll);
      normalized.sort((a, b) => b.createdAt - a.createdAt);
      set({ polls: normalized, loading: false });
    } catch (err) {
      console.error("Error fetching polls:", err);
      set({ error: "Failed to load polls", loading: false });
    }
  },

  // ── Fetch single poll by ID ──
  fetchPollById: async (pollId) => {
    if (!pollId) return null;
    set({ loadingCurrent: true, error: null });
    try {
      const data = await api.getPoll(pollId);
      const normalized = normalizePoll(data);
      set({ currentPoll: normalized, loadingCurrent: false });
      return normalized;
    } catch (err) {
      console.error("Error fetching poll by ID:", err);
      if (err.status === 404) {
        set({ error: "Poll not found", loadingCurrent: false });
      } else {
        set({ error: "Failed to fetch poll detail", loadingCurrent: false });
      }
      return null;
    }
  },

  // ── Subscribe to real-time updates via SignalR ──
  subscribeToPoll: (pollId) => {
    if (!pollId) return () => {};
    set({ loadingCurrent: true, error: null });

    // Step 1: Fetch the full poll data first
    api
      .getPoll(pollId)
      .then((data) => {
        set({ currentPoll: normalizePoll(data), loadingCurrent: false });
      })
      .catch((err) => {
        console.error("Error fetching poll for subscription:", err);
        set({ error: "Failed to sync poll updates", loadingCurrent: false });
      });

    // Step 2: Set up SignalR listeners for live updates
    const unsubscribe = subscribeToPoll(pollId, {
      onPollUpdated: (data) => {
        set((state) => {
          const base = state.currentPoll || {};
          return {
            currentPoll: normalizePoll({ ...base, ...data }),
            loadingCurrent: false,
            error: null,
          };
        });
      },
      onVoteCountsUpdated: (data) => {
        set((state) => {
          const base = state.currentPoll || {};
          return {
            currentPoll: normalizePoll({
              ...base,
              voteCounts: data.voteCounts,
            }),
          };
        });
      },
      onWordCloudUpdated: (data) => {
        set((state) => {
          const base = state.currentPoll || {};
          const currentWordCloudCounts = { ...base.wordCloudCounts };
          currentWordCloudCounts[data.questionIndex.toString()] = data.words;
          return {
            currentPoll: normalizePoll({
              ...base,
              wordCloudCounts: currentWordCloudCounts,
            }),
          };
        });
      },
      onPollEnded: () => {
        set((state) => {
          const base = state.currentPoll || {};
          return {
            currentPoll: normalizePoll({
              ...base,
              status: "ended",
              currentQuestionActive: false,
            }),
          };
        });
      },

      // ── Bidding SignalR Events ──
      onBiddingStarted: (data) => {
        set((state) => {
          const base = state.currentBiddingPoll || {};
          return {
            currentBiddingPoll: {
              ...base,
              isBiddingActive: true,
              biddingClosed: false,
              skillCost: data.skillCost,
            },
          };
        });
      },
      onBiddingClosed: () => {
        set((state) => {
          const base = state.currentBiddingPoll || {};
          return {
            currentBiddingPoll: {
              ...base,
              isBiddingActive: false,
              biddingClosed: true,
            },
          };
        });
      },
      onReceiveBubbleData: (data) => {
        set({ bubbleCounts: data.counts });
      },
      onParticipantSubmittedCountUpdate: (data) => {
        set({ committedCount: data.committedCount });
      },
    });

    return unsubscribe;
  },

  // ── Create a new poll (user info comes from JWT) ──
  createPoll: async (title, questions, theme = "default") => {
    set({ isSaving: true });
    try {
      const data = await api.createPoll({
        title: title.trim(),
        theme,
        questions: questions.map((q) => ({
          text: q.text.trim(),
          type: q.type || "MultipleChoice",
          options: q.options ? q.options.filter((opt) => opt.trim() !== "") : [],
        })),
      });

      set({ isSaving: false });
      return data.id;
    } catch (err) {
      console.error("Error creating poll:", err);
      set({ isSaving: false });
      throw err;
    }
  },

  // ── Save changes to an existing poll ──
  savePoll: async (pollId, title, questions, theme = "default") => {
    set({ isSaving: true });
    try {
      const data = await api.updatePoll(pollId, {
        title: title.trim(),
        theme,
        questions: questions.map((q) => ({
          text: q.text.trim(),
          type: q.type || "MultipleChoice",
          options: q.options
            ? q.options
                .filter((opt) =>
                  typeof opt === "string"
                    ? opt.trim() !== ""
                    : (opt.text || "").trim() !== "",
                )
                .map((o) =>
                  typeof o === "string" ? o.trim() : (o.text || "").trim(),
                )
            : [],
        })),
      });

      set((state) => ({
        isSaving: false,
        polls: state.polls.map((p) =>
          p.id === pollId ? normalizePoll(data) : p,
        ),
        currentPoll:
          state.currentPoll?.id === pollId
            ? normalizePoll(data)
            : state.currentPoll,
      }));
    } catch (err) {
      console.error("Error saving poll:", err);
      set({ isSaving: false });
      throw err;
    }
  },

  // ── Delete poll ──
  deletePoll: async (pollId) => {
    try {
      await api.deletePoll(pollId);

      set((state) => ({
        polls: state.polls.filter((p) => p.id !== pollId),
        currentPoll:
          state.currentPoll?.id === pollId ? null : state.currentPoll,
      }));
    } catch (err) {
      console.error("Error deleting poll:", err);
      throw err;
    }
  },

  // ── Restart poll ──
  restartPoll: async (pollId) => {
    try {
      await api.restartPoll(pollId);
      const data = await api.getPoll(pollId);
      const normalized = normalizePoll(data);

      set((state) => ({
        polls: state.polls.map((p) => (p.id === pollId ? normalized : p)),
        currentPoll:
          state.currentPoll?.id === pollId ? normalized : state.currentPoll,
      }));
    } catch (err) {
      console.error("Error restarting poll:", err);
      throw err;
    }
  },

  // ── Presenter actions ──
  startVoting: async (pollId, activeQuestionIndex) => {
    try {
      await api.startVoting(
        pollId,
        activeQuestionIndex >= 0 ? activeQuestionIndex : 0,
      );

      set((state) => {
        if (!state.currentPoll || state.currentPoll.id !== pollId) return state;
        return {
          currentPoll: normalizePoll({
            ...state.currentPoll,
            status: "live",
            activeQuestionIndex:
              activeQuestionIndex >= 0 ? activeQuestionIndex : 0,
            currentQuestionActive: true,
          }),
        };
      });
    } catch (err) {
      console.error("Error starting voting:", err);
      throw err;
    }
  },

  stopVoting: async (pollId) => {
    try {
      await api.stopVoting(pollId);

      set((state) => {
        if (!state.currentPoll || state.currentPoll.id !== pollId) return state;
        return {
          currentPoll: normalizePoll({
            ...state.currentPoll,
            currentQuestionActive: false,
          }),
        };
      });
    } catch (err) {
      console.error("Error stopping voting:", err);
      throw err;
    }
  },

  nextQuestion: async (pollId, activeQuestionIndex, totalQuestions) => {
    if (get().isTransitioning) return;
    try {
      const nextIndex = (activeQuestionIndex ?? 0) + 1;
      if (totalQuestions !== undefined && nextIndex > totalQuestions) return;

      set({ isTransitioning: true });

      await api.stopVoting(pollId);
      await api.nextQuestion(pollId);
      await api.startVoting(pollId, nextIndex);

      // Re-fetch the full poll so voteCounts for the new question are loaded
      const freshData = await api.getPoll(pollId);
      set((state) => {
        if (!state.currentPoll || state.currentPoll.id !== pollId) return state;
        return {
          currentPoll: normalizePoll({
            ...freshData,
            status: "live",
            activeQuestionIndex: nextIndex,
            currentQuestionActive: true,
          }),
        };
      });
    } catch (err) {
      console.error("Error going to next question:", err);
      throw err;
    } finally {
      set({ isTransitioning: false });
    }
  },

  prevQuestion: async (pollId, activeQuestionIndex) => {
    if (get().isTransitioning) return;
    try {
      if ((activeQuestionIndex ?? 0) <= 0) return;
      const prevIndex = (activeQuestionIndex ?? 0) - 1;

      set({ isTransitioning: true });

      await api.stopVoting(pollId);
      await api.prevQuestion(pollId);
      await api.startVoting(pollId, prevIndex);

      // Re-fetch the full poll so voteCounts for the previous question are loaded
      const freshData = await api.getPoll(pollId);
      set((state) => {
        if (!state.currentPoll || state.currentPoll.id !== pollId) return state;
        return {
          currentPoll: normalizePoll({
            ...freshData,
            status: "live",
            activeQuestionIndex: prevIndex,
            currentQuestionActive: true,
          }),
        };
      });
    } catch (err) {
      console.error("Error going to previous question:", err);
      throw err;
    } finally {
      set({ isTransitioning: false });
    }
  },

  endPoll: async (pollId) => {
    try {
      await api.endPoll(pollId);

      set((state) => {
        if (!state.currentPoll || state.currentPoll.id !== pollId) return state;
        return {
          currentPoll: normalizePoll({
            ...state.currentPoll,
            status: "ended",
            currentQuestionActive: false,
          }),
        };
      });
    } catch (err) {
      console.error("Error ending poll:", err);
      throw err;
    }
  },

  // ── Check if user already voted ──
  checkVoteStatus: async (pollId, activeQuestionIndex, sessionId) => {
    if (
      !pollId ||
      activeQuestionIndex === undefined ||
      activeQuestionIndex < 0 ||
      !sessionId
    )
      return null;
    try {
      const data = await api.checkVoteStatus(
        pollId,
        activeQuestionIndex,
        sessionId,
      );
      return data.optionIndex;
    } catch (err) {
      console.error("Error checking vote status:", err);
      return null;
    }
  },

  // ── Vote for option (transactional) ──
  voteForOption: async (
    pollId,
    activeQuestionIndex,
    votePayload,
    sessionId,
  ) => {
    try {
      const payload = {
        questionIndex: activeQuestionIndex,
        sessionId,
      };
      if (votePayload.type === "choice") {
        payload.optionIndex = votePayload.optionIndex;
      } else if (votePayload.type === "wordcloud") {
        payload.text = votePayload.text.trim();
      }
      await api.castVote(pollId, payload);
    } catch (err) {
      if (err.status === 409) {
        throw new Error("You have already voted on this question");
      }
      console.error("Error voting:", err);
      throw err;
    }
  },

  // ── Legacy vote ──
  voteForOptionLegacy: async (pollId, activeQuestionIndex, votePayload) => {
    try {
      const sessionId =
        typeof window !== "undefined"
          ? localStorage.getItem("sessionId") || "legacy_anonymous"
          : "legacy_anonymous";

      const payload = {
        questionIndex: activeQuestionIndex,
        sessionId,
      };
      if (votePayload.type === "choice") {
        payload.optionIndex = votePayload.optionIndex;
      } else if (votePayload.type === "wordcloud") {
        payload.text = votePayload.text.trim();
      }

      await api.castVote(pollId, payload);
    } catch (err) {
      if (err.status === 409) {
        throw new Error("You have already voted on this question");
      }
      console.error("Error voting (legacy):", err);
      throw err;
    }
  },

  // ── Presenter Emojis ──
  subscribeToPresenter: (pollId, onEmojiReceived) => {
    if (!pollId) return () => {};
    return subscribeToPresenter(pollId, {
      onEmojiReceived: (data) => {
        onEmojiReceived?.(data.emoji);
      },
    });
  },

  sendEmoji: async (pollId, emoji) => {
    try {
      await sendEmoji(pollId, emoji);
    } catch (err) {
      console.error("Error sending emoji:", err);
    }
  },

  // ── Word Cloud Simulation (dev/demo only) ──
  simulateWordCloud: (pollId, questionIndex) => {
    const buzzwords = [
      "AI", "Cloud", "Kubernetes", "NextJS", "React", "Zustand", "Agile", "DevOps", "SignalR",
      "Microservices", "Scalability", "Security", "Fast", "Interactive", "Realtime", "Poll",
      "Feedback", "Engagement", "Audience", "Presentation", "Gryphon", "Synergy", "Sphere",
      "Masterclass", "Speed", "Performance", "Clean Code", "Docker", "Database", "API"
    ];
    const counts = {};
    let remaining = 200;

    const topWordCounts = [55, 35, 20];
    topWordCounts.forEach((count, idx) => {
      counts[buzzwords[idx]] = count;
      remaining -= count;
    });

    const midWordCounts = [15, 12, 10, 8, 7];
    midWordCounts.forEach((count, idx) => {
      counts[buzzwords[idx + 3]] = count;
      remaining -= count;
    });

    let wordIdx = 8;
    while (remaining > 0 && wordIdx < buzzwords.length) {
      const count = Math.min(remaining, Math.floor(Math.random() * 2) + 1);
      counts[buzzwords[wordIdx]] = count;
      remaining -= count;
      wordIdx++;
    }

    if (remaining > 0) {
      counts[buzzwords[0]] += remaining;
    }

    set((state) => {
      if (!state.currentPoll || state.currentPoll.id !== pollId) return {};
      const currentWordCloudCounts = { ...state.currentPoll.wordCloudCounts };
      currentWordCloudCounts[questionIndex.toString()] = counts;
      return {
        currentPoll: {
          ...state.currentPoll,
          wordCloudCounts: currentWordCloudCounts,
        },
      };
    });
  },

  // ── Bidding Actions ──

  fetchBiddingPolls: async (userId) => {
    if (!userId) return;
    set({ loading: true, error: null });
    try {
      const data = await api.getBiddingPolls(userId);
      // Sort by creation time descending
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      set({ biddingPolls: data, loading: false });
    } catch (err) {
      console.error("Error fetching bidding polls:", err);
      set({ error: "Failed to load bidding sessions", loading: false });
    }
  },

  fetchBiddingPollById: async (pollId) => {
    if (!pollId) return null;
    set({ loadingBiddingCurrent: true, error: null });
    try {
      const data = await api.getBiddingPoll(pollId);
      set({
        currentBiddingPoll: data,
        activeQuestionIndex: data.activeQuestionIndex,
        currentCohort: data.currentCohort,
        loadingBiddingCurrent: false
      });
      return data;
    } catch (err) {
      console.error("Error fetching bidding poll by id:", err);
      set({ error: "Failed to load bidding session detail", loadingBiddingCurrent: false });
      return null;
    }
  },

  subscribeToBiddingPoll: (pollId, sessionId) => {
    if (!pollId) return () => {};
    set({ loadingBiddingCurrent: true, error: null });

    // Step 1: Fetch
    api
      .getBiddingPoll(pollId)
      .then((data) => {
        set({
          currentBiddingPoll: data,
          activeQuestionIndex: data.activeQuestionIndex,
          currentCohort: data.currentCohort,
          loadingBiddingCurrent: false
        });
      })
      .catch((err) => {
        console.error("Error syncing bidding poll:", err);
        set({ error: "Failed to sync bidding session", loadingBiddingCurrent: false });
      });

    // Step 2: SignalR Group
    const unsubscribe = subscribeToPoll(pollId, {
      onPollUpdated: (data) => {
        set((state) => {
          const base = state.currentBiddingPoll || {};
          return {
            currentBiddingPoll: { ...base, ...data },
            loadingBiddingCurrent: false,
            error: null,
          };
        });
      },
      onBiddingStarted: (data) => {
        set((state) => {
          const base = state.currentBiddingPoll || {};
          return {
            currentBiddingPoll: {
              ...base,
              isBiddingActive: true,
              biddingClosed: false,
              skillCost: data.skillCost,
            },
          };
        });
      },
      onBiddingClosed: () => {
        set((state) => {
          const base = state.currentBiddingPoll || {};
          return {
            currentBiddingPoll: {
              ...base,
              isBiddingActive: false,
              biddingClosed: true,
            },
          };
        });
      },
      onReceiveBubbleData: (data) => {
        set({ bubbleCounts: data.counts });
      },
      onParticipantSubmittedCountUpdate: (data) => {
        set({ committedCount: data.committedCount });
      },
      onQuestionActivated: (data) => {
        set((state) => {
          const base = state.currentBiddingPoll || {};
          return {
            activeQuestionIndex: data.questionIndex,
            currentCohort: data.cohort,
            // Reset stale data from the previous question
            bubbleCounts: {},
            committedCount: 0,
            currentBiddingPoll: {
              ...base,
              activeQuestionIndex: data.questionIndex,
              currentCohort: data.cohort,
              isBiddingActive: true,
              biddingClosed: false,
            },
          };
        });
      },
    }, sessionId);

    return unsubscribe;
  },

  createBiddingPoll: async (dataPayload) => {
    set({ isSaving: true });
    try {
      const data = await api.createBiddingPoll(dataPayload);
      set({ isSaving: false });
      return data.id;
    } catch (err) {
      console.error("Error creating bidding poll:", err);
      set({ isSaving: false });
      throw err;
    }
  },

  saveBiddingPoll: async (pollId, dataPayload) => {
    set({ isSaving: true });
    try {
      const data = await api.updateBiddingPoll(pollId, dataPayload);

      set((state) => ({
        isSaving: false,
        biddingPolls: state.biddingPolls.map((bp) =>
          bp.id === pollId ? data : bp
        ),
        currentBiddingPoll:
          state.currentBiddingPoll?.id === pollId ? data : state.currentBiddingPoll,
      }));
    } catch (err) {
      console.error("Error saving bidding poll:", err);
      set({ isSaving: false });
      throw err;
    }
  },

  deleteBiddingPoll: async (pollId) => {
    try {
      await api.deleteBiddingPoll(pollId);
      set((state) => ({
        biddingPolls: state.biddingPolls.filter((bp) => bp.id !== pollId),
        currentBiddingPoll:
          state.currentBiddingPoll?.id === pollId ? null : state.currentBiddingPoll,
      }));
    } catch (err) {
      console.error("Error deleting bidding poll:", err);
      throw err;
    }
  },

  restartBiddingPoll: async (pollId) => {
    try {
      await api.restartBiddingPoll(pollId);
      const data = await api.getBiddingPoll(pollId);
      set((state) => ({
        biddingPolls: state.biddingPolls.map((bp) => (bp.id === pollId ? data : bp)),
        currentBiddingPoll:
          state.currentBiddingPoll?.id === pollId ? data : state.currentBiddingPoll,
      }));
    } catch (err) {
      console.error("Error restarting bidding poll:", err);
      throw err;
    }
  },

  fetchBiddingAnalytics: async (pollId) => {
    try {
      const data = await api.getBiddingAnalytics(pollId);
      set({ biddingAnalytics: data });
    } catch (err) {
      console.error("Error fetching bidding analytics:", err);
    }
  },



  stopBidding: async (pollId) => {
    try {
      await api.stopBidding(pollId);
      set((state) => {
        if (!state.currentBiddingPoll || state.currentBiddingPoll.id !== pollId) return state;
        return {
          currentBiddingPoll: {
            ...state.currentBiddingPoll,
            isBiddingActive: false,
            biddingClosed: true,
          },
        };
      });
    } catch (err) {
      console.error("Error stopping bidding:", err);
      throw err;
    }
  },

  sendBidChange: async (pollId, questionIndex, sessionId, biddingSkillId, amount) => {
    try {
      await sendBidChange(pollId, questionIndex, sessionId, biddingSkillId, amount);
    } catch (err) {
      console.error("Error sending bid change:", err);
    }
  },

  placeBid: async (pollId, data) => {
    try {
      await api.placeBid(pollId, data);
    } catch (err) {
      console.error("Error placing bid:", err);
      throw err;
    }
  },

  cloneBiddingPoll: async (pollId) => {
    try {
      const data = await api.cloneBiddingPoll(pollId);
      set((state) => ({
        biddingPolls: [data, ...state.biddingPolls],
      }));
      return data;
    } catch (err) {
      console.error("Error cloning bidding poll:", err);
      throw err;
    }
  },

  startQuestion: async (pollId, questionIndex, cohort) => {
    try {
      await api.startQuestion(pollId, questionIndex, cohort);
      set((state) => ({
        activeQuestionIndex: questionIndex,
        currentCohort: cohort,
        currentBiddingPoll: state.currentBiddingPoll
          ? {
              ...state.currentBiddingPoll,
              activeQuestionIndex: questionIndex,
              currentCohort: cohort,
              isBiddingActive: true,
              biddingClosed: false,
            }
          : state.currentBiddingPoll,
      }));
    } catch (err) {
      console.error("Error starting question:", err);
      throw err;
    }
  },
}));