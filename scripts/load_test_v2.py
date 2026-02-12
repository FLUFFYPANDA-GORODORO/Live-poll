"""
Load Test Script for Live-Poll Application
Simulates 50 concurrent users voting on a poll

Usage: python scripts/load_test_v2.py POLL_ID
Example: python scripts/load_test_v2.py JXMX5E
"""

import asyncio
import aiohttp
import random
import time
import sys
from datetime import datetime
import json

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
    "end_time": None,
    "error_messages": []
}


def generate_session_id(participant_id, question_idx):
    """Generate unique session ID for each participant"""
    return f"loadtest_p{participant_id}_q{question_idx}_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"


async def cast_vote(session, poll_id, participant_id, question_index, num_options):
    """Cast a vote for a random option"""
    session_id = generate_session_id(participant_id, question_index)
    option_index = random.randint(0, min(num_options - 1, 3))
    vote_doc_id = f"{session_id}_{question_index}"
    
    # Create vote document
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
            metrics["writes"] += 1
            if resp.status == 200:
                metrics["votes_successful"] += 1
                return {"success": True, "option": option_index, "participant": participant_id}
            else:
                error_text = await resp.text()
                metrics["errors"] += 1
                if len(metrics["error_messages"]) < 5:
                    metrics["error_messages"].append(f"P{participant_id}: {resp.status}")
                return {"success": False, "reason": f"HTTP {resp.status}", "participant": participant_id}
                
    except asyncio.TimeoutError:
        metrics["errors"] += 1
        return {"success": False, "reason": "timeout", "participant": participant_id}
    except Exception as e:
        metrics["errors"] += 1
        return {"success": False, "reason": str(e)[:50], "participant": participant_id}


async def get_poll_data(session, poll_id):
    """Fetch poll data from Firestore"""
    url = f"{FIRESTORE_URL}/polls/{poll_id}"
    
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
            metrics["reads"] += 1
            if resp.status == 200:
                data = await resp.json()
                fields = data.get("fields", {})
                
                # Parse title
                title = fields.get("title", {}).get("stringValue", "Unknown Poll")
                
                # Parse questions
                questions_array = fields.get("questions", {}).get("arrayValue", {}).get("values", [])
                questions = []
                for q in questions_array:
                    q_fields = q.get("mapValue", {}).get("fields", {})
                    text = q_fields.get("text", {}).get("stringValue", "Question")
                    options = q_fields.get("options", {}).get("arrayValue", {}).get("values", [])
                    questions.append({
                        "text": text,
                        "num_options": len(options)
                    })
                
                return {"title": title, "questions": questions}
            else:
                print(f"   Error fetching poll: HTTP {resp.status}")
                return None
    except Exception as e:
        print(f"   Error fetching poll: {e}")
        return None


def print_header(poll_id, title, num_questions):
    """Print test header"""
    print("\n" + "═" * 65)
    print("║     🚀 LIVE-POLL LOAD TEST - 50 CONCURRENT USERS             ║")
    print("═" * 65)
    print(f"  Poll ID:       {poll_id}")
    print(f"  Title:         {title[:40]}")
    print(f"  Participants:  {NUM_PARTICIPANTS}")
    print(f"  Questions:     {num_questions}")
    print(f"  Total Votes:   {NUM_PARTICIPANTS * num_questions}")
    print("═" * 65)


def print_live_metrics():
    """Print live metrics box"""
    print("\n┌─────────────────────────────────────────┐")
    print("│           📊 LIVE METRICS               │")
    print("├─────────────────────────────────────────┤")
    print(f"│  📖 Total Reads:     {metrics['reads']:>10}      │")
    print(f"│  📝 Total Writes:    {metrics['writes']:>10}      │")
    print(f"│  ✅ Votes Success:   {metrics['votes_successful']:>10}      │")
    print(f"│  ❌ Errors:          {metrics['errors']:>10}      │")
    print("└─────────────────────────────────────────┘")


def print_final_report(poll_id, duration):
    """Print final report"""
    print("\n" + "═" * 65)
    print("║                  📋 FINAL TEST REPORT                       ║")
    print("═" * 65)
    print(f"  Poll ID:              {poll_id}")
    print(f"  Duration:             {duration:.2f}s")
    print("─" * 65)
    print("                    FIRESTORE METRICS                         ")
    print("─" * 65)
    print(f"  📖 Total Reads:       {metrics['reads']:>6}")
    print(f"  📝 Total Writes:      {metrics['writes']:>6}")
    print(f"  ✅ Successful Votes:  {metrics['votes_successful']:>6}")
    print(f"  ❌ Errors:            {metrics['errors']:>6}")
    print("─" * 65)
    total_ops = metrics['reads'] + metrics['writes']
    votes_per_sec = metrics['votes_successful'] / duration if duration > 0 else 0
    print(f"  Total Operations:     {total_ops:>6}")
    print(f"  Votes/Second:         {votes_per_sec:>6.1f}")
    print("═" * 65)
    
    if metrics["error_messages"]:
        print("\n  Sample Errors:")
        for err in metrics["error_messages"][:3]:
            print(f"    - {err}")


async def run_load_test(poll_id):
    """Main load test function"""
    print("\n⏳ Starting load test in 2 seconds...\n")
    await asyncio.sleep(2)
    
    connector = aiohttp.TCPConnector(limit=100, force_close=True)
    async with aiohttp.ClientSession(connector=connector) as session:
        # Get poll data first
        print("📖 Fetching poll data...")
        poll_data = await get_poll_data(session, poll_id)
        
        if not poll_data:
            print("❌ Poll not found! Check the poll ID.")
            return
        
        questions = poll_data["questions"]
        num_questions = len(questions)
        
        if num_questions == 0:
            print("❌ No questions found in poll!")
            return
        
        print(f"✅ Found poll: \"{poll_data['title']}\" with {num_questions} questions")
        print_header(poll_id, poll_data["title"], num_questions)
        
        metrics["start_time"] = time.time()
        
        # Vote for each question
        for q_idx, question in enumerate(questions):
            num_options = question.get("num_options", 4)
            print(f"\n🗳️  Question {q_idx + 1}/{num_questions}: \"{question['text'][:50]}\"")
            print("─" * 50)
            print(f"   Executing {NUM_PARTICIPANTS} concurrent votes...")
            
            start_q = time.time()
            
            # Create and run all vote tasks concurrently
            tasks = [
                cast_vote(session, poll_id, p, q_idx, num_options)
                for p in range(NUM_PARTICIPANTS)
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            end_q = time.time()
            
            # Count results
            success_count = sum(1 for r in results if isinstance(r, dict) and r.get("success"))
            fail_count = NUM_PARTICIPANTS - success_count
            
            print(f"   ✅ Successful: {success_count} | ❌ Failed: {fail_count} | ⏱️  {(end_q - start_q) * 1000:.0f}ms")
            
            # Count vote distribution
            option_counts = [0, 0, 0, 0]
            for r in results:
                if isinstance(r, dict) and r.get("success") and "option" in r:
                    opt = r["option"]
                    if opt < 4:
                        option_counts[opt] += 1
            
            print(f"   📊 Vote Distribution: A:{option_counts[0]} B:{option_counts[1]} C:{option_counts[2]} D:{option_counts[3]}")
            
            print_live_metrics()
            
            # Small delay between questions
            if q_idx < num_questions - 1:
                await asyncio.sleep(0.5)
        
        metrics["end_time"] = time.time()
        duration = metrics["end_time"] - metrics["start_time"]
        
        print_final_report(poll_id, duration)
        print(f"\n🔗 View live results at: https://poll.gauravpatil.space/present/{poll_id}\n")


def main():
    if len(sys.argv) < 2:
        print("\n❌ ERROR: Please provide a poll ID")
        print("   Usage: python scripts/load_test_v2.py <POLL_ID>")
        print("   Example: python scripts/load_test_v2.py JXMX5E\n")
        sys.exit(1)
    
    poll_id = sys.argv[1]
    print(f"\n🎯 Target Poll: {poll_id}")
    
    # Run the async load test
    asyncio.run(run_load_test(poll_id))


if __name__ == "__main__":
    main()
