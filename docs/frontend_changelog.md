# Frontend Integration Change Log

This change log outlines all API, DTO, and real-time SignalR modifications introduced in the last two backend commits:
1. **`ba96b0b`**: `feat: added theme field in poll.cs`
2. **`14f2cca`**: `feat: added word cloud and enhanced server tick rate system`

---

## 🎨 Commit 1: Poll Theme Support (`ba96b0b`)

Adds support for customizing the aesthetic theme of a poll.

### 1. DTO Changes

#### **Create Poll Request (`CreatePollRequest`)**
* **Property Added**: `theme` (string, optional)
* **Default**: `"default"`
```json
{
  "title": "My Interactive Poll",
  "theme": "sunset", // New field
  "questions": [...]
}
```

#### **Update Poll Request (`UpdatePollRequest`)**
* **Property Added**: `theme` (string, optional)
* **Default**: `"default"`
```json
{
  "title": "My Interactive Poll",
  "theme": "forest", // New field
  "questions": [...]
}
```

#### **Poll Response DTO (`PollResponse`)**
* **Property Added**: `theme` (string)
```json
{
  "id": "A1B2C3D4",
  "title": "My Interactive Poll",
  "theme": "sunset", // New field
  ...
}
```

---

## ☁️ Commit 2: Word Cloud & Tick Rate System (`14f2cca`)

Introduces the **Word Cloud** question type, background in-memory aggregation, and non-blocking real-time SignalR broadcast optimizations.

### 1. Question Schema & Types

#### **Question DTO / Response (`QuestionDto` / `QuestionResponse`)**
* **Property Added**: `type` (string)
* **Possible Values**: `"MultipleChoice"`, `"WordCloud"`
* **Default**: `"MultipleChoice"`

*Example Word Cloud Question creation request:*
```json
{
  "text": "Describe your mood in one word",
  "type": "WordCloud", // Set to WordCloud
  "options": []        // Keep empty for WordCloud questions
}
```

### 2. Casting Votes

#### **Vote Request (`VoteRequest`)**
* **Property Modified**: `optionIndex` is now **optional** (`int?`).
* **Property Added**: `text` (string, optional, max 200 characters). Raw text input for word clouds.

*Example - Voting on Multiple Choice:*
```json
{
  "questionIndex": 0,
  "optionIndex": 2, // Required for MultipleChoice
  "sessionId": "session_uuid_123"
}
```

*Example - Voting on Word Cloud:*
```json
{
  "questionIndex": 1,
  "sessionId": "session_uuid_123",
  "text": "Energetic!" // Required for WordCloud (Max 200 chars)
}
```

### 3. Fetching Poll Results

#### **Poll Response DTO (`PollResponse`)**
* **Property Added**: `wordCloudCounts` (Dictionary of objects)
  - Key: `questionIndex` (string)
  - Value: A dictionary of `word` (string) -> `count` (integer) containing the **Top 50** sanitized words.
  - Words with count >= 1 are tracked, and single-appearance words are naturally visible (making cold start/small audiences responsive). Common stop words (e.g., "the", "and", "is", etc.) are automatically stripped by the backend.

*Example Payload:*
```json
{
  "id": "A1B2C3D4",
  "questions": [
    { "index": 0, "text": "Who is best?", "type": "MultipleChoice", "options": [...] },
    { "index": 1, "text": "Describe your mood", "type": "WordCloud", "options": [] }
  ],
  "voteCounts": {
    "0_0": 15,
    "0_1": 8
  },
  "wordCloudCounts": {
    "1": {
      "happy": 12,
      "tired": 7,
      "excited": 4
    }
  }
}
```

### 4. Real-Time SignalR Broadcasts

#### **SignalR Updates for Word Cloud**
* **Method Broadcasted**: `"WordCloudUpdated"`
* **Broadcasting Cadence**: Batched every **0.25 seconds** (4 times per second) instead of real-time on every submission to save Wi-Fi bandwidth and prevent browser freeze.
* **Payload Format**:
```json
{
  "pollId": "A1B2C3D4",
  "questionIndex": 1,
  "words": {
    "happy": 12,
    "tired": 7,
    "excited": 4
  }
}
```

*Note: The standard MultipleChoice `"VoteCountsUpdated"` event is still broadcasted immediately upon vote submission.*
