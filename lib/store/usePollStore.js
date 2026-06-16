import { create } from "zustand";
import { api } from "@/lib/api";
import { subscribeToPoll } from "@/lib/pollHub";

/**
 * Normalize a poll from the .NET API shape to the shape components expect.
 * - status: "Draft" → "draft"
 * - createdAt: ISO string → Date object
 */
function normalizePoll(poll) {
  if (!poll) return poll;
  return {
    ...poll,
    status: poll.status?.toLowerCase() || "draft",
    createdAt: poll.createdAt ? new Date(poll.createdAt) : new Date(),
    updatedAt: poll.updatedAt ? new Date(poll.updatedAt) : new Date(),
  };
}

export const usePollStore = create((set, get) => ({
  polls: [],
  currentPoll: null,
  loading: false,
  loadingCurrent: false,
  error: null,
  isSaving: false,

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
          // Always apply vote count updates, even if currentPoll is null
          const base = state.currentPoll || {};
          return {
            currentPoll: normalizePoll({
              ...base,
              voteCounts: data.voteCounts,
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
    });

    return unsubscribe;
  },

  // ── Create a new poll (user info comes from JWT) ──
  createPoll: async (title, questions) => {
    set({ isSaving: true });
    try {
      const data = await api.createPoll({
        title: title.trim(),
        questions: questions.map((q) => ({
          text: q.text.trim(),
          options: q.options.filter((opt) => opt.trim() !== ""),
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
  savePoll: async (pollId, title, questions) => {
    set({ isSaving: true });
    try {
      const data = await api.updatePoll(pollId, {
        title: title.trim(),
        questions: questions.map((q) => ({
          text: q.text.trim(),
          options: q.options
            .filter((opt) =>
              typeof opt === "string"
                ? opt.trim() !== ""
                : (opt.text || "").trim() !== "",
            )
            .map((o) =>
              typeof o === "string" ? o.trim() : (o.text || "").trim(),
            ),
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

  nextQuestion: async (pollId, activeQuestionIndex) => {
    try {
      await api.nextQuestion(pollId);

      set((state) => {
        if (!state.currentPoll || state.currentPoll.id !== pollId) return state;
        return {
          currentPoll: normalizePoll({
            ...state.currentPoll,
            activeQuestionIndex:
              (activeQuestionIndex ?? state.currentPoll.activeQuestionIndex) +
              1,
            currentQuestionActive: false,
          }),
        };
      });
    } catch (err) {
      console.error("Error going to next question:", err);
      throw err;
    }
  },

  prevQuestion: async (pollId, activeQuestionIndex) => {
    try {
      await api.prevQuestion(pollId);

      set((state) => {
        if (!state.currentPoll || state.currentPoll.id !== pollId) return state;
        return {
          currentPoll: normalizePoll({
            ...state.currentPoll,
            activeQuestionIndex:
              (activeQuestionIndex ?? state.currentPoll.activeQuestionIndex) -
              1,
            currentQuestionActive: false,
          }),
        };
      });
    } catch (err) {
      console.error("Error going to previous question:", err);
      throw err;
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
    optionIndex,
    sessionId,
  ) => {
    try {
      await api.castVote(pollId, {
        questionIndex: activeQuestionIndex,
        optionIndex,
        sessionId,
      });
    } catch (err) {
      if (err.status === 409) {
        throw new Error("You have already voted on this question");
      }
      console.error("Error voting:", err);
      throw err;
    }
  },

  // ── Legacy vote ──
  voteForOptionLegacy: async (pollId, activeQuestionIndex, optionIndex) => {
    try {
      const sessionId =
        typeof window !== "undefined"
          ? sessionStorage.getItem("sessionId") || "legacy_anonymous"
          : "legacy_anonymous";

      await api.castVote(pollId, {
        questionIndex: activeQuestionIndex,
        optionIndex,
        sessionId,
      });
    } catch (err) {
      if (err.status === 409) {
        throw new Error("You have already voted on this question");
      }
      console.error("Error voting (legacy):", err);
      throw err;
    }
  },
}));
