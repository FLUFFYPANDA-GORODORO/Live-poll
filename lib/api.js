const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Get the JWT token from localStorage.
 */
function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
}

async function request(method, path, body = null, auth = false) {
  const url = `${API_BASE}/api${path}`;
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const options = { method, headers };
  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const error = new Error(
      data.error || `Request failed with status ${res.status}`,
    );
    error.status = res.status;
    error.data = data;
    throw error;
  }

  if (res.status === 204) return null;

  return res.json();
}

export const api = {
  // ── Auth ──

  /** POST /api/auth/register */
  register: (data) => request("POST", "/auth/register", data),

  /** POST /api/auth/login */
  login: (data) => request("POST", "/auth/login", data),

  // ── Polls ──

  /** GET /api/polls?userId={userId} (public) */
  getPolls: (userId) =>
    request("GET", `/polls?userId=${encodeURIComponent(userId)}`),

  /** GET /api/polls/{pollId} (public) */
  getPoll: (pollId) => request("GET", `/polls/${encodeURIComponent(pollId)}`),

  /** POST /api/polls (requires auth) */
  createPoll: (data) => request("POST", "/polls", data, true),

  /** PUT /api/polls/{pollId} (requires auth) */
  updatePoll: (pollId, data) =>
    request("PUT", `/polls/${encodeURIComponent(pollId)}`, data, true),

  /** DELETE /api/polls/{pollId} (requires auth) */
  deletePoll: (pollId) =>
    request("DELETE", `/polls/${encodeURIComponent(pollId)}`, undefined, true),

  // ── Presenter Actions (requires auth) ──

  restartPoll: (pollId) =>
    request(
      "POST",
      `/polls/${encodeURIComponent(pollId)}/restart`,
      undefined,
      true,
    ),

  startVoting: (pollId, questionIndex) =>
    request(
      "POST",
      `/polls/${encodeURIComponent(pollId)}/start`,
      { questionIndex },
      true,
    ),

  stopVoting: (pollId) =>
    request(
      "POST",
      `/polls/${encodeURIComponent(pollId)}/stop`,
      undefined,
      true,
    ),

  nextQuestion: (pollId) =>
    request(
      "POST",
      `/polls/${encodeURIComponent(pollId)}/next`,
      undefined,
      true,
    ),

  prevQuestion: (pollId) =>
    request(
      "POST",
      `/polls/${encodeURIComponent(pollId)}/prev`,
      undefined,
      true,
    ),

  endPoll: (pollId) =>
    request(
      "POST",
      `/polls/${encodeURIComponent(pollId)}/end`,
      undefined,
      true,
    ),

  // ── Voting (public) ──

  checkVoteStatus: (pollId, questionIndex, sessionId) =>
    request(
      "GET",
      `/polls/${encodeURIComponent(pollId)}/votes/status?questionIndex=${questionIndex}&sessionId=${encodeURIComponent(sessionId)}`,
    ),

  castVote: (pollId, data) =>
    request("POST", `/polls/${encodeURIComponent(pollId)}/votes`, data),
};
