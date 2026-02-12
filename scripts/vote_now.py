"""
Interactive Load Test - Votes on the CURRENT active question
Updates both vote documents AND voteCounts on poll

Usage: python scripts/vote_now.py POLL_ID
"""

import asyncio
import aiohttp
import random
import time
import sys
from datetime import datetime

PROJECT_ID = "live-pool-a6560"
FIRESTORE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"
NUM_PARTICIPANTS = 200


async def get_poll_data(session, poll_id):
    """Get poll data including active question and current vote counts"""
    url = f"{FIRESTORE_URL}/polls/{poll_id}"
    async with session.get(url) as resp:
        if resp.status == 200:
            data = await resp.json()
            fields = data.get("fields", {})
            active_idx = int(fields.get("activeQuestionIndex", {}).get("integerValue", "0"))
            is_active = fields.get("currentQuestionActive", {}).get("booleanValue", False)
            title = fields.get("title", {}).get("stringValue", "Poll")
            
            # Get current vote counts
            vote_counts = fields.get("voteCounts", {}).get("mapValue", {}).get("fields", {})
            
            questions = fields.get("questions", {}).get("arrayValue", {}).get("values", [])
            q_text = "Unknown"
            num_options = 4
            if active_idx < len(questions):
                q_fields = questions[active_idx].get("mapValue", {}).get("fields", {})
                q_text = q_fields.get("text", {}).get("stringValue", "Question")
                num_options = len(q_fields.get("options", {}).get("arrayValue", {}).get("values", []))
            
            return {
                "index": active_idx,
                "is_active": is_active,
                "text": q_text,
                "num_options": num_options,
                "title": title,
                "vote_counts": vote_counts
            }
    return None


async def update_vote_count(session, poll_id, question_idx, option_idx, current_counts):
    """Update the vote count on the poll document"""
    url = f"{FIRESTORE_URL}/polls/{poll_id}"
    
    # Get the key and current value
    key = f"{question_idx}_{option_idx}"
    current = int(current_counts.get(key, {}).get("integerValue", "0"))
    new_count = current + 1
    
    # Build the updated vote counts map
    updated_counts = dict(current_counts)
    updated_counts[key] = {"integerValue": str(new_count)}
    
    patch_data = {
        "fields": {
            "voteCounts": {
                "mapValue": {
                    "fields": updated_counts
                }
            }
        }
    }
    
    try:
        async with session.patch(
            f"{url}?updateMask.fieldPaths=voteCounts",
            json=patch_data,
            timeout=aiohttp.ClientTimeout(total=10)
        ) as resp:
            if resp.status == 200:
                # Update local copy for next vote
                current_counts[key] = {"integerValue": str(new_count)}
                return True
    except:
        pass
    return False


async def cast_vote(session, poll_id, participant_id, question_index, option_index):
    """Cast a single vote - create vote document"""
    session_id = f"live_p{participant_id}_{int(time.time()*1000)}_{random.randint(1000,9999)}"
    vote_doc_id = f"{session_id}_{question_index}"
    
    vote_url = f"{FIRESTORE_URL}/polls/{poll_id}/votes?documentId={vote_doc_id}"
    vote_data = {
        "fields": {
            "sessionId": {"stringValue": session_id},
            "questionIndex": {"integerValue": str(question_index)},
            "optionIndex": {"integerValue": str(option_index)},
            "timestamp": {"timestampValue": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"}
        }
    }
    
    try:
        async with session.post(vote_url, json=vote_data, timeout=aiohttp.ClientTimeout(total=30)) as resp:
            return resp.status == 200
    except:
        return False


async def run_voting(poll_id):
    print(f"\n🎯 Poll: {poll_id}")
    print("=" * 50)
    
    connector = aiohttp.TCPConnector(limit=100)
    async with aiohttp.ClientSession(connector=connector) as session:
        # Get poll data
        poll_data = await get_poll_data(session, poll_id)
        
        if not poll_data:
            print("❌ Could not fetch poll!")
            return
        
        if not poll_data["is_active"]:
            print("⚠️  Voting is NOT active! Start voting from presenter view first.")
            return
        
        q_idx = poll_data["index"]
        num_options = poll_data["num_options"]
        vote_counts = poll_data["vote_counts"]
        
        print(f"📋 Poll: {poll_data['title']}")
        print(f"🗳️  Question {q_idx + 1}: \"{poll_data['text']}\"")
        print(f"👥 Sending {NUM_PARTICIPANTS} votes NOW...")
        print("-" * 50)
        
        start = time.time()
        success = 0
        failed = 0
        dist = [0] * num_options
        
        # Process votes sequentially to properly update vote counts
        # (REST API doesn't support atomic increment, so we batch updates)
        batch_size = 10
        for batch_start in range(0, NUM_PARTICIPANTS, batch_size):
            batch_end = min(batch_start + batch_size, NUM_PARTICIPANTS)
            
            # Determine votes for this batch
            batch_votes = []
            for p in range(batch_start, batch_end):
                option = random.randint(0, num_options - 1)
                batch_votes.append((p, option))
            
            # Create vote documents concurrently
            tasks = [cast_vote(session, poll_id, p, q_idx, opt) for p, opt in batch_votes]
            results = await asyncio.gather(*tasks)
            
            # Count results for this batch
            for (p, opt), result in zip(batch_votes, results):
                if result:
                    success += 1
                    if opt < len(dist):
                        dist[opt] += 1
                else:
                    failed += 1
            
            # Update vote counts on poll document after each batch
            # Get fresh vote counts
            fresh_data = await get_poll_data(session, poll_id)
            if fresh_data:
                vote_counts = fresh_data["vote_counts"]
            
            # Update each option's count
            for opt in range(num_options):
                opt_key = f"{q_idx}_{opt}"
                current = int(vote_counts.get(opt_key, {}).get("integerValue", "0"))
                batch_count = sum(1 for _, o in batch_votes if o == opt and results[batch_votes.index((_, o))] if _ == _)
                
            print(f"   Batch {batch_start//batch_size + 1}: {sum(results)}/{len(results)} votes sent")
        
        # Final update: Get actual counts and update
        print("\n📊 Updating vote counts on poll...")
        
        # Count all successful votes per option
        fresh_data = await get_poll_data(session, poll_id)
        if fresh_data:
            current_counts = fresh_data["vote_counts"]
            
            # Add our votes to the counts
            new_counts = dict(current_counts)
            for opt_idx, count in enumerate(dist):
                key = f"{q_idx}_{opt_idx}"
                current = int(new_counts.get(key, {}).get("integerValue", "0"))
                new_counts[key] = {"integerValue": str(current + count)}
            
            # Update poll document
            url = f"{FIRESTORE_URL}/polls/{poll_id}?updateMask.fieldPaths=voteCounts"
            patch_data = {
                "fields": {
                    "voteCounts": {
                        "mapValue": {
                            "fields": new_counts
                        }
                    }
                }
            }
            
            async with session.patch(url, json=patch_data) as resp:
                if resp.status == 200:
                    print("✅ Vote counts updated!")
                else:
                    error = await resp.text()
                    print(f"❌ Failed to update counts: {resp.status}")
        
        end = time.time()
        
        print(f"\n✅ Success: {success} | ❌ Failed: {failed} | ⏱️  {(end-start)*1000:.0f}ms")
        opt_labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'][:num_options]
        dist_str = " ".join(f"{opt_labels[i]}:{dist[i]}" for i in range(num_options))
        print(f"📊 Votes: {dist_str}")
        print("=" * 50)
        print("🔄 Move to next question and run again!")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/vote_now.py POLL_ID")
        sys.exit(1)
    
    asyncio.run(run_voting(sys.argv[1]))
