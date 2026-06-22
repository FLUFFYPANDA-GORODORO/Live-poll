import * as signalR from "@microsoft/signalr";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");


let connection = null;
let connectionPromise = null;
let listeners = {};

/**
 * Wait for the SignalR connection to be established.
 * Returns the connection once it's ready.
 */
async function ensureConnected() {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    return connection;
  }
  if (connectionPromise) {
    return connectionPromise;
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${API_BASE}/hubs/poll`)
    .withAutomaticReconnect()
    .build();

  if (typeof window !== "undefined") {
    window.signalrConnection = connection;
  }

  // Log connection state changes
  connection.onreconnecting((err) => {
    console.warn("SignalR reconnecting:", err);
  });

  connection.onreconnected(() => {
    console.log("SignalR reconnected. Rejoining groups...");
    const groups = Object.keys(listeners);
    groups.forEach((pollId) => {
      connection.invoke("JoinPollGroup", pollId).catch(() => {});
    });
  });

  connection.onclose((err) => {
    console.warn("SignalR connection closed:", err?.message);
  });

  connectionPromise = connection
    .start()
    .then(() => {
      console.log("SignalR connected successfully");
      return connection;
    })
    .catch((err) => {
      console.error("SignalR connection failed:", err);
      connection = null;
      connectionPromise = null;
      throw err;
    });

  return connectionPromise;
}

/**
 * Subscribe to events for a specific poll.
 * @param {string} pollId
 * @param {object} handlers - { onPollUpdated, onVoteCountsUpdated, onPollEnded, onWordCloudUpdated }
 * @returns {function} unsubscribe function
 */
/**
 * Subscribe to events for a specific poll.
 * @param {string} pollId
 * @param {object} handlers - { onPollUpdated, onVoteCountsUpdated, onPollEnded, onWordCloudUpdated, onReceiveBubbleData, onBiddingStarted, onBiddingClosed, onParticipantSubmittedCountUpdate }
 * @returns {function} unsubscribe function
 */
export function subscribeToPoll(pollId, handlers) {
  // Track this subscription
  if (!listeners[pollId]) {
    listeners[pollId] = [];
  }

  const onPollUpdated = (data) => handlers.onPollUpdated?.(data);
  const onVoteCountsUpdated = (data) => handlers.onVoteCountsUpdated?.(data);
  const onPollEnded = (data) => handlers.onPollEnded?.(data);
  const onWordCloudUpdated = (data) => handlers.onWordCloudUpdated?.(data);
  const onReceiveBubbleData = (data) => handlers.onReceiveBubbleData?.(data);
  const onBiddingStarted = (data) => handlers.onBiddingStarted?.(data);
  const onBiddingClosed = (data) => handlers.onBiddingClosed?.(data);
  const onParticipantSubmittedCountUpdate = (data) => handlers.onParticipantSubmittedCountUpdate?.(data);

  // Connect and join group asynchronously
  ensureConnected()
    .then((conn) => {
      conn.on("PollUpdated", onPollUpdated);
      conn.on("VoteCountsUpdated", onVoteCountsUpdated);
      conn.on("PollEnded", onPollEnded);
      conn.on("WordCloudUpdated", onWordCloudUpdated);
      conn.on("ReceiveBubbleData", onReceiveBubbleData);
      conn.on("BiddingStarted", onBiddingStarted);
      conn.on("BiddingClosed", onBiddingClosed);
      conn.on("ParticipantSubmittedCountUpdate", onParticipantSubmittedCountUpdate);

      return conn.invoke("JoinPollGroup", pollId);
    })
    .catch((err) => {
      console.error("Failed to setup SignalR subscription:", err);
    });

  const entry = { 
    onPollUpdated, onVoteCountsUpdated, onPollEnded, onWordCloudUpdated,
    onReceiveBubbleData, onBiddingStarted, onBiddingClosed, onParticipantSubmittedCountUpdate 
  };
  listeners[pollId].push(entry);

  // Return unsubscribe function
  return () => {
    // Cleanup after connection is ready
    ensureConnected()
      .then((conn) => {
        conn.off("PollUpdated", onPollUpdated);
        conn.off("VoteCountsUpdated", onVoteCountsUpdated);
        conn.off("PollEnded", onPollEnded);
        conn.off("WordCloudUpdated", onWordCloudUpdated);
        conn.off("ReceiveBubbleData", onReceiveBubbleData);
        conn.off("BiddingStarted", onBiddingStarted);
        conn.off("BiddingClosed", onBiddingClosed);
        conn.off("ParticipantSubmittedCountUpdate", onParticipantSubmittedCountUpdate);

        listeners[pollId] = listeners[pollId].filter((l) => l !== entry);
        if (listeners[pollId].length === 0) {
          delete listeners[pollId];
          conn.invoke("LeavePollGroup", pollId).catch(() => {});
        }
      })
      .catch(() => {});
  };
}

/**
 * Subscribe to emoji updates for a specific poll as a presenter.
 * @param {string} pollId
 * @param {object} handlers - { onEmojiReceived }
 * @returns {function} unsubscribe function
 */
export function subscribeToPresenter(pollId, handlers) {
  const onEmojiReceived = (data) => handlers.onEmojiReceived?.(data);

  ensureConnected()
    .then((conn) => {
      conn.on("EmojiReceived", onEmojiReceived);
      return conn.invoke("JoinPresenterGroup", pollId);
    })
    .catch((err) => {
      console.error("Failed to setup SignalR presenter subscription:", err);
    });

  return () => {
    ensureConnected()
      .then((conn) => {
        conn.off("EmojiReceived", onEmojiReceived);
        conn.invoke("LeavePresenterGroup", pollId).catch(() => {});
      })
      .catch(() => {});
  };
}

/**
 * Send an emoji reaction to the presenter.
 * @param {string} pollId
 * @param {string} emoji
 */
export async function sendEmoji(pollId, emoji) {
  const conn = await ensureConnected();
  await conn.invoke("SendEmojiReaction", pollId, emoji);
}

/**
 * Send ephemeral selection update.
 */
export async function notifySelectionChange(pollId, sessionId, skillId, isSelected) {
  const conn = await ensureConnected();
  await conn.invoke("NotifySelectionChange", pollId, sessionId, parseInt(skillId), isSelected);
}

/**
 * Disconnect (cleanup on unmount if needed).
 */
export function disconnect() {
  if (connection) {
    connection.stop();
    connection = null;
    connectionPromise = null;
    listeners = {};
  }
}
