# StudyHub Relational Database Schema & Data Dictionary
## M.Tech Academic Project — Full-Stack Web Engineering

---

## 1. Entity-Relationship (ER) Diagram

The following Mermaid diagram models the entities, primary keys, foreign keys, and cardinalities implemented in PostgreSQL for StudyHub:

```mermaid
erDiagram
    USERS ||--o{ COURSES : "instructs"
    USERS ||--o{ ENROLLMENTS : "registers"
    USERS ||--o{ LESSON_PROGRESS : "completes"
    USERS ||--o{ QUIZ_ATTEMPTS : "attempts"
    USERS ||--o{ DISCUSSION_THREADS : "posts"
    USERS ||--o{ DISCUSSION_REPLIES : "replies"
    USERS ||--o{ BOOKMARKS : "saves"
    USERS ||--o{ NOTIFICATIONS : "receives"

    CATEGORIES ||--o{ COURSES : "classifies"

    COURSES ||--o{ MODULES : "contains"
    COURSES ||--o{ ENROLLMENTS : "has_students"
    COURSES ||--o{ QUIZZES : "evaluates"
    COURSES ||--o{ DISCUSSION_THREADS : "hosts"
    COURSES ||--o{ BOOKMARKS : "bookmarked_by"

    MODULES ||--o{ LESSONS : "organizes"

    LESSONS ||--o{ RESOURCES : "attaches"
    LESSONS ||--o{ LESSON_PROGRESS : "tracked_in"
    LESSONS ||--o{ QUIZZES : "optionally_associates"

    QUIZZES ||--o{ QUIZ_QUESTIONS : "includes"
    QUIZZES ||--o{ QUIZ_ATTEMPTS : "recorded_as"

    QUIZ_QUESTIONS ||--o{ ANSWER_OPTIONS : "offers"
    QUIZ_QUESTIONS ||--o{ ATTEMPT_ANSWERS : "evaluated_in"

    QUIZ_ATTEMPTS ||--o{ ATTEMPT_ANSWERS : "contains"

    DISCUSSION_THREADS ||--o{ DISCUSSION_REPLIES : "contains"

    USERS {
        int id PK
        varchar email UK
        varchar hashed_password
        varchar full_name
        varchar role
        text bio
        varchar avatar_url
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    CATEGORIES {
        int id PK
        varchar name UK
        varchar slug UK
        text description
        varchar icon
    }

    COURSES {
        int id PK
        varchar title
        varchar slug UK
        varchar short_description
        text description
        int instructor_id FK
        int category_id FK
        varchar level
        varchar status
        varchar thumbnail_url
        timestamp created_at
        timestamp updated_at
    }

    MODULES {
        int id PK
        int course_id FK
        varchar title
        text description
        int order_index
        timestamp created_at
    }

    LESSONS {
        int id PK
        int module_id FK
        varchar title
        varchar content_type
        text content_text
        int duration_minutes
        int order_index
        timestamp created_at
    }

    RESOURCES {
        int id PK
        int lesson_id FK
        varchar title
        varchar resource_type
        varchar file_path_or_url
        int file_size_bytes
        timestamp created_at
    }

    ENROLLMENTS {
        int id PK
        int user_id FK
        int course_id FK
        timestamp enrolled_at
        timestamp completed_at
        varchar status
    }

    LESSON_PROGRESS {
        int id PK
        int user_id FK
        int lesson_id FK
        boolean is_completed
        timestamp completed_at
    }

    QUIZZES {
        int id PK
        int course_id FK
        int lesson_id FK
        varchar title
        text description
        int time_limit_minutes
        float passing_score
        timestamp created_at
    }

    QUIZ_QUESTIONS {
        int id PK
        int quiz_id FK
        text prompt
        varchar question_type
        int order_index
    }

    ANSWER_OPTIONS {
        int id PK
        int question_id FK
        varchar text
        boolean is_correct
    }

    QUIZ_ATTEMPTS {
        int id PK
        int quiz_id FK
        int user_id FK
        float score
        boolean passed
        timestamp started_at
        timestamp completed_at
    }

    ATTEMPT_ANSWERS {
        int id PK
        int attempt_id FK
        int question_id FK
        int selected_option_id FK
        boolean is_correct
    }

    DISCUSSION_THREADS {
        int id PK
        int course_id FK
        int user_id FK
        varchar title
        text content
        timestamp created_at
    }

    DISCUSSION_REPLIES {
        int id PK
        int thread_id FK
        int user_id FK
        text content
        timestamp created_at
    }

    BOOKMARKS {
        int id PK
        int user_id FK
        int course_id FK
        timestamp created_at
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        varchar title
        text message
        boolean is_read
        timestamp created_at
    }
```

---

## 2. Relational Normalization Analysis (1NF, 2NF, 3NF)

### First Normal Form (1NF)
- **Atomicity**: All columns contain scalar, atomic values (e.g., no comma-separated arrays of tags or multi-valued attributes).
- **Primary Keys**: Every table has a clearly defined integer surrogate Primary Key (`id`).
- **No Repeating Groups**: Modules, lessons, and answers are represented in discrete normalized tables linked via Foreign Keys.

### Second Normal Form (2NF)
- The database is in 1NF.
- Every non-prime attribute is fully functionally dependent on the entire primary key. In all entities, tables with composite candidate keys (e.g. `(user_id, course_id)` in enrollments or bookmarks) enforce functional dependency with surrogate primary keys and explicit unique constraints.

### Third Normal Form (3NF)
- The database is in 2NF.
- There are no transitive dependencies: non-key attributes depend only on the primary key, and not on other non-key attributes (e.g., Course does not store redundant instructor email; it holds `instructor_id` referencing `users.id`).

---

## 3. Database Constraints and Integrity Rules

1. **Unique Constraints**:
   - `uq_user_course_enrollment` on `(user_id, course_id)`: Prevents duplicate enrollments by the same student.
   - `uq_user_lesson_progress` on `(user_id, lesson_id)`: Guarantees a student has only one progress state record per lesson.
   - `uq_user_course_bookmark` on `(user_id, course_id)`: Prevents multiple bookmarks of the same course.
   - `users.email` and `categories.slug`: Strictly unique across the platform.

2. **Foreign Key Cascade Deletes**:
   - Deleting a course cascades and removes related modules, lessons, attachments, enrollments, and discussion threads.
   - Deleting a question cascades and deletes its answer options.
   - Deleting a category sets `course.category_id` to `NULL` (`ondelete="SET NULL"`), ensuring courses remain intact even if a category is archived.

3. **Indexes**:
   - Indexed fields: `users.email`, `users.role`, `courses.slug`, `courses.status`, `courses.title`, `enrollments.user_id`, and `idx_course_search` composite index on `(title, level, status)` for sub-millisecond catalog filtering.
