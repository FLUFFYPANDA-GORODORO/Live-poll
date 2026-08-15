const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");


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
    console.error(`[API Error ${res.status}] ${method} ${url}:`, data);
    let errMsg = data.error || data.title || `Request failed with status ${res.status}`;
    if (data.errors && typeof data.errors === "object") {
      const messages = Object.values(data.errors).flat().join(", ");
      if (messages) errMsg = messages;
    }
    const error = new Error(errMsg);
    error.status = res.status;
    error.data = data;
    
    if ((res.status === 401 || res.status === 403) && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("api-unauthorized", { detail: error }));
    }
    
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

  /** GET /api/polls?userId={userId} (requires auth) */
  getPolls: (userId) =>
    request("GET", `/polls?userId=${encodeURIComponent(userId)}`, null, true),

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

  deleteResponse: (pollId, questionIndex, responseId) =>
    request(
      "DELETE",
      `/polls/${encodeURIComponent(pollId)}/responses/${questionIndex}/${encodeURIComponent(responseId)}`,
      undefined,
      true,
    ),

  // ── Themes ──

  getThemes: (userId) =>
    request("GET", `/themes${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`),

  getTheme: (id) =>
    request("GET", `/themes/${encodeURIComponent(id)}`),

  getPalettes: () =>
    request("GET", "/themes/palettes"),

  createTheme: (userId, data) =>
    request("POST", `/themes?userId=${encodeURIComponent(userId)}`, data, true),

  updateTheme: (id, userId, data) =>
    request("PUT", `/themes/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`, data, true),

  deleteTheme: (id, userId) =>
    request("DELETE", `/themes/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`, undefined, true),

  // ── Templates ──

  getTemplates: (userId, category) => {
    const params = new URLSearchParams();
    if (userId) params.append("userId", userId);
    if (category) params.append("category", category);
    const query = params.toString();
    return request("GET", `/templates${query ? `?${query}` : ""}`);
  },

  useTemplate: (templateId, userId, userEmail, userName) => {
    const params = new URLSearchParams({ userId });
    if (userEmail) params.append("userEmail", userEmail);
    if (userName) params.append("userName", userName);
    return request("POST", `/templates/${encodeURIComponent(templateId)}/use?${params.toString()}`, null, true);
  },

  // ── Upload (Cloudinary) ──

  uploadImage: async (file, folder = "polls/images") => {
    const url = `${API_BASE}/api/upload/image${folder ? `?folder=${encodeURIComponent(folder)}` : ""}`;
    const formData = new FormData();
    formData.append("file", file);
    const headers = {};
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(url, { method: "POST", headers, body: formData });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Upload failed with status ${res.status}`);
    }
    return res.json();
  },

  uploadAudio: async (file, folder = "polls/audio") => {
    const url = `${API_BASE}/api/upload/audio${folder ? `?folder=${encodeURIComponent(folder)}` : ""}`;
    const formData = new FormData();
    formData.append("file", file);
    const headers = {};
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(url, { method: "POST", headers, body: formData });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Upload failed with status ${res.status}`);
    }
    return res.json();
  },
};
