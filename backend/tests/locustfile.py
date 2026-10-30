"""
StudyHub Load Test — Locust 2.x
Run: locust -f tests/locustfile.py --host http://localhost:8000 --headless -u 100 -r 10 -t 5m
"""
import random
from locust import HttpUser, task, between

STUDENT_EMAIL = "student@studyhub.edu"
STUDENT_PASSWORD = "Student@123"


class StudyHubUser(HttpUser):
    wait_time = between(1, 3)
    access_token: str = ""
    refresh_cookie: str = ""

    def on_start(self):
        """Authenticate and store tokens."""
        res = self.client.post(
            "/api/v1/auth/login",
            json={"email": STUDENT_EMAIL, "password": STUDENT_PASSWORD},
            name="POST /auth/login [warmup]",
        )
        if res.status_code == 200:
            self.access_token = res.json().get("access_token", "")
            self.refresh_cookie = res.cookies.get("studyhub_refresh", "")

    @property
    def auth_headers(self):
        return {"Authorization": f"Bearer {self.access_token}"}

    @task(5)
    def browse_courses(self):
        self.client.get("/api/v1/courses", name="GET /courses")

    @task(3)
    def search_courses(self):
        q = random.choice(["python", "fastapi", "react", "web"])
        self.client.get(f"/api/v1/courses?q={q}", name="GET /courses?q=")

    @task(3)
    def get_profile(self):
        self.client.get(
            "/api/v1/auth/me",
            headers=self.auth_headers,
            name="GET /auth/me",
        )

    @task(2)
    def refresh_token(self):
        if self.refresh_cookie:
            res = self.client.post(
                "/api/v1/auth/refresh",
                cookies={"studyhub_refresh": self.refresh_cookie},
                name="POST /auth/refresh",
            )
            if res.status_code == 200:
                self.access_token = res.json().get("access_token", "")
                self.refresh_cookie = res.cookies.get("studyhub_refresh", "")

    @task(1)
    def health_check(self):
        self.client.get("/health", name="GET /health")

    @task(1)
    def readiness_check(self):
        self.client.get("/health/ready", name="GET /health/ready")
