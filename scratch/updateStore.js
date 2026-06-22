const fs = require('fs');
const file = 'd:/Gryphon/LivePollFullstack/Live-poll/lib/store/usePollStore.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add listeners in subscribeToPoll
const oldListeners = `      onPollEnded: () => {
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
    });`;

const newListeners = `      onPollEnded: () => {
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
      onBiddingStarted: (data) => {
        set((state) => {
          const base = state.currentPoll || {};
          return {
            currentPoll: {
              ...base,
              isBiddingActive: true,
              biddingClosed: false,
              skillCost: data.skillCost
            }
          };
        });
      },
      onBiddingClosed: () => {
        set((state) => {
          const base = state.currentPoll || {};
          return {
            currentPoll: {
              ...base,
              isBiddingActive: false,
              biddingClosed: true
            }
          };
        });
      },
      onReceiveBubbleData: (data) => {
        set({ bubbleCounts: data.counts || {} });
      },
      onParticipantSubmittedCountUpdate: (data) => {
        set({ committedCount: data.committedCount });
      },
    });`;

content = content.replace(oldListeners, newListeners);

// 2. Add new actions before the final closure "}));"
const simulateEndIndex = content.lastIndexOf('}));');
if (simulateEndIndex !== -1) {
  const biddingActions = `
  // ── Bidding State & Actions ──
  skills: [],
  biddingAnalytics: null,
  bubbleCounts: {},
  committedCount: 0,

  fetchSkills: async () => {
    try {
      const data = await api.getSkills();
      set({ skills: data || [] });
    } catch (err) {
      console.error("Error fetching skills:", err);
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

  startBidding: async (pollId) => {
    try {
      await api.startBidding(pollId);
      set((state) => {
        if (!state.currentPoll || state.currentPoll.id !== pollId) return state;
        return {
          currentPoll: {
            ...state.currentPoll,
            isBiddingActive: true,
            biddingClosed: false
          }
        };
      });
    } catch (err) {
      console.error("Error starting bidding:", err);
      throw err;
    }
  },

  stopBidding: async (pollId) => {
    try {
      await api.stopBidding(pollId);
      set((state) => {
        if (!state.currentPoll || state.currentPoll.id !== pollId) return state;
        return {
          currentPoll: {
            ...state.currentPoll,
            isBiddingActive: false,
            biddingClosed: true
          }
        };
      });
    } catch (err) {
      console.error("Error stopping bidding:", err);
      throw err;
    }
  },

  sendSelectionChange: async (pollId, sessionId, skillId, isSelected) => {
    try {
      await notifySelectionChange(pollId, sessionId, skillId, isSelected);
    } catch (err) {
      console.error("Error sending selection change:", err);
    }
  },

  lockInBids: async (pollId, sessionId, skillIds) => {
    try {
      await api.lockInBids(pollId, sessionId, skillIds);
    } catch (err) {
      console.error("Error locking in bids:", err);
      throw err;
    }
  },
`;
  content = content.slice(0, simulateEndIndex) + biddingActions + content.slice(simulateEndIndex);
}

fs.writeFileSync(file, content, 'utf8');
console.log("Successfully updated usePollStore.js!");
