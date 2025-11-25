"""
Test script for MindTrace API
Run this after starting the backend server to verify all endpoints
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def print_response(response, title):
    print(f"\n{'='*60}")
    print(f"{title}")
    print(f"{'='*60}")
    print(f"Status Code: {response.status_code}")
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text)

def test_health():
    """Test health check endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    print_response(response, "Health Check")
    return response.status_code == 200

def test_create_mentor():
    """Test creating a mentor"""
    mentor_data = {
        "name": "Dr. Alice Johnson",
        "email": "alice@example.com",
        "expertise": ["Python", "Machine Learning", "Data Science"],
        "bio": "PhD in Computer Science with 15 years of teaching experience"
    }
    response = requests.post(f"{BASE_URL}/api/mentors", json=mentor_data)
    print_response(response, "Create Mentor")
    
    if response.status_code == 200:
        return response.json()['id']
    return None

def test_list_mentors():
    """Test listing all mentors"""
    response = requests.get(f"{BASE_URL}/api/mentors")
    print_response(response, "List Mentors")
    return response.status_code == 200

def test_get_mentor(mentor_id):
    """Test getting a specific mentor"""
    response = requests.get(f"{BASE_URL}/api/mentors/{mentor_id}")
    print_response(response, f"Get Mentor {mentor_id}")
    return response.status_code == 200

def test_update_mentor(mentor_id):
    """Test updating a mentor"""
    update_data = {
        "bio": "Updated bio with more experience"
    }
    response = requests.put(f"{BASE_URL}/api/mentors/{mentor_id}", json=update_data)
    print_response(response, f"Update Mentor {mentor_id}")
    return response.status_code == 200

def test_create_session(mentor_id):
    """Test creating a session (without actual video)"""
    # Create a dummy text file to simulate video
    with open("dummy_video.txt", "w") as f:
        f.write("This is a dummy video file for testing")
    
    files = {
        'video': ('test_video.mp4', open('dummy_video.txt', 'rb'), 'video/mp4')
    }
    data = {
        'mentor_id': mentor_id,
        'title': 'Introduction to Python Decorators',
        'topic': 'Python Programming'
    }
    
    response = requests.post(f"{BASE_URL}/api/sessions", files=files, data=data)
    print_response(response, "Create Session")
    
    if response.status_code == 200:
        return response.json()['id']
    return None

def test_list_sessions(mentor_id):
    """Test listing sessions"""
    response = requests.get(f"{BASE_URL}/api/sessions", params={"mentor_id": mentor_id})
    print_response(response, "List Sessions")
    return response.status_code == 200

def test_get_session(session_id):
    """Test getting a specific session"""
    response = requests.get(f"{BASE_URL}/api/sessions/{session_id}")
    print_response(response, f"Get Session {session_id}")
    return response.status_code == 200

def test_start_evaluation(session_id):
    """Test starting evaluation"""
    response = requests.post(f"{BASE_URL}/api/evaluations/sessions/{session_id}/evaluate")
    print_response(response, f"Start Evaluation for Session {session_id}")
    return response.status_code == 200

def test_get_evaluation(session_id, max_retries=10):
    """Test getting evaluation (with retries for processing)"""
    for i in range(max_retries):
        print(f"\nAttempt {i+1}/{max_retries} to get evaluation...")
        try:
            response = requests.get(f"{BASE_URL}/api/evaluations/sessions/{session_id}")
            if response.status_code == 200:
                print_response(response, f"Get Evaluation for Session {session_id}")
                return response.json()['id']
            elif response.status_code == 404:
                print("Evaluation not ready yet, waiting 3 seconds...")
                time.sleep(3)
            else:
                print_response(response, f"Get Evaluation - Unexpected Status")
                return None
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(3)
    
    print("Evaluation not completed after maximum retries")
    return None

def test_mentor_stats(mentor_id):
    """Test getting mentor statistics"""
    response = requests.get(f"{BASE_URL}/api/mentors/{mentor_id}/stats")
    print_response(response, f"Get Mentor Stats {mentor_id}")
    return response.status_code == 200

def run_all_tests():
    """Run all API tests"""
    print("\n" + "="*60)
    print("MINDTRACE API TEST SUITE")
    print("="*60)
    
    # Test 1: Health check
    print("\n[TEST 1] Health Check")
    if not test_health():
        print("❌ Health check failed!")
        return
    print("✅ Health check passed!")
    
    # Test 2: Create mentor
    print("\n[TEST 2] Create Mentor")
    mentor_id = test_create_mentor()
    if not mentor_id:
        print("❌ Create mentor failed!")
        return
    print(f"✅ Mentor created with ID: {mentor_id}")
    
    # Test 3: List mentors
    print("\n[TEST 3] List Mentors")
    if not test_list_mentors():
        print("❌ List mentors failed!")
        return
    print("✅ List mentors passed!")
    
    # Test 4: Get mentor
    print("\n[TEST 4] Get Mentor")
    if not test_get_mentor(mentor_id):
        print("❌ Get mentor failed!")
        return
    print("✅ Get mentor passed!")
    
    # Test 5: Update mentor
    print("\n[TEST 5] Update Mentor")
    if not test_update_mentor(mentor_id):
        print("❌ Update mentor failed!")
        return
    print("✅ Update mentor passed!")
    
    # Test 6: Create session
    print("\n[TEST 6] Create Session")
    session_id = test_create_session(mentor_id)
    if not session_id:
        print("❌ Create session failed!")
        return
    print(f"✅ Session created with ID: {session_id}")
    
    # Test 7: List sessions
    print("\n[TEST 7] List Sessions")
    if not test_list_sessions(mentor_id):
        print("❌ List sessions failed!")
        return
    print("✅ List sessions passed!")
    
    # Test 8: Get session
    print("\n[TEST 8] Get Session")
    if not test_get_session(session_id):
        print("❌ Get session failed!")
        return
    print("✅ Get session passed!")
    
    # Test 9: Start evaluation
    print("\n[TEST 9] Start Evaluation")
    if not test_start_evaluation(session_id):
        print("❌ Start evaluation failed!")
        return
    print("✅ Evaluation started!")
    
    # Test 10: Get evaluation (with retries)
    print("\n[TEST 10] Get Evaluation")
    evaluation_id = test_get_evaluation(session_id)
    if not evaluation_id:
        print("❌ Get evaluation failed or timed out!")
        print("Note: This is expected if processing takes longer than 30 seconds")
    else:
        print(f"✅ Evaluation completed with ID: {evaluation_id}")
    
    # Test 11: Get mentor stats
    print("\n[TEST 11] Get Mentor Stats")
    if not test_mentor_stats(mentor_id):
        print("❌ Get mentor stats failed!")
        return
    print("✅ Get mentor stats passed!")
    
    print("\n" + "="*60)
    print("ALL TESTS COMPLETED!")
    print("="*60)

if __name__ == "__main__":
    try:
        run_all_tests()
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user")
    except Exception as e:
        print(f"\n\nFatal error: {e}")