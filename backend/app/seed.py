import sys
import os
import datetime

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal, Base, engine
from app.models.user import User, UserRole
from app.models.category import Category
from app.models.course import Course
from app.models.module import Module
from app.models.lesson import Lesson
from app.models.resource import Resource
from app.models.enrollment import Enrollment
from app.models.progress import LessonProgress
from app.models.quiz import Quiz, Question, AnswerOption, QuizAttempt, AttemptAnswer
from app.models.discussion import DiscussionThread, DiscussionReply
from app.models.bookmark import Bookmark
from app.models.notification import Notification
from app.services.auth import hash_password


def seed_database(custom_db=None):
    print("🌱 Initializing StudyHub Database Seeder...")
    db = custom_db if custom_db is not None else SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "admin@studyhub.edu").first():
            print("⚠️ Database already contains seed data. Skipping re-seed.")
            return

        print("Creating Users...")
        # 1. Admin
        admin_user = User(
            email="admin@studyhub.edu",
            hashed_password=hash_password("Admin@123"),
            full_name="Dr. Eleanor Vance",
            role=UserRole.ADMIN.value,
            bio="Dean of Academic Computing & StudyHub Platform Administrator.",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            is_active=True,
        )

        # 2. Instructors
        instructor_1 = User(
            email="instructor@studyhub.edu",
            hashed_password=hash_password("Instructor@123"),
            full_name="Prof. Alan Turing",
            role=UserRole.INSTRUCTOR.value,
            bio="Senior Professor of Computer Systems & Distributed Web Architecture.",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
            is_active=True,
        )

        instructor_2 = User(
            email="sarah.connor@studyhub.edu",
            hashed_password=hash_password("Instructor@123"),
            full_name="Dr. Sarah Connor",
            role=UserRole.INSTRUCTOR.value,
            bio="Database Architect and Cloud Infrastructure Specialist.",
            avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
            is_active=True,
        )

        # 3. Students
        student_1 = User(
            email="student@studyhub.edu",
            hashed_password=hash_password("Student@123"),
            full_name="Ada Lovelace",
            role=UserRole.STUDENT.value,
            bio="M.Tech Full-Stack Web Engineering Student passionate about modern APIs & UI.",
            avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
            is_active=True,
        )

        student_2 = User(
            email="student2@studyhub.edu",
            hashed_password=hash_password("Student@123"),
            full_name="Bhanu Prasad",
            role=UserRole.STUDENT.value,
            bio="Graduate Scholar researching High Performance Web Frameworks.",
            avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
            is_active=True,
        )

        db.add_all([admin_user, instructor_1, instructor_2, student_1, student_2])
        db.flush()

        print("Creating Categories...")
        cat_fullstack = Category(
            name="Full-Stack Web Engineering",
            slug="full-stack-web-engineering",
            description="End-to-end web architecture, APIs, modern frontend frameworks, and cloud deployment.",
            icon="Layers",
        )
        cat_database = Category(
            name="Database Systems & PostgreSQL",
            slug="database-systems-postgresql",
            description="Relational database modeling, query optimization, indexing, and ACID transactions.",
            icon="Database",
        )
        cat_uiux = Category(
            name="UI/UX & Frontend Architecture",
            slug="ui-ux-frontend-architecture",
            description="Design systems, CSS variables, web accessibility, and responsive user interfaces.",
            icon="Palette",
        )
        cat_cloud = Category(
            name="Cloud & DevOps Engineering",
            slug="cloud-devops-engineering",
            description="Continuous integration, containerization, microservices, and web security.",
            icon="Cloud",
        )
        db.add_all([cat_fullstack, cat_database, cat_uiux, cat_cloud])
        db.flush()

        print("Creating Course 1: Full-Stack Web Engineering with FastAPI & React...")
        course_1 = Course(
            title="Full-Stack Web Engineering with FastAPI & React",
            slug="full-stack-web-engineering-fastapi-react",
            short_description="Master modern full-stack development using Python FastAPI, PostgreSQL ORM, and React components.",
            description="""This comprehensive curriculum covers the complete engineering cycle of professional web applications.

Students learn to construct robust REST APIs with FastAPI and Pydantic validation, integrate PostgreSQL using SQLAlchemy ORM and Alembic migrations, and develop responsive, stateful single-page applications using React and vanilla CSS design tokens.

Key Highlights:
- OpenAPI/Swagger documented endpoints
- Role-based access control (Student, Instructor, Admin)
- Secure JWT authentication with bcrypt password hashing
- Component-driven React architecture and clean client-side routing
- Automated test suites using Pytest and Vitest""",
            instructor_id=instructor_1.id,
            category_id=cat_fullstack.id,
            level="intermediate",
            status="published",
            thumbnail_url="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80",
        )
        db.add(course_1)
        db.flush()

        # Modules for Course 1
        c1_m1 = Module(course_id=course_1.id, title="Module 1: REST API Architecture & OpenAPI", order_index=1)
        c1_m2 = Module(course_id=course_1.id, title="Module 2: Relational Modeling & SQLAlchemy ORM", order_index=2)
        c1_m3 = Module(course_id=course_1.id, title="Module 3: React Frontend & Interactive State", order_index=3)
        db.add_all([c1_m1, c1_m2, c1_m3])
        db.flush()

        # Lessons for Course 1
        c1_l1 = Lesson(
            module_id=c1_m1.id,
            title="REST API Foundations and HTTP Status Standards",
            content_type="article",
            content_text="""### REST API Architecture Principles
Representational State Transfer (REST) is an architectural style for distributed hypermedia systems. Key constraints include:
1. **Stateless Operations**: Every request from client to server must contain all necessary authentication and parameter context.
2. **Uniform Interface**: Resources are identified by standard URIs, manipulated through standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`).
3. **Appropriate Status Codes**:
   - `200 OK`: Successful retrieval or update.
   - `201 Created`: Resource successfully created.
   - `204 No Content`: Successful deletion with empty response body.
   - `400 Bad Request`: Validation failure.
   - `401 Unauthorized`: Missing or invalid authentication token.
   - `403 Forbidden`: Authenticated user lacks permission (Role mismatch).
   - `404 Not Found`: Resource does not exist.
   - `500 Internal Server Error`: Unhandled server exception.""",
            duration_minutes=15,
            order_index=1,
        )
        c1_l2 = Lesson(
            module_id=c1_m1.id,
            title="JWT Authentication and Secure Session Handling",
            content_type="article",
            content_text="""### JSON Web Token (JWT) Security Implementation
In StudyHub, we implement stateless token authentication using HMAC-SHA256 (HS256) signatures.

1. **Password Hashing**: We use `bcrypt` with unique cryptographic salts to resist rainbow table and brute-force attacks.
2. **Payload Claims**: Tokens contain subject `sub` (User ID), `role` claim, and `exp` timestamp.
3. **Backend Authorization**: FastAPI dependency injection `get_current_user` extracts and verifies bearer headers on every protected route.""",
            duration_minutes=20,
            order_index=2,
        )
        c1_l3 = Lesson(
            module_id=c1_m2.id,
            title="Relational Schema Design, Foreign Keys, & Constraints",
            content_type="article",
            content_text="""### Relational Integrity with PostgreSQL
StudyHub enforces database integrity directly within PostgreSQL:
- **Foreign Key Cascades**: When a course is deleted, associated modules and lessons cascade delete safely.
- **Unique Constraints**: Students cannot register duplicate enrollments (`uq_user_course_enrollment`).
- **Indexed Fields**: Course titles, category IDs, user emails, and foreign keys are explicitly indexed for sub-millisecond query execution.""",
            duration_minutes=25,
            order_index=1,
        )
        c1_l4 = Lesson(
            module_id=c1_m3.id,
            title="Building Reusable React Components & API Integration",
            content_type="article",
            content_text="""### Single Page Application Architecture
Our frontend utilizes modern React patterns:
- **Auth Context**: Centralized authentication state with Axios interceptor injecting Bearer headers.
- **Modular Components**: Distinct layouts for Student, Instructor, and Admin dashboards.
- **Vanilla CSS Design Tokens**: Defined CSS variables for colors, typography, and spacing ensuring high-performance styling without heavy framework overhead.""",
            duration_minutes=18,
            order_index=1,
        )
        db.add_all([c1_l1, c1_l2, c1_l3, c1_l4])
        db.flush()

        # Add resources for lessons
        r1 = Resource(
            lesson_id=c1_l1.id,
            title="REST API Guidelines & RFC 7231 Summary",
            resource_type="link",
            file_path_or_url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Status",
        )
        r2 = Resource(
            lesson_id=c1_l2.id,
            title="JWT Best Practices & Token Security Handbook",
            resource_type="notes",
            file_path_or_url="https://tools.ietf.org/html/rfc7519",
        )
        db.add_all([r1, r2])
        db.flush()

        # Quiz for Course 1
        q1 = Quiz(
            course_id=course_1.id,
            lesson_id=c1_l2.id,
            title="Full-Stack Web Architecture & Security Quiz",
            description="Test your understanding of REST status codes, JWT claims, and relational integrity.",
            time_limit_minutes=15,
            passing_score=75.0,
        )
        db.add(q1)
        db.flush()

        # Questions for Quiz 1
        q1_quest1 = Question(quiz_id=q1.id, prompt="Which HTTP status code is most appropriate when a client successfully creates a new course resource?", order_index=1)
        q1_quest2 = Question(quiz_id=q1.id, prompt="In JWT authentication, what does the 'sub' claim conventionally represent in the token payload?", order_index=2)
        q1_quest3 = Question(quiz_id=q1.id, prompt="Why is bcrypt preferred over raw SHA-256 for storing user passwords?", order_index=3)
        q1_quest4 = Question(quiz_id=q1.id, prompt="What is the primary function of Alembic in a SQLAlchemy and PostgreSQL project?", order_index=4)
        db.add_all([q1_quest1, q1_quest2, q1_quest3, q1_quest4])
        db.flush()

        # Options for Question 1
        db.add_all([
            AnswerOption(question_id=q1_quest1.id, text="200 OK", is_correct=False),
            AnswerOption(question_id=q1_quest1.id, text="201 Created", is_correct=True),
            AnswerOption(question_id=q1_quest1.id, text="204 No Content", is_correct=False),
            AnswerOption(question_id=q1_quest1.id, text="302 Found", is_correct=False),
        ])

        # Options for Question 2
        db.add_all([
            AnswerOption(question_id=q1_quest2.id, text="The cryptographic algorithm signature", is_correct=False),
            AnswerOption(question_id=q1_quest2.id, text="The subject or unique user identifier", is_correct=True),
            AnswerOption(question_id=q1_quest2.id, text="The server's subscriber host IP", is_correct=False),
            AnswerOption(question_id=q1_quest2.id, text="The subscription expiry duration", is_correct=False),
        ])

        # Options for Question 3
        db.add_all([
            AnswerOption(question_id=q1_quest3.id, text="bcrypt uses adaptive key derivation and built-in salting to mitigate brute-force and rainbow table attacks", is_correct=True),
            AnswerOption(question_id=q1_quest3.id, text="bcrypt produces shorter hashes that save PostgreSQL database storage", is_correct=False),
            AnswerOption(question_id=q1_quest3.id, text="bcrypt can be decrypted by server administrators if a password is lost", is_correct=False),
            AnswerOption(question_id=q1_quest3.id, text="SHA-256 is deprecated by Python 3", is_correct=False),
        ])

        # Options for Question 4
        db.add_all([
            AnswerOption(question_id=q1_quest4.id, text="To serve static files to React clients", is_correct=False),
            AnswerOption(question_id=q1_quest4.id, text="To version-control and apply incremental relational database schema migrations", is_correct=True),
            AnswerOption(question_id=q1_quest4.id, text="To generate mock frontend user interfaces", is_correct=False),
            AnswerOption(question_id=q1_quest4.id, text="To execute in-memory caching", is_correct=False),
        ])
        db.flush()

        print("Creating Course 2: Relational Database Systems & PostgreSQL Mastery...")
        course_2 = Course(
            title="Database Systems & PostgreSQL Mastery",
            slug="database-systems-postgresql-mastery",
            short_description="Deep dive into relational modeling, B-Tree indexes, execution plans, and transaction isolation levels.",
            description="""Learn relational database engineering from fundamentals to high-performance query execution.

Topics covered:
- Normal forms (1NF, 2NF, 3NF, BCNF)
- Index structures: B-Tree, Hash, GIN, GiST
- EXPLAIN ANALYZE query profiling
- Multi-Version Concurrency Control (MVCC) and ACID properties
- Database normalization vs denormalization trade-offs""",
            instructor_id=instructor_2.id,
            category_id=cat_database.id,
            level="advanced",
            status="published",
            thumbnail_url="https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=80",
        )
        db.add(course_2)
        db.flush()

        c2_m1 = Module(course_id=course_2.id, title="Module 1: Database Normalization & Modeling", order_index=1)
        c2_m2 = Module(course_id=course_2.id, title="Module 2: PostgreSQL Indexing & Optimization", order_index=2)
        db.add_all([c2_m1, c2_m2])
        db.flush()

        c2_l1 = Lesson(
            module_id=c2_m1.id,
            title="First Through Third Normal Forms in Relational DBs",
            content_type="article",
            content_text="""### Relational Normalization Essentials
Normalization is the process of structuring a relational database to reduce data redundancy and improve data integrity:
- **1NF**: Atomic column values, unique rows.
- **2NF**: In 1NF and all non-key attributes fully functionally dependent on the entire primary key.
- **3NF**: In 2NF and no transitive functional dependencies between non-key attributes.""",
            duration_minutes=25,
            order_index=1,
        )
        c2_l2 = Lesson(
            module_id=c2_m2.id,
            title="Understanding B-Tree Indexes and EXPLAIN ANALYZE",
            content_type="article",
            content_text="""### PostgreSQL Indexing
Indexes allow the query planner to bypass expensive sequential table scans:
- **B-Tree**: Default balanced search tree supporting equality and range queries (`<`, `<=`, `=`, `>=`, `>`).
- **EXPLAIN ANALYZE**: Runs the SQL statement and displays actual execution timings and row counts across each plan node.""",
            duration_minutes=30,
            order_index=1,
        )
        db.add_all([c2_l1, c2_l2])
        db.flush()

        print("Creating Course 3: Modern UI/UX Design Systems & Web Accessibility...")
        course_3 = Course(
            title="Modern UI/UX Design Systems & Accessibility",
            slug="modern-ui-ux-design-systems-accessibility",
            short_description="Design polished, responsive, and accessible user experiences using modern CSS and component systems.",
            description="""Learn the principles of enterprise user experience and design systems.

We cover:
- CSS Custom Properties (Variables) for theming and design tokens
- Responsive grid and flexbox layouts
- Semantic HTML and WCAG 2.1 accessibility compliance
- Keyboard navigation and screen reader support""",
            instructor_id=instructor_1.id,
            category_id=cat_uiux.id,
            level="beginner",
            status="published",
            thumbnail_url="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80",
        )
        db.add(course_3)
        db.flush()

        c3_m1 = Module(course_id=course_3.id, title="Module 1: Design Tokens & CSS Variables", order_index=1)
        db.add(c3_m1)
        db.flush()

        c3_l1 = Lesson(
            module_id=c3_m1.id,
            title="Design Tokens, Spacing Scales & Color Harmony",
            content_type="article",
            content_text="""### Design Systems with Vanilla CSS
Design tokens encapsulate visual design choices:
- `--color-primary`, `--color-background`, `--color-surface`
- Spacing scale: `4px`, `8px`, `16px`, `24px`, `32px`
- Accessible contrast ratios (WCAG AA requires 4.5:1 for normal text).""",
            duration_minutes=15,
            order_index=1,
        )
        db.add(c3_l1)
        db.flush()

        print("Creating Student Enrollments & Progress...")
        # Enroll student_1 in Course 1 and Course 2
        enr_1 = Enrollment(user_id=student_1.id, course_id=course_1.id, status="active")
        enr_2 = Enrollment(user_id=student_1.id, course_id=course_2.id, status="completed", completed_at=datetime.datetime.utcnow())
        # Enroll student_2 in Course 1
        enr_3 = Enrollment(user_id=student_2.id, course_id=course_1.id, status="active")
        db.add_all([enr_1, enr_2, enr_3])
        db.flush()

        # Mark student_1 progress: Lesson 1 & 2 completed in Course 1 (50% progress)
        p1 = LessonProgress(user_id=student_1.id, lesson_id=c1_l1.id, is_completed=True, completed_at=datetime.datetime.utcnow())
        p2 = LessonProgress(user_id=student_1.id, lesson_id=c1_l2.id, is_completed=True, completed_at=datetime.datetime.utcnow())
        # Mark student_1 progress in Course 2 (100% completed)
        p3 = LessonProgress(user_id=student_1.id, lesson_id=c2_l1.id, is_completed=True, completed_at=datetime.datetime.utcnow())
        p4 = LessonProgress(user_id=student_1.id, lesson_id=c2_l2.id, is_completed=True, completed_at=datetime.datetime.utcnow())
        db.add_all([p1, p2, p3, p4])
        db.flush()

        # Record a successful quiz attempt for student_1
        attempt_1 = QuizAttempt(
            quiz_id=q1.id,
            user_id=student_1.id,
            score=100.0,
            passed=True,
            started_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2),
            completed_at=datetime.datetime.utcnow() - datetime.timedelta(hours=1, minutes=50),
        )
        db.add(attempt_1)
        db.flush()

        # Add attempted answers
        db.add_all([
            AttemptAnswer(attempt_id=attempt_1.id, question_id=q1_quest1.id, is_correct=True),
            AttemptAnswer(attempt_id=attempt_1.id, question_id=q1_quest2.id, is_correct=True),
            AttemptAnswer(attempt_id=attempt_1.id, question_id=q1_quest3.id, is_correct=True),
            AttemptAnswer(attempt_id=attempt_1.id, question_id=q1_quest4.id, is_correct=True),
        ])
        db.flush()

        print("Creating Course Discussion Threads & Replies...")
        dt1 = DiscussionThread(
            course_id=course_1.id,
            user_id=student_1.id,
            title="Best practices for storing JWT tokens in Single Page Applications?",
            content="Hello everyone! When implementing JWT auth with React, should we store the token in httpOnly cookies or application state? What are the practical trade-offs regarding XSS and CSRF?",
        )
        db.add(dt1)
        db.flush()

        dr1 = DiscussionReply(
            thread_id=dt1.id,
            user_id=instructor_1.id,
            content="Great question, Ada! httpOnly cookies prevent JavaScript reading the token directly (protecting against XSS token exfiltration), but require CSRF mitigation (SameSite cookies or CSRF tokens). Storing short-lived tokens in memory or secure storage with automatic refresh is also a very popular modern architecture.",
        )
        dr2 = DiscussionReply(
            thread_id=dt1.id,
            user_id=student_2.id,
            content="Thanks Professor! We also implemented backend role checks on every FastAPI endpoint, which ensures defense-in-depth regardless of where the token is held.",
        )
        db.add_all([dr1, dr2])
        db.flush()

        print("Creating Bookmarks & Notifications...")
        bm1 = Bookmark(user_id=student_1.id, course_id=course_3.id)
        db.add(bm1)

        notif1 = Notification(
            user_id=student_1.id,
            title="Welcome to StudyHub!",
            message="Welcome to StudyHub Academic Learning Platform. Start exploring courses from your student dashboard.",
            is_read=True,
        )
        notif2 = Notification(
            user_id=student_1.id,
            title="Quiz Passed: Full-Stack Web Architecture",
            message="Congratulations! You scored 100% on the Full-Stack Web Architecture & Security Quiz.",
            is_read=False,
        )
        db.add_all([notif1, notif2])

        db.commit()
        print("✅ Database successfully seeded with realistic academic demonstration data!")
        print("\n--- DEMO USER CREDENTIALS ---")
        print("👤 Administrator : admin@studyhub.edu      | Password: Admin@123")
        print("👤 Instructor    : instructor@studyhub.edu | Password: Instructor@123")
        print("👤 Student       : student@studyhub.edu    | Password: Student@123")
        print("👤 Student 2     : student2@studyhub.edu   | Password: Student@123")
        print("-----------------------------\n")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise e
    finally:
        if custom_db is None:
            db.close()


if __name__ == "__main__":
    seed_database()
