import { create } from "zustand";
import { api } from "@/lib/api";
import { subscribeToPoll, subscribeToPresenter, sendEmoji } from "@/lib/pollHub";

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
    } else if (q.type === 2 || q.type === "2" || String(q.type).toLowerCase() === "openended") {
      normalizedType = "OpenEnded";
    } else if (q.type === 3 || q.type === "3" || String(q.type).toLowerCase() === "ranking") {
      normalizedType = "Ranking";
    } else if (q.type === 4 || q.type === "4" || String(q.type).toLowerCase() === "content") {
      normalizedType = "Content";
    } else if (q.type === 0 || q.type === "0" || String(q.type).toLowerCase() === "multiplechoice") {
      normalizedType = "MultipleChoice";
    }
    return {
      ...q,
      type: normalizedType,
      showResponseCount: q.showResponseCount !== undefined ? q.showResponseCount : (q.ShowResponseCount !== undefined ? q.ShowResponseCount : true),
      showPercentage: q.showPercentage !== undefined ? q.showPercentage : (q.ShowPercentage !== undefined ? q.ShowPercentage : false),
      allowReactions: q.allowReactions !== undefined ? q.allowReactions : (q.AllowReactions !== undefined ? q.AllowReactions : true),
    };
  });

  const normalizedOpenEnded = {};
  if (poll.openEndedResponses && typeof poll.openEndedResponses === "object") {
    Object.keys(poll.openEndedResponses).forEach((qKey) => {
      const arr = poll.openEndedResponses[qKey];
      if (Array.isArray(arr)) {
        normalizedOpenEnded[qKey] = arr.map((item) => ({
          id: item.responseId || item.id || item._id,
          responseId: item.responseId || item.id || item._id,
          text: item.text,
          submittedAt: item.submittedAt,
        }));
      }
    });
  }

  return {
    ...poll,
    status: poll.status?.toLowerCase() || "draft",
    createdAt: poll.createdAt ? new Date(poll.createdAt) : new Date(),
    updatedAt: poll.updatedAt ? new Date(poll.updatedAt) : new Date(),
    questions: normalizedQuestions || [],
    wordCloudCounts: poll.wordCloudCounts || {},
    rankingCounts: poll.rankingCounts || poll.rankingResults || {},
    openEndedResponses: normalizedOpenEnded,
  };
}

// Emoji Rate Limiting State
let emojiSentCount = 0;
let isRateLimited = false;
let rateLimitResetTimeout = null;
let windowStartTimestamp = 0;

export const usePollStore = create((set, get) => ({
  polls: [],
  currentPoll: null,
  loading: false,
  loadingCurrent: false,
  error: null,
  isSaving: false,
  isTransitioning: false,

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
      onRankingUpdated: (data) => {
        set((state) => {
          const base = state.currentPoll || {};
          const currentRankings = { ...base.rankingCounts };
          const rankingsData = data.rankings || data.rankingResults || {};
          currentRankings[data.questionIndex.toString()] = rankingsData;
          return {
            currentPoll: normalizePoll({
              ...base,
              rankingCounts: currentRankings,
            }),
          };
        });
      },
      onResponseAdded: (data) => {
        set((state) => {
          const base = state.currentPoll || {};
          const currentResponses = { ...base.openEndedResponses };
          const qKey = data.questionIndex.toString();
          const list = currentResponses[qKey] ? [...currentResponses[qKey]] : [];
          
          const itemsToAdd = data.newResponses || (data.response ? [data.response] : []);
          itemsToAdd.forEach((item) => {
            const normalizedItem = {
              id: item.responseId || item.id,
              text: item.text,
              submittedAt: item.submittedAt,
            };
            if (!list.some((r) => r.id === normalizedItem.id)) {
              list.push(normalizedItem);
            }
          });
          currentResponses[qKey] = list;
          return {
            currentPoll: normalizePoll({
              ...base,
              openEndedResponses: currentResponses,
            }),
          };
        });
      },
      onResponseDeleted: (data) => {
        set((state) => {
          const base = state.currentPoll || {};
          const currentResponses = { ...base.openEndedResponses };
          const qKey = data.questionIndex.toString();
          if (currentResponses[qKey]) {
            currentResponses[qKey] = currentResponses[qKey].filter(
              (r) => r.id !== data.responseId
            );
          }
          return {
            currentPoll: normalizePoll({
              ...base,
              openEndedResponses: currentResponses,
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

  themes: [],
  palettes: [],

  fetchThemes: async (userId) => {
    try {
      const data = await api.getThemes(userId);
      set({ themes: data });
    } catch (err) {
      console.error("Error fetching themes:", err);
    }
  },

  fetchPalettes: async () => {
    try {
      const data = await api.getPalettes();
      set({ palettes: data });
    } catch (err) {
      console.error("Error fetching palettes:", err);
    }
  },

  createTheme: async (userId, themeData) => {
    try {
      const newTheme = await api.createTheme(userId, themeData);
      set((state) => ({ themes: [...state.themes, newTheme] }));
      return newTheme;
    } catch (err) {
      console.error("Error creating theme:", err);
      throw err;
    }
  },

  updateTheme: async (id, userId, themeData) => {
    try {
      const updatedTheme = await api.updateTheme(id, userId, themeData);
      set((state) => ({
        themes: state.themes.map((t) => (t.id === id ? updatedTheme : t)),
      }));
      return updatedTheme;
    } catch (err) {
      console.error("Error updating theme:", err);
      throw err;
    }
  },

  deleteTheme: async (id, userId) => {
    try {
      await api.deleteTheme(id, userId);
      set((state) => ({
        themes: state.themes.filter((t) => t.id !== id),
      }));
    } catch (err) {
      console.error("Error deleting theme:", err);
      throw err;
    }
  },

  // ── Templates ──
  templates: [],

  fetchTemplates: async (userId) => {
    try {
      const data = await api.getTemplates(userId);
      set({ templates: Array.isArray(data) ? data : [] });
    } catch (err) {
      console.error("Error fetching templates:", err);
    }
  },

  useTemplate: async (templateId, userId, userEmail, userName) => {
    try {
      const result = await api.useTemplate(templateId, userId, userEmail, userName);
      return result;
    } catch (err) {
      console.error("Error using template:", err);
      throw err;
    }
  },

  // ── Create a new poll (user info comes from JWT) ──
  createPoll: async (title, questions, themeId = "11111111-1111-1111-1111-111111111111") => {
    set({ isSaving: true });
    try {
      const data = await api.createPoll({
        title: title.trim(),
        themeId: typeof themeId === "string" ? themeId : "11111111-1111-1111-1111-111111111111",
        questions: questions.map((q) => ({
          text: q.text.trim(),
          type: q.type || "MultipleChoice",
          visualization: q.visualization || null,
          imageUrl: q.imageUrl ? q.imageUrl.trim() : null,
          showResponseCount: q.showResponseCount !== undefined ? q.showResponseCount : true,
          showPercentage: q.showPercentage !== undefined ? q.showPercentage : false,
          allowReactions: q.allowReactions !== undefined ? q.allowReactions : true,
          options: q.options
            ? q.options
                .filter((opt) =>
                  typeof opt === "string"
                    ? opt.trim() !== ""
                    : (opt.text || "").trim() !== "",
                )
                .map((opt) => ({
                  text: typeof opt === "string" ? opt.trim() : (opt.text || "").trim(),
                  imageUrl: typeof opt === "object" && opt.imageUrl ? opt.imageUrl.trim() : null,
                }))
            : [],
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
  savePoll: async (pollId, title, questions, themeId = "11111111-1111-1111-1111-111111111111") => {
    set({ isSaving: true });
    try {
      const data = await api.updatePoll(pollId, {
        title: title.trim(),
        themeId: typeof themeId === "string" ? themeId : "11111111-1111-1111-1111-111111111111",
        questions: questions.map((q) => ({
          text: q.text.trim(),
          type: q.type || "MultipleChoice",
          visualization: q.visualization || null,
          imageUrl: q.imageUrl ? q.imageUrl.trim() : null,
          showResponseCount: q.showResponseCount !== undefined ? q.showResponseCount : true,
          showPercentage: q.showPercentage !== undefined ? q.showPercentage : false,
          allowReactions: q.allowReactions !== undefined ? q.allowReactions : true,
          options: q.options
            ? q.options
                .filter((opt) =>
                  typeof opt === "string"
                    ? opt.trim() !== ""
                    : (opt.text || "").trim() !== "",
                )
                .map((opt) => ({
                  text: typeof opt === "string" ? opt.trim() : (opt.text || "").trim(),
                  imageUrl: typeof opt === "object" && opt.imageUrl ? opt.imageUrl.trim() : null,
                }))
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

  prevQuestion: async (pollId, activeQuestionIndex, isIu = false) => {
    if (get().isTransitioning) return;
    try {
      const minIndex = isIu ? -1 : 0;
      if ((activeQuestionIndex ?? 0) <= minIndex) return;
      const prevIndex = (activeQuestionIndex ?? 0) - 1;

      set({ isTransitioning: true });

      await api.stopVoting(pollId);
      await api.prevQuestion(pollId);
      if (prevIndex >= 0) {
        await api.startVoting(pollId, prevIndex);
      }

      // Re-fetch the full poll so voteCounts for the previous question are loaded
      const freshData = await api.getPoll(pollId);
      set((state) => {
        if (!state.currentPoll || state.currentPoll.id !== pollId) return state;
        return {
          currentPoll: normalizePoll({
            ...freshData,
            status: "live",
            activeQuestionIndex: prevIndex,
            currentQuestionActive: prevIndex >= 0,
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
      } else if ((votePayload.type === "wordcloud" || votePayload.type === "openended") && typeof votePayload.text === "string") {
        payload.text = votePayload.text.trim();
      } else if (votePayload.type === "ranking") {
        payload.rankingOrder = votePayload.rankingOrder;
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

  deleteResponse: async (pollId, questionIndex, responseId) => {
    try {
      if (!responseId) return;
      await api.deleteResponse(pollId, questionIndex, responseId);
      set((state) => {
        const base = state.currentPoll || {};
        const currentResponses = { ...base.openEndedResponses };
        const qKey = questionIndex.toString();
        if (currentResponses[qKey]) {
          currentResponses[qKey] = currentResponses[qKey].filter(
            (r) => (r.responseId || r.id) !== responseId
          );
        }
        return {
          currentPoll: normalizePoll({
            ...base,
            openEndedResponses: currentResponses,
          }),
        };
      });
    } catch (err) {
      console.error("Error deleting response:", err);
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
    const now = Date.now();
    
    // If currently rate limited, return silently (no-op to prevent backend spam)
    if (isRateLimited) {
      return;
    }

    // Reset the count if more than 10 seconds have elapsed since the first emoji in the active window
    if (now - windowStartTimestamp > 10000) {
      emojiSentCount = 0;
      windowStartTimestamp = now;
    }

    emojiSentCount++;

    // Trigger rate limiting once 5 emojis have been sent in the current window
    if (emojiSentCount >= 5) {
      isRateLimited = true;
      if (rateLimitResetTimeout) {
        clearTimeout(rateLimitResetTimeout);
      }
      rateLimitResetTimeout = setTimeout(() => {
        isRateLimited = false;
        emojiSentCount = 0;
        windowStartTimestamp = 0;
      }, 10000); // 10 seconds block duration
    }

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
}));