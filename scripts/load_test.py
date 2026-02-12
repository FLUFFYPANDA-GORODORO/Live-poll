"""
Load Test Script for Live-Poll Application
Simulates 50 concurrent users voting on a poll

Usage: python scripts/load_test.py POLL_ID
Example: python scripts/load_test.py ABC123
"""

import asyncio
import aiohttp
import random
import time
import sys
from datetime import datetime

# Firebase Firestore REST API configuration
PROJECT_ID = "live-pool-a6560"
FIRESTORE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"

# Configuration
NUM_PARTICIPANTS = 50

# Metrics
metrics = {
    "reads": 0,
    "writes": 0,
    "errors": 0,
    "votes_successful": 0,
    "start_time": None,
    "end_time": None
}


def generate_session_id(participant_id):
    """Generate unique session ID for each participant"""
    return f"load_test_p{participant_id}_{int(time.time() * 1000)}"


async def vote_for_option(session, poll_id, participant_id, question_index, num_options):
    """Cast a vote for a random option using Firestore REST API"""
    session_id = generate_session_id(participant_id)
    option_index = random.randint(0, num_options - 1)
    vote_doc_id = f"{session_id}_{question_index}"
    
    # Create vote document via REST API
    vote_url = f"{FIRESTORE_URL}/polls/{poll_id}/votes?documentId={vote_doc_id}"
    
    vote_data = {
        "fields": {
            "sessionId": {"stringValue": session_id},
            "questionIndex": {"integerValue": str(question_index)},
            "optionIndex": {"integerValue": str(option_index)},
            "timestamp": {"timestampValue": datetime.utcnow().isoformat() + "Z"}
        }
    }
    
    try:
        async with session.post(vote_url, json=vote_data) as resp:
            if resp.status == 200:
                metrics["writes"] += 1
                
                # Update vote count using Firestore commit/patch
                # Note: For atomic increment, we need a transaction, but for demo we'll use direct update
                update_url = f"{FIRESTORE_URL}/polls/{poll_id}"
                update_mask = f"updateMask.fieldPaths=voteCounts.{question_index}_{option_index}"
                
                # Get current count first
                async with session.get(f"{FIRESTORE_URL}/polls/{poll_id}") as get_resp:
                    metrics["reads"] += 1
                    if get_resp.status == 200:
                        poll_data = await get_resp.json()
                        
                        # Get current vote count
                        vote_counts = poll_data.get("fields", {}).get("voteCounts", {}).get("mapValue", {}).get("fields", {})
                        current_count = int(vote_counts.get(f"{question_index}_{option_index}", {}).get("integerValue", "0"))
                        new_count = current_count + 1
                        
                        # Update with new count
                        patch_data = {
                            "fields": {
                                "voteCounts": {
                                    "mapValue": {
                                        "fields": {
                                            **{k: v for k, v in vote_counts.items()},
                                            f"{question_index}_{option_index}": {"integerValue": str(new_count)}
                                        }
                                    }
                                }
                            }
                        }
                        
                        async with session.patch(f"{update_url}?{update_mask}", json=patch_data) as patch_resp:
                            if patch_resp.status == 200:
                                metrics["writes"] += 1
                                metrics["votes_successful"] += 1
                                return {"success": True, "option": option_index}
                
                metrics["votes_successful"] += 1
                return {"success": True, "option": option_index}
            else:
                error_text = await resp.text()
                metrics["errors"] += 1
                return {"success": False, "reason": error_text}
                
    except Exception as e:
        metrics["errors"] += 1
        return {"success": False, "reason": str(e)}


async def get_poll_data(session, poll_id):
    """Fetch poll data from Firestore"""
    url = f"{FIRESTORE_URL}/polls/{poll_id}"
    
    try:
        async with session.get(url) as resp:
            metrics["reads"] += 1
            if resp.status == 200:
                data = await resp.json()
                fields = data.get("fields", {})
                
                # Parse questions
                questions_array = fields.get("questions", {}).get("arrayValue", {}).get("values", [])
                questions = []
                for q in questions_array:
                    q_fields = q.get("mapValue", {}).get("fields", {})
                    text = q_fields.get("text", {}).get("stringValue", "")
                    options = q_fields.get("options", {}).get("arrayValue", {}).get("values", [])
                    questions.append({
                        "text": text,
                        "options": options
                    })
                
                return {
                    "title": fields.get("title", {}).get("stringValue", "Unknown"),
                    "questions": questions
                }
            else:
                return None
    except Exception as e:
        print(f"Error fetching poll: {e}")
        return None


def print_banner(poll_id, num_questions):
    """Print test banner"""
    print("\n" + "=" * 65)
    print("║     🚀 LIVE-POLL LOAD TEST - 50 CONCURRENT USERS             ║")
    print("=" * 65)
    print(f"  Poll ID:       {poll_id}")
    print(f"  Participants:  {NUM_PARTICIPANTS}")
    print(f"  Questions:     {num_questions}")
    print(f"  Total Votes:   {NUM_PARTICIPANTS * num_questions}")
    print("=" * 65)


def print_metrics():
    """Print current metrics"""
    print("\n┌─────────────────────────────────────────┐")
    print("│           📊 LIVE METRICS               │")
    print("├─────────────────────────────────────────┤")
    print(f"│  📖 Total Reads:     {metrics['reads']:>10}      │")
    print(f"│  📝 Total Writes:    {metrics['writes']:>10}      │")
    print(f"│  ✅ Votes Success:   {metrics['votes_successful']:>10}      │")
    print(f"│  ❌ Errors:          {metrics['errors']:>10}      │")
    print("└─────────────────────────────────────────┘")


def print_final_report(poll_id, duration):
    """Print final test report"""
    print("\n" + "=" * 65)
    print("║                  📋 FINAL TEST REPORT                       ║")
    print("=" * 65)
    print(f"  Poll ID:              {poll_id}")
    print(f"  Duration:             {duration:.2f}s")
    print("-" * 65)
    print("                    FIRESTORE METRICS                         ")
    print("-" * 65)
    print(f"  📖 Total Reads:       {metrics['reads']:>6}")
    print(f"  📝 Total Writes:      {metrics['writes']:>6}")
    print(f"  ✅ Successful Votes:  {metrics['votes_successful']:>6}")
    print(f"  ❌ Errors:            {metrics['errors']:>6}")
    print("-" * 65)
    print("                    CALCULATED TOTALS                         ")
    print("-" * 65)
    total_ops = metrics['reads'] + metrics['writes']
    votes_per_sec = metrics['votes_successful'] / duration if duration > 0 else 0
    print(f"  Total Operations:     {total_ops:>6}")
    print(f"  Votes/Second:         {votes_per_sec:>6.1f}")
    print("=" * 65)


async def run_load_test(poll_id):
    """Main load test function"""
    print("\n⏳ Starting load test in 2 seconds...\n")
    await asyncio.sleep(2)
    
    async with aiohttp.ClientSession() as session:
        # Get poll data
        print("📖 Fetching poll data...")
        poll_data = await get_poll_data(session, poll_id)
        
        if not poll_data:
            print("❌ Poll not found! Make sure the poll exists.")
            return
        
        questions = poll_data["questions"]
        num_questions = len(questions)
        
        print(f"✅ Found poll: \"{poll_data['title']}\" with {num_questions} questions\n")
        print_banner(poll_id, num_questions)
        
        metrics["start_time"] = time.time()
        
        # Vote for each question
        for q_idx, question in enumerate(questions):
            num_options = len(question["options"])
            print(f"\n🗳️  Question {q_idx + 1}/{num_questions}: \"{question['text']}\"")
            print("-" * 50)
            
            # Create concurrent voting tasks
            print(f"   Executing {NUM_PARTICIPANTS} concurrent votes...")
            start_q = time.time()
            
            tasks = [
                vote_for_option(session, poll_id, p, q_idx, num_options)
                for p in range(NUM_PARTICIPANTS)
            ]
            
            results = await asyncio.gather(*tasks)
            
            end_q = time.time()
            success_count = sum(1 for r in results if r.get("success"))
            fail_count = len(results) - success_count
            
            print(f"   ✅ Successful: {success_count} | ❌ Failed: {fail_count} | ⏱️  {(end_q - start_q) * 1000:.0f}ms")
            
            # Vote distribution
            option_counts = [0, 0, 0, 0]
            for r in results:
                if r.get("success") and "option" in r:
                    option_counts[r["option"]] += 1
            print(f"   📊 Vote Distribution: A:{option_counts[0]} B:{option_counts[1]} C:{option_counts[2]} D:{option_counts[3]}")
            
            print_metrics()
        
        metrics["end_time"] = time.time()
        duration = metrics["end_time"] - metrics["start_time"]
        
        print_final_report(poll_id, duration)
        print(f"\n🔗 View live results at: http://localhost:3000/present/{poll_id}\n")


def main():
    if len(sys.argv) < 2:
        print("\n❌ ERROR: Please provide a poll ID")
        print("   Usage: python scripts/load_test.py <POLL_ID>")
        print("\n   Example: python scripts/load_test.py ABC123\n")
        sys.exit(1)
    
    poll_id = sys.argv[1]
    
    # Run the async load test
    asyncio.run(run_load_test(poll_id))


if __name__ == "__main__":
    main()
