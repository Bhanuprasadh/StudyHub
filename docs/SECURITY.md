# 🛡️ StudyHub Security Specification & Threat Model

> **Standard**: OWASP Top 10 (2021) & CWE Top 25 Compliance &nbsp;|&nbsp; **Classification**: Production-Grade

---

## 1. Security Architecture Matrix

| Security Layer | Implementation Mechanism | Threat Mitigated |
|:---|:---|:---|
| **Transport Security** | TLS 1.3 + HSTS (`Strict-Transport-Security: max-age=63072000`) | Man-in-the-Middle (MitM), SSL Strip |
| **Authentication** | In-memory JWT (15 min) + HttpOnly Refresh Token (7 days) + Rotation | Token theft, XSS extraction, Session Hijacking |
| **Credential Defense** | bcrypt (work factor 12) + Account Lockout (5 attempts / 15m) | Brute-force attacks, Dictionary attacks, Credential stuffing |
| **Password Policy** | Regex validator: min 8 chars, Upper, Lower, Number, Symbol | Weak credential usage |
| **Rate Limiting** | SlowAPI / Redis Token Bucket (`5/min` auth, `60/min` general API) | Denial of Service (DoS), Automated API abuse |
| **Payload Guard** | `RequestSizeLimitMiddleware` (max 10MB) | Memory exhaustion, Large buffer DoS |
| **Security Headers** | `SecurityHeadersMiddleware` (nosniff, DENY, strict-origin) | Clickjacking, MIME confusion, Reflected XSS |
| **CORS Policy** | Whitelisted origin verification, restricted HTTP methods | Cross-origin request forgery, Unauthorized API consumption |
| **Data Access** | SQLAlchemy 2.0 Parameterized Queries + ORM object isolation | SQL Injection (SQLi) |
| **Quiz Integrity** | Server-side question filtering (strips `is_correct` in student endpoints) | Academic dishonesty, Answer inspection |
| **Authorization** | Role-Based Access Control (`admin`, `instructor`, `student`) | Broken Object Level Authorization (BOLA), Privilege Escalation |
| **Error Handling** | Sanitized generic 500 handlers with unique Request correlation IDs | Sensitive data leakage, Stack trace disclosure |

---

## 2. HTTP Security Headers Specification

Every response issued by the FastAPI backend includes these headers:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
X-Request-ID: 7b3e64d2-23c8-4712-9c1a-5120a103c812
```

In production mode (`ENVIRONMENT=production`), the header:
```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```
is automatically enforced.

---

## 3. Rate Limiting Limits

| Route / Category | Limit | Trigger Action |
|:---|:---|:---|
| `POST /api/v1/auth/login` | 5 per minute | 429 Too Many Requests |
| `POST /api/v1/auth/register` | 5 per minute | 429 Too Many Requests |
| `POST /api/v1/auth/refresh` | 20 per minute | 429 Too Many Requests |
| General API Endpoints | 60 per minute | 429 Too Many Requests |

---

## 4. Role-Based Access Control (RBAC) Matrix

| Endpoint Group | Student | Instructor | Admin |
|:---|:---:|:---:|:---:|
| `GET /courses`, `GET /courses/{id}` | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| `POST /enrollments/courses/{id}` | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| `GET /quizzes/{id}` (Take quiz) | ✅ Allowed (answers hidden) | ✅ Allowed | ✅ Allowed |
| `POST /courses` (Create course) | ❌ 403 Forbidden | ✅ Allowed | ✅ Allowed |
| `PUT /courses/{id}` (Edit course) | ❌ 403 Forbidden | ✅ Allowed (Owner only) | ✅ Allowed (All) |
| `GET /quizzes/{id}/manage` (Full answers) | ❌ 403 Forbidden | ✅ Allowed (Owner only) | ✅ Allowed (All) |
| `GET /admin/stats` | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ Allowed |
| `GET /admin/users` | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ Allowed |
| `PUT /admin/users/{id}/status` | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ Allowed |

---

## 5. Security Incident Response & Audit Checklist

1. **Token Compromise Detection**: Check `refresh_tokens` for records where `revoked = True` but repeated refresh attempts were logged. Revoke user sessions immediately via `POST /api/v1/auth/logout-all`.
2. **Account Lockout Auditing**: Query users with active `locked_until` timestamps to identify targeted accounts.
3. **Log Correlation**: Use the `X-Request-ID` attached to client errors to inspect server-side JSON logs for the full exception trace.
