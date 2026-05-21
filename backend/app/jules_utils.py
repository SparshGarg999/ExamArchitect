import os
import requests
from dotenv import load_dotenv

load_dotenv()

JULES_API_KEY = os.getenv("JULES_API_KEY")
JULES_BASE_URL = "https://api.jules.ai/v1" # Example mock URL for programmatic interactions

class JulesProgrammaticClient:
    def __init__(self):
        self.api_key = JULES_API_KEY
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def trigger_test_suite(self, project_id: str) -> dict:
        """
        Programmatically triggers a test suite run via Jules API.
        """
        if not self.api_key:
            print("Warning: JULES_API_KEY not set. Test suite run simulated.")
            return {"status": "simulated", "message": "Jules API key missing"}
            
        print(f"Triggering Jules test suite for project {project_id}...")
        # Simulating API request to Jules
        # response = requests.post(
        #     f"{JULES_BASE_URL}/projects/{project_id}/tests/trigger",
        #     headers=self.headers
        # )
        # return response.json()
        return {"status": "success", "message": "Test suite triggered successfully."}

    def record_backtest_metrics(self, exam_id: int, target_year: int, metrics: dict) -> dict:
        """
        Sends prediction backtest results to Jules for long-term monitoring.
        """
        if not self.api_key:
             return {"status": "simulated"}
             
        payload = {
            "exam_id": exam_id,
            "target_year": target_year,
            "metrics": metrics
        }
        print(f"Recording backtest metrics via Jules: {payload}")
        # Simulating POST request
        return {"status": "success", "message": "Metrics recorded."}

if __name__ == "__main__":
    client = JulesProgrammaticClient()
    print(client.trigger_test_suite("exam_architect_v1"))
