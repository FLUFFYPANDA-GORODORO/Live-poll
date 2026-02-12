"""
FULL CONCURRENCY Load Test - All votes sent at once
"""

import asyncio
import aiohttp
import random
import time
import sys
from datetime import datetime

PROJECT_ID = "live-pool-a6560"
FIRESTORE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"
NUM_PARTICIPANTS = 2000


async def get_poll_data(session, poll_id):
    url = f"{FIRESTORE_URL}/polls/{poll_id}"
    async with session.get(url) as resp:
        if resp.status == 200:
            data = await resp.json()
            fields = data.get("fields", {})
            return {
                "index": int(fields.get("activeQuestionIndex", {}).get("integerValue", "0")),
                "is_active": fields.get("currentQuestionActive", {}).get("booleanValue", False),
                "text": fields.get("questions", {}).get("arrayValue", {}).get("values", [{}])[0].get("mapValue", {}).get("fields", {}).get("text", {}).get("stringValue", "Q"),
                "num_options": 3,
                "vote_counts": fields.get("voteCounts", {}).get("mapValue", {}).get("fields", {})
            }
    return None


async def cast_vote(session, poll_id, participant_id, question_index, option_index):
    session_id = f"full_{participant_id}_{int(time.time()*1000)}_{random.randint(1000,9999)}"
    vote_url = f"{FIRESTORE_URL}/polls/{poll_id}/votes?documentId={session_id}_{question_index}"
    vote_data = {
        "fields": {
            "sessionId": {"stringValue": session_id},
            "questionIndex": {"integerValue": str(question_index)},
            "optionIndex": {"integerValue": str(option_index)},
            "timestamp": {"timestampValue": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"}
        }
    }
    try:
        async with session.post(vote_url, json=vote_data, timeout=aiohttp.ClientTimeout(total=60)) as resp:
            return resp.status == 200, option_index
    except:
        return False, option_index


async def run_voting(poll_id):
    print(f"\n🚀 FULL CONCURRENCY TEST - {NUM_PARTICIPANTS} simultaneous votes")
    print("=" * 55)
    
    connector = aiohttp.TCPConnector(limit=500, force_close=True)
    async with aiohttp.ClientSession(connector=connector) as session:
        poll = await get_poll_data(session, poll_id)
        if not poll or not poll["is_active"]:
            print("❌ Poll not active!")
            return
        
        q_idx = poll["index"]
        print(f"🗳️  Question {q_idx + 1} | Sending {NUM_PARTICIPANTS} votes NOW...")
        
        # Pre-assign random options
        votes = [(p, random.randint(0, 1)) for p in range(NUM_PARTICIPANTS)]
        
        start = time.time()
        
        # ALL VOTES AT ONCE - TRUE CONCURRENCY
        tasks = [cast_vote(session, poll_id, p, q_idx, opt) for p, opt in votes]
        results = await asyncio.gather(*tasks)
        
        end = time.time()
        
        success = sum(1 for r, _ in results if r)
        dist = [0, 0, 0]
        for r, opt in results:
            if r and opt < 3:
                dist[opt] += 1
        
        print(f"\n⏱️  All {NUM_PARTICIPANTS} requests completed in {(end-start)*1000:.0f}ms")
        print(f"✅ Success: {success} | ❌ Failed: {NUM_PARTICIPANTS - success}")
        print(f"📊 Votes: A:{dist[0]} B:{dist[1]} C:{dist[2]}")
        
        # Single update to vote counts
        print("\n📊 Updating vote counts...")
        counts = poll["vote_counts"]
        new_counts = dict(counts)
        for i, c in enumerate(dist):
            key = f"{q_idx}_{i}"
            curr = int(new_counts.get(key, {}).get("integerValue", "0"))
            new_counts[key] = {"integerValue": str(curr + c)}
        
        url = f"{FIRESTORE_URL}/polls/{poll_id}?updateMask.fieldPaths=voteCounts"
        patch = {"fields": {"voteCounts": {"mapValue": {"fields": new_counts}}}}
        async with session.patch(url, json=patch) as resp:
            print("✅ Done!" if resp.status == 200 else f"❌ Update failed: {resp.status}")
        
        print("=" * 55)


if __name__ == "__main__":
    asyncio.run(run_voting(sys.argv[1] if len(sys.argv) > 1 else "08MQYC"))
