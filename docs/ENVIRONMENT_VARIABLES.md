# ⚙️ StudyHub Environment Variables Reference

> **Standard**: 12-Factor App Config &nbsp;|&nbsp; **Validator**: Pydantic BaseSettings

---

## 1. Core Application Variables

| Variable | Type | Default | Production Requirement | Description |
|:---|:---:|:---|:---:|:---|
| `ENVIRONMENT` | `string` | `development` | **Required** | Environment profile (`development`, `testing`, `production`). |
| `DEBUG` | `boolean` | `false` | **Must be false** | Disables detailed error traces in client responses when false. |
| `API_V1_PREFIX` | `string` | `/api/v1` | Optional | Prefix for all API routes. |

---

## 2. Database & Cache Variables

| Variable | Type | Default | Production Requirement | Description |
|:---|:---:|:---|:---:|:---|
| `DATABASE_URL` | `string` | `postgresql://...` | **Required** | PostgreSQL connection DSN. Format: `postgresql://user:pass@host:5432/dbname`. |
| `REDIS_URL` | `string` | `redis://localhost:6379/0` | Recommended | Redis connection DSN for rate limiting and session tracking. |
| `DB_POOL_SIZE` | `integer` | `10` | Optional | Number of persistent connection pool workers. |
| `DB_MAX_OVERFLOW` | `integer` | `20` | Optional | Maximum burst connections beyond pool size. |
| `DB_POOL_TIMEOUT` | `integer` | `30` | Optional | Seconds to wait before raising pool connection timeout. |
| `DB_POOL_RECYCLE` | `integer` | `1800` | Optional | Seconds after which connections are refreshed (30m). |

---

## 3. Authentication & Security Variables

| Variable | Type | Default | Production Requirement | Description |
|:---|:---:|:---|:---:|:---|
| `JWT_SECRET_KEY` | `string` | *Dev default* | **CRITICAL: Generate with `openssl rand -hex 32`** | Symmetric key used to sign and verify access JWTs. Minimum 32 chars. |
| `JWT_ALGORITHM` | `string` | `HS256` | Optional | Cryptographic algorithm for JWT signing. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `integer` | `15` | Optional | Access token validity window (15 minutes). |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `integer` | `7` | Optional | Refresh token cookie validity window (7 days). |
| `COOKIE_SECURE` | `boolean` | `false` | **Must be true on HTTPS** | Sets `Secure` flag on refresh cookie. |
| `COOKIE_SAMESITE` | `string` | `lax` | Optional | SameSite cookie policy (`lax`, `strict`, `none`). |
| `MAX_FAILED_LOGIN_ATTEMPTS` | `integer` | `5` | Optional | Consecutive failed logins before account lockout triggers. |
| `LOCKOUT_DURATION_MINUTES` | `integer` | `15` | Optional | Duration of account lockout window. |

---

## 4. CORS & Network Configuration

| Variable | Type | Default | Production Requirement | Description |
|:---|:---:|:---|:---:|:---|
| `CORS_ORIGINS` | `JSON array` | `["http://localhost:3000"]` | **Required** | Whitelisted frontend origins. E.g. `["https://studyhub.edu"]`. |
| `MAX_REQUEST_SIZE_BYTES` | `integer` | `10485760` | Optional | Maximum allowed request body size in bytes (10MB). |

---

## 5. Frontend Client Variables (Vite)

| Variable | Type | Default | Description |
|:---|:---:|:---|:---|
| `VITE_API_BASE_URL` | `string` | `http://localhost:8000/api/v1` | Base URL used by Axios client to communicate with the REST API. |
