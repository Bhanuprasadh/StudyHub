# StudyHub REST API Reference Documentation
## M.Tech Academic Project — Full-Stack Web Engineering

---

## 1. Overview & Base URL

The StudyHub API is designed according to RESTful architecture principles, utilizing JSON serialization, HTTP status codes, and Bearer Token authentication.

- **Base URL**: `http://localhost:8000/api/v1`
- **Interactive Swagger UI**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`
- **Health Check**: `GET /health`

---

## 2. Authentication & Headers

Protected endpoints require the standard `Authorization` HTTP header:
```http
Authorization: Bearer <your_jwt_access_token>
Content-Type: application/json
```

---

## 3. Endpoints Directory

### A. Authentication (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register a new Student or Instructor. Returns JWT token and User record. |
| `POST` | `/auth/login` | Public | Authenticate with email and password. Returns JWT token. |
| `GET` | `/auth/me` | Authenticated | Retrieve current user profile and role details. |
| `POST` | `/auth/logout` | Authenticated | Confirm session termination on client. |

---

### B. Users & Dashboards (`/api/v1/users`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `PUT` | `/users/me` | Authenticated | Update user full name, bio, and avatar URL. |
| `GET` | `/users/me/dashboard` | Authenticated | Fetch aggregated student metrics: enrolled courses, progress %, and recent quiz attempts. |
| `GET` | `/users/instructor/dashboard` | Instructor / Admin | Fetch instructor metrics: created courses, student enrollment totals. |

---

### C. Courses & Curriculum (`/api/v1/courses`, `/api/v1/modules`, `/api/v1/lessons`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/courses` | Public | List published courses with search (`q`), category, level filter, and pagination. |
| `POST` | `/courses` | Instructor / Admin | Create a new course with auto-slug generation. |
| `GET` | `/courses/{id_or_slug}` | Public / Auth | Get course details with modules, lessons, and student enrollment status. |
| `PUT` | `/courses/{id}` | Instructor (Owner) / Admin | Update course metadata, difficulty level, and status. |
| `DELETE` | `/courses/{id}` | Instructor (Owner) / Admin | Delete course with cascade removal of modules and lessons. |
| `POST` | `/modules/courses/{course_id}` | Instructor / Admin | Add a new module section to a course. |
| `POST` | `/lessons/modules/{module_id}` | Instructor / Admin | Add a lesson to a module. |
| `GET` | `/lessons/{lesson_id}` | Enrolled / Instructor / Admin | Retrieve lesson contents, notes, and attachments. |
| `POST` | `/lessons/{lesson_id}/resources` | Instructor / Admin | Attach reference links or notes to a lesson. |

---

### D. Enrollments & Progress Tracking (`/api/v1/enrollments`, `/api/v1/progress`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/enrollments/courses/{course_id}` | Authenticated | Enroll in a course (duplicate prevention enforced). |
| `GET` | `/enrollments/me` | Authenticated | List all enrolled courses with completion stats. |
| `DELETE` | `/enrollments/courses/{course_id}` | Authenticated | Unenroll from a course. |
| `POST` | `/progress/lessons/{lesson_id}` | Enrolled Student | Toggle completion of a lesson (updates course total). |
| `GET` | `/progress/courses/{course_id}` | Enrolled Student | Retrieve list of completed lesson IDs and progress percentage. |

---

### E. Quizzes & Assessments (`/api/v1/quizzes`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/quizzes/courses/{course_id}` | Instructor / Admin | Create quiz with questions, multiple-choice options, and answer keys. |
| `GET` | `/quizzes/courses/{course_id}` | Authenticated | List quizzes associated with a course. |
| `GET` | `/quizzes/{quiz_id}` | Enrolled / Instructor / Admin | Retrieve quiz questions for taking (**NEVER leaks correct answers**). |
| `GET` | `/quizzes/{quiz_id}/manage` | Instructor (Owner) / Admin | Retrieve full quiz details including answer key. |
| `POST` | `/quizzes/{quiz_id}/submit` | Authenticated Student | Submit answers for automatic server-side grading and record attempt. |
| `GET` | `/quizzes/{quiz_id}/my-attempts` | Authenticated Student | Retrieve attempt history for a quiz. |

---

### F. Course Discussions (`/api/v1/discussions`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/discussions/courses/{course_id}` | Public / Auth | List discussion threads and author info for a course. |
| `POST` | `/discussions/courses/{course_id}` | Authenticated | Create a new question or discussion thread. |
| `POST` | `/discussions/threads/{thread_id}/replies` | Authenticated | Post a reply to an existing thread. |
| `DELETE` | `/discussions/threads/{thread_id}` | Author / Instructor / Admin | Delete a thread. |

---

### G. Administration & Moderation (`/api/v1/admin`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/stats` | Admin Only | Platform-wide analytics (user counts, courses, enrollments). |
| `GET` | `/admin/users` | Admin Only | Search and list all registered platform users. |
| `PUT` | `/admin/users/{user_id}/status` | Admin Only | Change user role or toggle account active status. |
| `GET` | `/admin/courses` | Admin Only | List all courses across all statuses (draft, published, archived). |
| `PUT` | `/admin/courses/{course_id}/status` | Admin Only | Moderate course status (published, draft, archived). |
