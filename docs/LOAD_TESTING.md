# Load Testing Documentation & Performance Scripts

This directory contains test automation scripts for evaluating real-time SignalR broadcasts and API endpoint performance under high concurrent user loads.

## Load Test Script (`scratch/perf_test_V0B2LF.js`)

A reusable dynamic performance testing tool that simulates high volume voter activity across all supported question types:
- **Multiple Choice** (Random option selection)
- **Word Cloud** (Randomized vocabulary words)
- **Ranking** (Permuted ranking arrays)
- **Open Ended** (Free text response cards)

It queries the backend API continuously to auto-detect the active question index on the presenter screen and formats vote payloads accordingly.

---

## Usage Instructions

Run the script using `node` from the `Live-poll` directory:

```bash
# Default (runs 500 votes on poll V0B2LF):
node scratch/perf_test_V0B2LF.js

# Target any poll ID with any vote count:
node scratch/perf_test_V0B2LF.js <POLL_ID> <TOTAL_VOTES>

# Example (1,000 votes on poll ABC123):
node scratch/perf_test_V0B2LF.js ABC123 1000
```

---

## Benchmark Results Reference (Sample Poll V0B2LF)

| Question Type | Submissions | Duration | Success Rate | Real-time Broadcast |
| :--- | :--- | :--- | :--- | :--- |
| **Question 1 (MCQ)** | 500 votes | ~33.9s | 100% (500/500) | Live bar updates |
| **Question 2 (Word Cloud)** | 500 votes | ~37.6s | 100% (500/500) | Live word cloud sizing |
| **Question 3 (Ranking)** | 500 votes | ~37.6s | 100% (500/500) | Live Borda score bars |
| **Question 4 (Open Ended)** | 500 votes | ~41.9s | 100% (500/500) | Live response card grid |
