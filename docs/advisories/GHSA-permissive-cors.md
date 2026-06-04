# GitHub Security Advisory (GHSA) Draft

**Title:** Overly Permissive CORS Policy with Credentials Enabled
**Severity:** Medium (CVSS 5.4)
**Vulnerability Type:** CWE-942 (Overly Permissive Cross-Domain Mutual Trust)

## Description
The FastAPI backend in `backend/app/main.py` is configured with a wildcard Cross-Origin Resource Sharing (CORS) origin (`allow_origins=["*"]`) while having `allow_credentials=True` enabled.

Under standard CORS specifications, browsers block the combination of `allow_origins=["*"]` and `allow_credentials=True` to prevent security leaks. However, if this check is bypassed or misconfigured in reverse proxies, it can allow malicious websites to make cross-origin credentialed requests (like reading JWT tokens or private user mock exam records) on behalf of authenticated users.

## Impact
Any website visiting the user's browser could theoretically send authenticated requests to the backend endpoints (e.g. `GET /api/auth/profile` or `POST /api/user-exams`), leading to sensitive session information leakage or unauthorized resource creation.

## Remediation / Patch
Explicitly check the active environment mode. In production, load the frontend's specific secure origins (e.g., `https://exam-architect-nine.vercel.app`) instead of using the wildcard `*`:

```python
# Updated CORSMiddleware configuration in backend/app/main.py
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL] if os.getenv("ENV") == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
