import requests
import json


def _safe_text(value):
    text = str(value)
    return text.encode("ascii", errors="replace").decode("ascii")


def test_health():
    try:
        r = requests.get("http://localhost:8000/health")
        print(f"Health Check: {r.status_code} - {r.json()}")
    except Exception as e:
        print(f"Health Check Failed: {e}")

def test_properties():
    try:
        r = requests.get("http://localhost:8000/api/v1/properties/?page_size=1")
        print(f"Properties API: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            print(f"Found {data.get('total')} properties")
            if data.get('items'):
                print(f"First property: {data['items'][0]['title']} in {data['items'][0]['locality']}")
    except Exception as e:
        print(f"Properties API Failed: {e}")

def test_chat():
    try:
        print("Testing AI Agent Chat (this calls Azure OpenAI)...")
        r = requests.post(
            "http://localhost:8000/api/v1/agents/chat",
            headers={"Authorization": "Bearer mock-jwt-token-propiq-2024"},
            json={"message": "What is the average price in Kondapur?"},
            timeout=30
        )
        print(f"Chat API: {r.status_code}")
        if r.status_code == 200:
            reply = r.json().get('reply') or r.json().get('response')
            print(f"Agent Response: {_safe_text(reply)}")
        else:
            print(f"Error: {r.text}")
    except Exception as e:
        print(f"Chat API Failed: {e}")

if __name__ == "__main__":
    test_health()
    test_properties()
    test_chat()
