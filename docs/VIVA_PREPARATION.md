# M.Tech Viva Voce Defense Guide & Evaluation Preparation
## Project: StudyHub — Full-Stack Web Engineering Academic System

---

## 1. Quick Project Presentation Outline (3–5 Minute Speech)

> **"Respected Examiners and Faculty,**
>
> Today, I present **StudyHub**, a full-stack academic learning and collaboration web platform designed and engineered for my M.Tech coursework.
>
> Rather than a superficial CRUD demo, StudyHub is architected as an enterprise-grade academic platform built around four pillars:
> 1. **Robust Relational Data Modeling**: An 18-relation PostgreSQL schema in Third Normal Form (3NF) managing users, courses, hierarchical modules/lessons, quizzes, enrollments, discussions, and progress tracking, with deterministic migrations version-controlled via Alembic.
> 2. **High-Throughput Asynchronous REST API**: Implemented using Python 3.12 and FastAPI, utilizing Pydantic v2 schemas for strict contract validation and OpenAPI/Swagger documentation.
> 3. **Defense-in-Depth Security**: Stateless HMAC-SHA256 JWT tokens, adaptive `bcrypt` password hashing, and server-side Role-Based Access Control (RBAC) across Students, Instructors, and Administrators, with strict server-side confidential grading that guarantees quiz answers are never leaked.
> 4. **Component-Driven Responsive UI**: Developed using React 18, React Router v7, and a custom Vanilla CSS design token system that avoids external bloated CSS frameworks while achieving a sleek SaaS look and feel.
>
> All features are verified through an automated test suite of 20 Pytest backend tests and Vitest frontend component tests."

---

## 2. Feature-to-Technology Mapping

| Feature | Technologies Used | Core File(s) |
| :--- | :--- | :--- |
| **User Authentication & Passwords** | FastAPI, `bcrypt`, `pyjwt`, Pydantic | `app/services/auth.py`, `app/api/auth.py` |
| **Role-Based Authorization (RBAC)** | FastAPI Dependency Injection (`Depends`), Enum | `app/api/deps.py`, `app/models/user.py` |
| **Course Catalog & Filtering** | SQLAlchemy query builder, B-Tree index | `app/api/courses.py`, `app/models/course.py` |
| **Database Migrations** | Alembic, PostgreSQL DDL | `backend/alembic/env.py`, `backend/alembic/versions/` |
| **Curriculum Hierarchy (Module/Lesson)** | SQLAlchemy Foreign Key cascades | `app/models/module.py`, `app/models/lesson.py` |
| **Confidential Quiz Grading** | Pydantic Schema Filtering, Server Computation | `app/api/quizzes.py`, `app/schemas/quiz.py` |
| **Progress & Completion Tracking** | Atomic SQL transactions, Unique Constraints | `app/api/progress.py`, `app/models/progress.py` |
| **Discussion Forum & Moderation** | SQLAlchemy Relationships, Cascade Deletes | `app/api/discussions.py`, `app/models/discussion.py` |
| **Client Routing & Guards** | React Router v7, React Context | `frontend/src/App.jsx`, `components/ProtectedRoute.jsx` |
| **HTTP Interception & Auth State** | Axios Interceptors, LocalStorage | `frontend/src/api/client.js`, `context/AuthContext.jsx` |
| **Design System & Micro-Interactions** | Vanilla CSS Tokens, CSS Grid/Flexbox | `frontend/src/index.css` |

---

## 3. Top 25 Likely Viva Questions & Model Answers

### Q1: Why did you choose FastAPI over traditional frameworks like Django or Flask?
**Answer:**
- **Asynchronous Throughput**: FastAPI is natively built on the ASGI standard (using Starlette and Uvicorn), enabling high-concurrency non-blocking I/O.
- **Type Safety & Automatic Docs**: By leveraging Python type annotations and Pydantic, request/response models are strictly validated at runtime, and interactive Swagger UI (`/docs`) is generated automatically without manual configuration.
- **Micro-architecture Flexibility**: Unlike Django's monolithic approach with its built-in ORM and templating engine, FastAPI lets us cleanly pair SQLAlchemy 2.0 and Alembic with a decoupled React SPA.

### Q2: How does SQLAlchemy ORM interact with PostgreSQL in this application?
**Answer:**
- SQLAlchemy manages database communication via the `create_engine` pool and `sessionmaker`.
- In `backend/app/database.py`, we implement a generator dependency `get_db()`. FastAPI injects this session into each request using `Depends(get_db)`. When the request completes, the `finally` block executes `db.close()`, guaranteeing database connections are returned to the connection pool without connection leaks.

### Q3: What is Alembic, and why not just use `Base.metadata.create_all()`?
**Answer:**
- `Base.metadata.create_all()` can only create tables that do not exist; it cannot alter existing columns, add constraints, or drop deprecated tables without destroying production data.
- Alembic tracks schema revisions as incremental migration scripts in `alembic/versions/` and stores the current revision hash in the `alembic_version` table in PostgreSQL. This makes database evolution version-controlled, repeatable, and team-friendly.

### Q4: Explain the difference between Authentication and Authorization in StudyHub.
**Answer:**
- **Authentication (AuthN)** verifies **who you are** (identity verification). Implemented in `/api/v1/auth/login` where email and password are validated, returning a signed JWT.
- **Authorization (AuthZ)** determines **what you are allowed to do** (permissions). Implemented in `app/api/deps.py` via `require_role(['instructor', 'admin'])`, where the decoded token role is checked before executing protected business logic.

### Q5: Why is `bcrypt` used for password storage instead of standard SHA-256?
**Answer:**
- SHA-256 is an ultra-fast cryptographic hashing function designed for data integrity; graphic cards (GPUs) can compute billions of SHA-256 hashes per second, making it susceptible to brute-force and rainbow table attacks.
- `bcrypt` is an adaptive key-derivation function based on the Blowfish cipher. It incorporates a per-password cryptographic salt (neutralizing rainbow tables) and an adjustable work factor (rounds), forcing an intentional computational delay that makes brute-force attacks computationally infeasible.

### Q6: What information is stored in the JWT payload, and how is it validated?
**Answer:**
- The payload contains:
  1. `sub`: Unique integer ID of the user.
  2. `role`: The user role (`student`, `instructor`, `admin`).
  3. `exp`: Expiration timestamp (24 hours).
  4. `iat`: Issued-at timestamp.
- Validation: When the client passes `Authorization: Bearer <token>`, `jwt.decode()` validates the cryptographic signature using the secret key (`SECRET_KEY`) and checks that the current system time is strictly prior to `exp`.

### Q7: How do you prevent student users from taking administrative or instructor actions?
**Answer:**
- We implement **server-side role enforcement** using FastAPI dependency injection. For example, in `/api/v1/courses` (POST) and `/api/v1/admin/stats`, the route specifies `current_user: User = Depends(require_instructor)` or `Depends(require_admin)`.
- If a user with `role="student"` invokes these endpoints (even by forging an HTTP request via Postman or curl), FastAPI immediately aborts with HTTP `403 Forbidden`. Hiding buttons in React is strictly for UX; security is 100% enforced on the server.

### Q8: How does your implementation prevent SQL Injection?
**Answer:**
- By exclusively using SQLAlchemy ORM and parameterized queries rather than raw string concatenation.
- User inputs passed to filters (such as `Course.title.ilike(search_filter)`) are bound as query parameters by the DBAPI driver (`psycopg2`), ensuring user input is treated strictly as literal data, never executable SQL commands.

### Q9: How do you protect quiz answers from being inspected before a student submits?
**Answer:**
- In `backend/app/api/quizzes.py`, the student endpoint `GET /quizzes/{quiz_id}` uses a specialized public response schema `QuizPublicResponse`.
- The `is_correct` boolean field is intentionally omitted from the public `OptionPublic` schema. Only upon submission does the server compare the student's choices against the database answer key in a server-side transaction.

### Q10: How do you prevent duplicate enrollments or inconsistent progress records?
**Answer:**
- We enforce database-level uniqueness constraints:
  - `UniqueConstraint("user_id", "course_id", name="uq_user_course_enrollment")` on `enrollments`.
  - `UniqueConstraint("user_id", "lesson_id", name="uq_user_lesson_progress")` on `lesson_progress`.
- If an operation attempts to create a duplicate record, PostgreSQL raises an integrity violation, and the API returns a structured HTTP 400 Bad Request error.

### Q11: Explain Third Normal Form (3NF) in the context of your schema.
**Answer:**
- **1NF**: Every column is atomic (scalar integer, varchar, boolean), and each record has a unique primary key `id`.
- **2NF**: No partial dependencies; all attributes depend on the entire primary key.
- **3NF**: No transitive dependencies. For example, `courses` stores `instructor_id` pointing to `users.id`, rather than redundantly copying the instructor's email, name, and bio into the `courses` table.

### Q12: What are the security trade-offs of storing JWT in `localStorage` versus `httpOnly` cookies?
**Answer:**
- **`localStorage`**: Simple to integrate with decoupled mobile and web clients, exempt from Cross-Site Request Forgery (CSRF). However, if an application is vulnerable to Cross-Site Scripting (XSS), JavaScript can read the token.
- **`httpOnly` Cookies**: Immune to JavaScript access (mitigating XSS token theft), but vulnerable to CSRF attacks unless SameSite flags or anti-CSRF tokens are configured.
- *In StudyHub*: We use short-lived tokens and strict CORS origin whitelisting.

### Q13: How does CORS work, and how did you configure it?
**Answer:**
- Cross-Origin Resource Sharing (CORS) is a browser security mechanism that restricts HTTP requests made by client scripts to a different origin (domain, protocol, or port).
- In `app/main.py`, we added FastAPI's `CORSMiddleware`, explicitly whitelisting the frontend origin (`http://localhost:5173`), allowing necessary headers (`Authorization`, `Content-Type`), and permitting standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`).

### Q14: What is the purpose of the `yield` statement in `get_db()`?
**Answer:**
- `yield` creates a Python generator. When FastAPI handles a request, it enters the function and yields the SQLAlchemy `SessionLocal()` object to the endpoint.
- After the endpoint finishes processing and returns its response, execution resumes in the `finally` block of `get_db()`, executing `db.close()`. This ensures deterministic resource cleanup even if unhandled exceptions occur.

### Q15: How does React Router maintain state during navigation without full page reloads?
**Answer:**
- React Router leverages the HTML5 History API (`window.history.pushState`).
- When a user clicks `<Link to="/dashboard">`, the browser URL updates without contacting the web server for a new HTML document. React Router intercepts the URL change and dynamically mounts the corresponding component inside the React virtual DOM tree.

### Q16: What role does Pydantic play in FastAPI?
**Answer:**
- Pydantic provides type enforcement and validation.
- When an HTTP request arrives, Pydantic parses the JSON body against defined schemas (e.g., `UserRegister`), validates constraints (e.g., email format, string lengths), and transforms the payload into a Python object. If invalid, it returns a 422 Unprocessable Entity error with exact field error locations.

### Q17: What cascade behaviors are configured in your SQLAlchemy models?
**Answer:**
- `cascade="all, delete-orphan"` on child collections like `course.modules`, `module.lessons`, and `quiz.questions`.
- If an instructor deletes a course, SQLAlchemy and PostgreSQL cascade and delete its associated modules, lessons, and quizzes, preventing orphaned records.
- For categories, `ondelete="SET NULL"` ensures deleting a category does not delete the courses in that category.

### Q18: What automated tests were implemented, and what tools did you use?
**Answer:**
- **Backend**: Pytest with FastAPI `TestClient` executing 20 automated tests in `backend/tests/` covering authentication, password hashing, invalid credentials, course creation, enrollment limits, quiz grading, and admin protection.
- **Frontend**: Vitest and React Testing Library executing unit tests in `frontend/src/tests/` verifying navbar links, credentials banner, and component rendering.

### Q19: How does the Axios HTTP client interact with backend endpoints?
**Answer:**
- Configured in `frontend/src/api/client.js` with a centralized `baseURL` pointing to `http://localhost:8000/api/v1`.
- A request interceptor automatically extracts the JWT token from `localStorage` and attaches `Authorization: Bearer <token>`. A response interceptor detects 401 Unauthorized responses and clears expired sessions.

### Q20: How is state managed in the React application?
**Answer:**
- **Global Auth State**: Managed using React Context (`AuthContext`), exposing `user`, `token`, `login()`, `logout()`, and role booleans (`isStudent`, `isInstructor`, `isAdmin`) across all components.
- **Local Component State**: Managed via `useState` and `useEffect` hooks for form inputs, loading indicators, active tabs, and timers.

### Q21: What happens during a quiz submission from client to database?
**Answer:**
1. Student selects answer options in `QuizInterface.jsx`.
2. Frontend posts question IDs and selected option IDs to `/api/v1/quizzes/{id}/submit`.
3. Backend fetches the quiz and its correct answer options from PostgreSQL.
4. Server iterates over questions, computes the percentage score, and determines pass/fail status against `passing_score`.
5. A `QuizAttempt` and corresponding `AttemptAnswer` records are committed to PostgreSQL.
6. The detailed breakdown and score are returned to the client and rendered in the result card.

### Q22: How does the course discussion forum support replies and moderation?
**Answer:**
- Modeled as a parent-child relationship: `DiscussionThread` has many `DiscussionReply` records.
- Role-based moderation logic in `delete_thread` checks if `current_user.id` is the author, the course instructor, or a platform administrator.

### Q23: What database indexes were created and why?
**Answer:**
- `users.email` and `users.role` for fast lookup during login and role filtering.
- `courses.slug`, `courses.status`, and `courses.instructor_id`.
- Composite index `idx_course_search` on `(title, level, status)` to accelerate catalog search queries.

### Q24: What are the current limitations and how would you scale StudyHub?
**Answer:**
- **Current Limitations**: Uploaded lesson files are linked via URLs or local storage rather than cloud object storage (S3/GCS); in-app notifications are stored in PostgreSQL rather than pushed via WebSockets.
- **Scaling Roadmap**: Introduce Redis for caching popular courses and rate limiting; migrate file attachments to Amazon S3 with pre-signed URLs; deploy Celery for background asynchronous tasks (e.g. email certificates).

### Q25: How does StudyHub defend against Cross-Site Scripting (XSS)?
**Answer:**
- React automatically escapes values rendered in JSX before inserting them into the DOM, preventing script injection.
- User inputs in discussions and course descriptions are rendered as plain text strings (`whiteSpace: pre-line`) rather than unescaped `dangerouslySetInnerHTML`.

---

## 4. Viva Demonstration Walkthrough

When presenting live to the evaluation committee, follow this sequence:

### Step 1: Landing Page & Architectural Overview
- Open `http://localhost:5173`.
- Highlight the M.Tech Academic badge, architecture cards (FastAPI, PostgreSQL, RBAC), and featured courses fetched live from the database.
- Point out the interactive Swagger documentation running simultaneously at `http://localhost:8000/docs`.

### Step 2: Student Experience
- Click **Sign In**, then click the **Student** demo preset (`student@studyhub.edu`).
- Show the **Student Dashboard**: enrolled courses, progress percentages, recent quiz attempts.
- Click **Continue Learning** on "Full-Stack Web Engineering with FastAPI & React":
  - Show the curriculum sidebar.
  - Click **Mark as Complete** on a lesson — observe the progress percentage dynamically update.
  - Switch to the **Course Forum** tab, post a reply or ask a question.
- Navigate to **Take Quiz**:
  - Show the countdown timer.
  - Point out that correct answers are not exposed in browser DevTools.
  - Submit the assessment and showcase the instant server-graded breakdown.

### Step 3: Instructor Experience
- Click logout, then login as **Instructor** (`instructor@studyhub.edu`).
- Access **Instructor Studio**:
  - Review authored courses and total enrolled students.
  - Click **Create New Course** and showcase the curriculum authoring form.
  - Click **Quiz** to demonstrate adding a new assessment with answer keys.

### Step 4: Administrator Experience
- Login as **Admin** (`admin@studyhub.edu`).
- Access **Platform Administration Portal**:
  - Review platform-wide statistics (total users, students, faculty, courses, enrollments).
  - Search registered users in the User Management table.
  - Demonstrate changing a user's role or deactivating an account.
  - Demonstrate moderating course publication status (published, draft, archived).

### Step 5: Test Verification
- Run `pytest -v` in the backend terminal to show 20/20 passing tests.
- Run `npm test` in the frontend terminal to show 4/4 passing Vitest suites.
