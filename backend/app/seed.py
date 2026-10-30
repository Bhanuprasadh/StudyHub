import sys
import os
import datetime

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from sqlalchemy import text
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
from app.models.payment import Payment
from app.services.auth import hash_password


def get_or_create_user(db, email, full_name, role, password, bio, avatar_url):
    user = db.query(User).filter(User.email == email.lower()).first()
    if not user:
        user = User(
            email=email.lower(),
            hashed_password=hash_password(password),
            full_name=full_name,
            role=role,
            bio=bio,
            avatar_url=avatar_url,
            is_active=True,
        )
        db.add(user)
        db.flush()
    else:
        user.full_name = full_name
        user.role = role
        user.bio = bio
        user.avatar_url = avatar_url
        user.is_active = True
        db.flush()
    return user


def get_or_create_category(db, name, slug, description, icon):
    cat = db.query(Category).filter(Category.slug == slug).first()
    if not cat:
        cat = Category(name=name, slug=slug, description=description, icon=icon)
        db.add(cat)
        db.flush()
    else:
        cat.name = name
        cat.description = description
        cat.icon = icon
        db.flush()
    return cat


def sync_course(db, slug, title, short_description, description, instructor_id, category_id, level, thumbnail_url, price=499):
    course = Course(
        title=title,
        slug=slug,
        short_description=short_description,
        description=description,
        instructor_id=instructor_id,
        category_id=category_id,
        level=level,
        status="published",
        thumbnail_url=thumbnail_url,
        price=price,
    )
    db.add(course)
    db.flush()
    return course


def seed_database():
    print("🌱 Initializing StudyHub Database Seeder (Safe & Persistent Mode)...")
    db = SessionLocal()

    try:
        # Ensure all tables exist without dropping registered student accounts
        Base.metadata.create_all(bind=engine)
        db.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0;"))
        db.commit()

        # Truncate content tables and reset their auto-increment sequences
        # NOTE: The 'users' table is NOT truncated! All registered student and instructor accounts are preserved!
        print("Synchronizing course schema and resetting curriculum sequences (preserving all registered users)...")
        db.execute(text("TRUNCATE TABLE payments, quiz_attempts, attempt_answers, answer_options, quiz_questions, quizzes, lesson_progress, lessons, modules, enrollments, bookmarks, discussion_replies, discussion_threads, resources, courses, categories CASCADE;"))
        db.execute(text("ALTER SEQUENCE courses_id_seq RESTART WITH 1;"))
        db.execute(text("ALTER SEQUENCE modules_id_seq RESTART WITH 1;"))
        db.execute(text("ALTER SEQUENCE lessons_id_seq RESTART WITH 1;"))
        db.execute(text("ALTER SEQUENCE quizzes_id_seq RESTART WITH 1;"))
        db.execute(text("ALTER SEQUENCE quiz_questions_id_seq RESTART WITH 1;"))
        db.execute(text("ALTER SEQUENCE answer_options_id_seq RESTART WITH 1;"))
        db.execute(text("ALTER SEQUENCE categories_id_seq RESTART WITH 1;"))
        try:
            db.execute(text("ALTER SEQUENCE payments_id_seq RESTART WITH 1;"))
        except Exception:
            pass
        db.commit()

        print("Preserving registered accounts and seeding core demo users...")
        admin_user = get_or_create_user(
            db,
            email="admin@studyhub.edu",
            full_name="Dr. Eleanor Vance",
            role=UserRole.ADMIN.value,
            password="Admin@123",
            bio="Dean of Academic Computing & StudyHub Platform Administrator.",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        )

        instructor_1 = get_or_create_user(
            db,
            email="instructor@studyhub.edu",
            full_name="Prof. Alan Turing",
            role=UserRole.INSTRUCTOR.value,
            password="Instructor@123",
            bio="Senior Professor of Computer Systems & Distributed Web Architecture.",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        )

        instructor_2 = get_or_create_user(
            db,
            email="sarah.connor@studyhub.edu",
            full_name="Dr. Sarah Connor",
            role=UserRole.INSTRUCTOR.value,
            password="Instructor@123",
            bio="Database Architect and Cloud Infrastructure Specialist.",
            avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        )

        student_1 = get_or_create_user(
            db,
            email="student@studyhub.edu",
            full_name="Ada Lovelace",
            role=UserRole.STUDENT.value,
            password="Student@123",
            bio="M.Tech Full-Stack Web Engineering Student passionate about modern APIs & UI.",
            avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        )

        student_2 = get_or_create_user(
            db,
            email="student2@studyhub.edu",
            full_name="Bhanu Prasad",
            role=UserRole.STUDENT.value,
            password="Student@123",
            bio="Graduate Scholar researching High Performance Web Frameworks.",
            avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        )

        print("Configuring academic course categories...")
        cat_fullstack = get_or_create_category(
            db,
            name="Full-Stack Web Engineering",
            slug="full-stack-web-engineering",
            description="End-to-end web architecture, APIs, modern frontend frameworks, and cloud deployment.",
            icon="Layers",
        )
        cat_database = get_or_create_category(
            db,
            name="Database Systems & PostgreSQL",
            slug="database-systems-postgresql",
            description="Relational database modeling, query optimization, indexing, and ACID transactions.",
            icon="Database",
        )
        cat_uiux = get_or_create_category(
            db,
            name="UI/UX & Frontend Architecture",
            slug="ui-ux-frontend-architecture",
            description="Design systems, CSS variables, web accessibility, and responsive user interfaces.",
            icon="Palette",
        )
        cat_cloud = get_or_create_category(
            db,
            name="Cloud & DevOps Engineering",
            slug="cloud-devops-engineering",
            description="Continuous integration, containerization, microservices, and web security.",
            icon="Cloud",
        )
        cat_security = get_or_create_category(
            db,
            name="System Design & Web Security",
            slug="system-design-web-security",
            description="Distributed system architecture, high availability, caching tiers, and OWASP mitigation.",
            icon="Shield",
        )

        # =========================================================================
        # COURSE 1: Full-Stack Web Engineering with FastAPI & React
        # =========================================================================
        print("Authoring Course 1: Full-Stack Web Engineering with FastAPI & React...")
        course_1 = sync_course(
            db,
            slug="full-stack-web-engineering-fastapi-react",
            title="Full-Stack Web Engineering with FastAPI & React",
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
            thumbnail_url="/images/course-1-fastapi-react.jpg",
            price=499,
        )

        c1_m0 = Module(course_id=course_1.id, title="Section 0: Course Roadmap & Engineering Pathway", order_index=0)
        c1_m1 = Module(course_id=course_1.id, title="Module 1: REST API Architecture & OpenAPI Standards", order_index=1)
        c1_m2 = Module(course_id=course_1.id, title="Module 2: Relational Modeling & SQLAlchemy ORM", order_index=2)
        c1_m3 = Module(course_id=course_1.id, title="Module 3: React Frontend & Interactive State", order_index=3)
        db.add_all([c1_m0, c1_m1, c1_m2, c1_m3])
        db.flush()

        c1_l0 = Lesson(
            module_id=c1_m0.id,
            title="Full-Stack Architecture Roadmap, Prerequisites & Milestones",
            content_type="article",
            duration_minutes=20,
            order_index=1,
            content_text="""## 🗺️ Academic Engineering Roadmap: Full-Stack Architecture

Welcome to the **Full-Stack Web Engineering with FastAPI & React** masterclass. This curriculum is designed to transform you from writing ad-hoc scripts to architecting enterprise-grade distributed web applications.

```roadmap
┌────────────────────────┐      ┌──────────────────────────┐      ┌─────────────────────────┐
│ 1. Client Architecture │ ───> │ 2. REST API & Validation │ ───> │ 3. JWT Auth & Security  │
│ (React 18 / Vite / CSS)│      │  (FastAPI / Pydantic v2) │      │ (Stateless Bearer / RBAC)│
└────────────────────────┘      └──────────────────────────┘      └─────────────────────────┘
                                                                               │
                                                                               ▼
┌────────────────────────┐      ┌──────────────────────────┐      ┌─────────────────────────┐
│ 5. Automated CI Tests  │ <─── │ 4. Database Layer        │ <───┘ 3b. Alembic Migrations │
│  (Pytest & Vitest)     │      │ (PostgreSQL / SQLAlchemy)│      │  (Version-controlled DDL)│
└────────────────────────┘      └──────────────────────────┘      └─────────────────────────┘
```

---

### 🎯 Core Learning Objectives & Milestone Breakdown

1. **Milestone 1 — API Specifications & Contract-First Design**:
   - Master the HTTP/1.1 and HTTP/2 wire protocol constraints (RFC 7231).
   - Leverage Pydantic v2 for strict type checking, serialization, and automatic schema derivation.
   - Build auto-documenting OpenAPI 3.1 endpoints with Swagger UI and ReDoc.

2. **Milestone 2 — Relational Persistence & Schema Migrations**:
   - Model normalized Third Normal Form (3NF) relational databases in PostgreSQL.
   - Employ SQLAlchemy 2.0 declarative models with composite indexes, foreign key cascades, and check constraints.
   - Version-control relational DDL using Alembic linear revision migrations.

3. **Milestone 3 — Cryptographic Security & RBAC**:
   - Implement stateless JSON Web Token (JWT) authorization using HMAC-SHA256 (HS256).
   - Defend against rainbow table attacks using `bcrypt` key derivation with automatic salt generation.
   - Enforce role-based access control (Student, Instructor, Admin) across endpoints via FastAPI dependency injection.

4. **Milestone 4 — High-Performance Component UI**:
   - Build accessible single-page applications (SPA) using React 18 hooks and context state management.
   - Avoid bloated CSS utility libraries by engineering a scalable design system using pure CSS custom properties.
   - Implement Axios interceptors for automated token attachment, 401 handling, and optimistic UI updates.

---

### 📚 Official Documentation & Authoritative References

| Technology | Documentation Scope | Official Link |
| :--- | :--- | :--- |
| **FastAPI** | Routing, Dependency Injection, Validation | [https://fastapi.tiangolo.com](https://fastapi.tiangolo.com) |
| **Pydantic v2** | Data parsing, type coercion, field constraints | [https://docs.pydantic.dev/latest/](https://docs.pydantic.dev/latest/) |
| **React** | Component lifecycle, hooks, virtual DOM reconciliation | [https://react.dev](https://react.dev) |
| **SQLAlchemy 2.0** | Core, ORM Mapped Classes, Session transactions | [https://docs.sqlalchemy.org/en/20/](https://docs.sqlalchemy.org/en/20/) |
| **Alembic** | Revision history, branches, autogenerate migrations | [https://alembic.sqlalchemy.org](https://alembic.sqlalchemy.org) |
| **MDN Web Docs** | HTTP Status Codes, CORS, Web Security | [https://developer.mozilla.org](https://developer.mozilla.org) |

> [!NOTE]
> Throughout this course, code examples reflect modern 2026 industry conventions: Python 3.12+ type hints, SQLAlchemy 2.0 `Mapped` and `mapped_column`, and React 18 functional patterns. Avoid legacy tutorials using SQLAlchemy 1.4 or class-based React components.""",
        )

        c1_l1 = Lesson(
            module_id=c1_m1.id,
            title="REST API Architecture Principles and HTTP Status Standards",
            content_type="article",
            duration_minutes=25,
            order_index=1,
            content_text="""## 🏛️ REST API Architecture & Architectural Constraints

Representational State Transfer (REST) is an architectural style first formalized by Roy Fielding in his 2000 doctoral dissertation. When implemented correctly, REST guarantees high scalability, independent deployability, and cacheability.

### 1. The Six Architectural Constraints of REST
1. **Client-Server Decoupling**: Separation of concerns allows client UIs and server logic to evolve independently.
2. **Stateless Operations**: No client session state is retained on the server. Every request carries its own authorization credentials.
3. **Cacheability**: Responses explicitly declare whether they are cacheable (`Cache-Control: public, max-age=3600`) to eliminate unnecessary network round-trips.
4. **Uniform Interface**: Resource identification via stable URIs (`/api/v1/courses/10`), resource manipulation through standard verbs, self-descriptive messages, and HATEOAS.
5. **Layered System**: Clients cannot determine whether they connect directly to the origin server, a reverse proxy (e.g. NGINX), or a load balancer.
6. **Code on Demand (Optional)**: Servers can temporarily extend client functionality by transferring executable code (e.g., compiled JS).

---

### 2. HTTP Methods & Idempotency Rules

| Verb | Safe | Idempotent | RFC Specification | Ideal Usage |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | **Yes** | **Yes** | RFC 7231 §4.3.1 | Fetch resource representations without side-effects |
| `POST` | **No** | **No** | RFC 7231 §4.3.3 | Create a new subordinate resource or trigger an action |
| `PUT` | **No** | **Yes** | RFC 7231 §4.3.4 | Replace an entire resource representation |
| `PATCH` | **No** | **No** | RFC 5789 | Apply partial delta modifications to a resource |
| `DELETE`| **No** | **Yes** | RFC 7231 §4.3.5 | Remove a resource representation permanently |

---

### 3. Production FastAPI Implementation

Here is how StudyHub implements these principles with Pydantic validation:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter(prefix="/courses", tags=["Courses"])

class CourseCreateRequest(BaseModel):
    title: str = Field(min_length=3, max_length=150, description="Unique course title")
    description: str = Field(min_length=10, description="Full markdown syllabus")
    level: str = Field(default="beginner", pattern="^(beginner|intermediate|advanced)$")

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_course(payload: CourseCreateRequest):
    # Returns 201 Created with Location header as prescribed by RFC 7231
    return {"message": "Course created successfully", "course": payload.model_dump()}
```

> 💡 **Engineering Tip**: Always return `201 Created` when creating a resource. Returning `200 OK` on resource creation violates REST semantic standards and confuses HTTP caching intermediaries.

---

### 📚 Official References & IETF Standards

| Standard Document | Issuing Organization | Scope | Link |
| :--- | :--- | :--- | :--- |
| **RFC 7231 HTTP/1.1 Semantics** | IETF | HTTP Verbs, Idempotency, Status Codes | [https://datatracker.ietf.org/doc/html/rfc7231](https://datatracker.ietf.org/doc/html/rfc7231) |
| **RFC 5789 PATCH Method** | IETF | Partial Delta Updates | [https://datatracker.ietf.org/doc/html/rfc5789](https://datatracker.ietf.org/doc/html/rfc5789) |
| **FastAPI Status Codes** | Tiangolo | Status Code Constants & Enums | [https://fastapi.tiangolo.com/tutorial/response-status-code/](https://fastapi.tiangolo.com/tutorial/response-status-code/) |""",
        )

        c1_l2 = Lesson(
            module_id=c1_m1.id,
            title="JWT Authentication, Password Salting & Token Lifecycle",
            content_type="article",
            duration_minutes=30,
            order_index=2,
            content_text="""## 🔐 Stateless JWT Authentication & Cryptographic Hashing

Stateless authentication allows backend instances to verify client authenticity without reading session records from an in-memory database on every request.

### 1. Cryptographic Password Salting with Bcrypt
Raw hash functions like SHA-256 or MD5 are designed to be fast, making them dangerously susceptible to GPU-accelerated brute-force attacks and precomputed rainbow tables.

`bcrypt` provides two vital security layers:
1. **Automatic Salt Generation**: A 128-bit random salt is prepended to the plaintext password, ensuring that identical passwords produce completely distinct hashes.
2. **Adaptive Cost Factor**: The workload factor (rounds) can be incrementally tuned over time as computational hardware accelerates.

```python
import bcrypt

def hash_password(password: str) -> str:
    # 12 rounds is standard for academic and enterprise workloads
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
```

---

### 2. Anatomy of a JSON Web Token (RFC 7519)
A JWT consists of three Base64URL-encoded segments separated by periods:
`header.payload.signature`

- **Header**: Contains the signing algorithm (`{"alg": "HS256", "typ": "JWT"}`).
- **Payload**: Contains standard claims (`sub`, `role`, `exp`, `iat`).
- **Signature**: Computed using the secret key: `HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), SECRET_KEY)`.

```python
import jwt
import datetime

SECRET_KEY = "studyhub_super_secret_jwt_key_for_mtech_project_2026_dev"
ALGORITHM = "HS256"

def create_access_token(user_id: int, role: str) -> str:
    expire = datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=24)
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
        "iat": datetime.datetime.now(datetime.UTC),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
```

> ⚠️ **Common Pitfall**: Never store sensitive passwords or credit card numbers in the JWT payload! The payload is merely Base64 encoded—anyone in possession of the token can decode and inspect it. It is protected against tampering, not inspection.

---

### 3. Standard JWT Claims Specification

| Claim | Full Name | Type | Description & RFC Standard |
| :--- | :--- | :--- | :--- |
| `sub` | Subject | `String` | Unique user identity or primary key identifier |
| `role` | Role / Scope | `String` | Role-based authorization claim (`student`, `instructor`, `admin`) |
| `exp` | Expiration Time | `Integer` | Unix epoch timestamp indicating token expiration |
| `iat` | Issued At | `Integer` | Timestamp of token generation for replay verification |
| `iss` | Issuer | `String` | Domain or authentication authority issuing the token |

---

### 📚 Official References & Security RFCs

- **RFC 7519 JSON Web Token Specification**: [https://datatracker.ietf.org/doc/html/rfc7519](https://datatracker.ietf.org/doc/html/rfc7519)
- **PyJWT Documentation**: [https://pyjwt.readthedocs.io/](https://pyjwt.readthedocs.io/)
- **OWASP JWT Cheat Sheet**: [https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)""",
        )

        c1_l3 = Lesson(
            module_id=c1_m2.id,
            title="Relational Schema Design, Foreign Keys & SQLAlchemy 2.0 ORM",
            content_type="article",
            duration_minutes=30,
            order_index=1,
            content_text="""## 🗄️ Relational Schema Design & SQLAlchemy 2.0 ORM

Relational database management systems (RDBMS) guarantee ACID compliance (Atomicity, Consistency, Isolation, Durability). In StudyHub, we structure data in Third Normal Form (3NF) to eliminate insertion, update, and deletion anomalies.

### 1. StudyHub Normalized Relationship Topology
```roadmap
┌────────────────────┐          ┌───────────────────────┐          ┌─────────────────────┐
│       users        │ 1      * │        courses        │ 1      * │       modules       │
│ (id, email, role)  ├──────────┤(id, title, instructor)├──────────┤ (id, course_id, idx)│
└─────────┬──────────┘          └───────────┬───────────┘          └──────────┬──────────┘
          │                                 │                                 │
          │ 1                             1 │                               1 │
          │ *                             * │                               * │
┌─────────▼──────────┐          ┌───────────▼───────────┐          ┌──────────▼──────────┐
│    enrollments     │          │    course_reviews     │          │       lessons       │
│(user_id, course_id)│          │(user_id, course_id)   │          │(module_id, content) │
└────────────────────┘          └───────────────────────┘          └─────────────────────┘
```

---

### 2. Modern SQLAlchemy 2.0 Unified Declarative Syntax

```python
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Index
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    slug = Column(String(250), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=False)
    instructor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Relationships with cascading lifecycle management
    modules = relationship("Module", back_populates="course", cascade="all, delete-orphan", order_by="Module.order_index")
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_course_search", "title", "slug"),
    )
```

---

### 3. SQLAlchemy 2.0 Relationship Cascades & Patterns

| Relationship Type | Foreign Key Placement | Relationship Directive | Cascade Mode |
| :--- | :--- | :--- | :--- |
| **One-to-Many** | Child Table (`module.course_id`) | `relationship("Module", back_populates="course")` | `all, delete-orphan` |
| **Many-to-One** | Child Table (`module.course_id`) | `relationship("Course", back_populates="modules")` | Default (Restrict) |
| **Many-to-Many** | Association Table (`enrollments`) | `secondary="enrollments"` | Passive deletes |

---

### 📚 Official References & Documentation

- **SQLAlchemy 2.0 Unified Tutorial**: [https://docs.sqlalchemy.org/en/20/tutorial/index.html](https://docs.sqlalchemy.org/en/20/tutorial/index.html)
- **PostgreSQL Referential Integrity & Foreign Keys**: [https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK)""",
        )

        c1_l4 = Lesson(
            module_id=c1_m3.id,
            title="Building Reusable React Components & Axios State Interceptors",
            content_type="article",
            duration_minutes=25,
            order_index=1,
            content_text="""## ⚛️ Modern React Architecture & Centralized API Interceptors

When architecting a React Single-Page Application (SPA), state management and network synchronization must remain separated from presentation components.

### 1. Centralized Axios Interceptors
Instead of manually adding authorization headers in every component, configure an Axios singleton:

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Automatically inject JWT Bearer Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('studyhub_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

---

### 2. High-Performance Design Tokens over Bloated Frameworks

Rather than pulling in hundreds of kilobytes of CSS utility overhead, StudyHub implements a clean token layer:

| Dimension | Pure CSS Token System | Utility CSS Frameworks |
| :--- | :--- | :--- |
| **Bundle Size Overhead** | **0 KB** (Native browser variables) | 50 KB – 300 KB generated classes |
| **Theming (Dark Mode)** | Instant runtime variable switch | Complex class swapping |
| **HTML Semantic Clarity** | Clean, readable component classnames | Cluttered multi-line string classes |
| **Rendering Performance** | Native CSS engine optimization | JavaScript class parsing overhead |

---

### 📚 Official References & Guides

- **React Official Documentation**: [https://react.dev](https://react.dev)
- **Axios HTTP Client Guide**: [https://axios-http.com/docs/intro](https://axios-http.com/docs/intro)
- **MDN CSS Custom Properties**: [https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)""",
        )

        db.add_all([c1_l0, c1_l1, c1_l2, c1_l3, c1_l4])
        db.flush()

        db.add_all([
            Resource(lesson_id=c1_l0.id, title="Official FastAPI Documentation & Interactive Tutorial", resource_type="link", file_path_or_url="https://fastapi.tiangolo.com/"),
            Resource(lesson_id=c1_l0.id, title="Official React 18/19 Documentation", resource_type="link", file_path_or_url="https://react.dev/"),
            Resource(lesson_id=c1_l0.id, title="Official SQLAlchemy 2.0 Unified Manual", resource_type="link", file_path_or_url="https://docs.sqlalchemy.org/en/20/"),
            Resource(lesson_id=c1_l1.id, title="REST API Guidelines & RFC 7231 Summary", resource_type="link", file_path_or_url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Status"),
            Resource(lesson_id=c1_l2.id, title="JWT Best Practices & Token Security Handbook", resource_type="notes", file_path_or_url="https://tools.ietf.org/html/rfc7519"),
        ])
        db.flush()

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

        q1_quest1 = Question(quiz_id=q1.id, prompt="Which HTTP status code is most appropriate when a client successfully creates a new course resource?", order_index=1)
        q1_quest2 = Question(quiz_id=q1.id, prompt="In JWT authentication, what does the 'sub' claim conventionally represent in the token payload?", order_index=2)
        q1_quest3 = Question(quiz_id=q1.id, prompt="Why is bcrypt preferred over raw SHA-256 for storing user passwords?", order_index=3)
        q1_quest4 = Question(quiz_id=q1.id, prompt="What is the primary function of Alembic in a SQLAlchemy and PostgreSQL project?", order_index=4)
        db.add_all([q1_quest1, q1_quest2, q1_quest3, q1_quest4])
        db.flush()

        db.add_all([
            AnswerOption(question_id=q1_quest1.id, text="200 OK", is_correct=False),
            AnswerOption(question_id=q1_quest1.id, text="201 Created", is_correct=True),
            AnswerOption(question_id=q1_quest1.id, text="204 No Content", is_correct=False),
            AnswerOption(question_id=q1_quest1.id, text="302 Found", is_correct=False),
            AnswerOption(question_id=q1_quest2.id, text="The cryptographic algorithm signature", is_correct=False),
            AnswerOption(question_id=q1_quest2.id, text="The subject or unique user identifier", is_correct=True),
            AnswerOption(question_id=q1_quest2.id, text="The server's subscriber host IP", is_correct=False),
            AnswerOption(question_id=q1_quest2.id, text="The subscription expiry duration", is_correct=False),
            AnswerOption(question_id=q1_quest3.id, text="bcrypt uses adaptive key derivation and built-in salting to mitigate brute-force and rainbow table attacks", is_correct=True),
            AnswerOption(question_id=q1_quest3.id, text="bcrypt produces shorter hashes that save PostgreSQL database storage", is_correct=False),
            AnswerOption(question_id=q1_quest3.id, text="bcrypt can be decrypted by server administrators if a password is lost", is_correct=False),
            AnswerOption(question_id=q1_quest3.id, text="SHA-256 is deprecated by Python 3", is_correct=False),
            AnswerOption(question_id=q1_quest4.id, text="To serve static files to React clients", is_correct=False),
            AnswerOption(question_id=q1_quest4.id, text="To version-control and apply incremental relational database schema migrations", is_correct=True),
            AnswerOption(question_id=q1_quest4.id, text="To generate mock frontend user interfaces", is_correct=False),
            AnswerOption(question_id=q1_quest4.id, text="To execute in-memory caching", is_correct=False),
        ])
        db.flush()

        # =========================================================================
        # COURSE 2: Relational Database Systems & PostgreSQL Mastery
        # =========================================================================
        print("Authoring Course 2: Database Systems & PostgreSQL Mastery...")
        course_2 = sync_course(
            db,
            slug="database-systems-postgresql-mastery",
            title="Database Systems & PostgreSQL Mastery",
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
            thumbnail_url="/images/course-2-postgresql.jpg",
            price=799,
        )

        c2_m0 = Module(course_id=course_2.id, title="Section 0: Course Roadmap & Relational Database Pathway", order_index=0)
        c2_m1 = Module(course_id=course_2.id, title="Module 1: Database Normalization & Modeling", order_index=1)
        c2_m2 = Module(course_id=course_2.id, title="Module 2: PostgreSQL Indexing & Optimization", order_index=2)
        c2_m3 = Module(course_id=course_2.id, title="Module 3: ACID Transactions & Concurrency Control", order_index=3)
        db.add_all([c2_m0, c2_m1, c2_m2, c2_m3])
        db.flush()

        c2_l0 = Lesson(
            module_id=c2_m0.id,
            title="Relational Database Engineering Roadmap & Learning Pathway",
            content_type="article",
            duration_minutes=20,
            order_index=1,
            content_text="""## 🗺️ Academic Engineering Roadmap: Database Systems & PostgreSQL

This curriculum is structured for backend architects and data engineers who need to scale database engines from simple queries to millions of transactions per second.

```roadmap
┌────────────────────────┐      ┌──────────────────────────┐      ┌─────────────────────────┐
│ 1. Relational Modeling │ ───> │ 2. ACID & Transactions   │ ───> │ 3. B-Tree & GIN Indexes │
│  (1NF, 2NF, 3NF, BCNF) │      │ (MVCC & Isolation Levels)│      │ (Scan Planning & Cost)  │
└────────────────────────┘      └──────────────────────────┘      └─────────────────────────┘
                                                                               │
                                                                               ▼
┌────────────────────────┐      ┌──────────────────────────┐      ┌─────────────────────────┐
│ 5. Connection Pooling  │ <─── │ 4. EXPLAIN ANALYZE       │ <───┘ 3b. Partial & Composite   │
│  (PgBouncer & Scaling) │      │ (Execution Plan Tuning)  │      │     Indexes Optimization │
└────────────────────────┘      └──────────────────────────┘      └─────────────────────────┘
```

---

### 🎯 Milestone Checkpoints

1. **Milestone 1 — Mathematical Normalization**: Eliminate update, insertion, and deletion anomalies via functional dependency analysis.
2. **Milestone 2 — Index Engineering**: Choose correctly between B-Tree, Hash, GIN, and GiST indexes based on query operators.
3. **Milestone 3 — Concurrency & Locking**: Master Read Committed, Repeatable Read, and Serializable transaction isolation levels.
4. **Milestone 4 — Query Plan Profiling**: Read EXPLAIN ANALYZE output, detect sequential table scans, and eliminate high-cost sorting nodes.

---

### 📚 Official Documentation & Standards

| Core Domain | Authoritative Reference | Official Portal |
| :--- | :--- | :--- |
| **PostgreSQL Engine** | Official PostgreSQL 16 Reference Manual | [https://www.postgresql.org/docs/current/](https://www.postgresql.org/docs/current/) |
| **Index Types & Performance** | PostgreSQL B-Tree, Hash & GIN Manual | [https://www.postgresql.org/docs/current/indexes-types.html](https://www.postgresql.org/docs/current/indexes-types.html) |
| **Execution Planner Tuning** | Using EXPLAIN & Cost Estimation | [https://www.postgresql.org/docs/current/using-explain.html](https://www.postgresql.org/docs/current/using-explain.html) |
| **Concurrency Control** | Transaction Isolation & MVCC Specs | [https://www.postgresql.org/docs/current/transaction-iso.html](https://www.postgresql.org/docs/current/transaction-iso.html) |""",
        )

        c2_l1 = Lesson(
            module_id=c2_m1.id,
            title="First Through Third Normal Forms in Relational DBs",
            content_type="article",
            duration_minutes=25,
            order_index=1,
            content_text="""## 📐 Relational Database Normalization

Normalization is the systematic decomposition of tables to eliminate data redundancy and preserve relational integrity without loss of information.

### 1. First Normal Form (1NF)
A relation is in 1NF if and only if:
- Every attribute contains only atomic (indivisible) values.
- There are no repeating groups or multi-valued columns (e.g. comma-delimited strings in a single field).
- Each record possesses a designated unique primary key.

### 2. Second Normal Form (2NF)
A relation is in 2NF if and only if:
- It is in 1NF.
- Every non-prime attribute is fully functionally dependent on the entire primary key. In other words, there are **no partial dependencies** on composite primary keys.

---

### 3. Third Normal Form (3NF) & Decomposition
A relation is in 3NF if and only if:
- It is in 2NF.
- There are **no transitive dependencies**; non-key columns must depend solely on the primary key, the whole primary key, and nothing but the primary key.

```sql
-- Violates 3NF: department_name depends on department_id, not student_id
CREATE TABLE bad_students (
    student_id INT PRIMARY KEY,
    name VARCHAR(100),
    department_id INT,
    department_name VARCHAR(100) -- Transitive dependency!
);

-- Correct 3NF Decomposition
CREATE TABLE departments (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE students (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department_id INT REFERENCES departments(id) ON DELETE RESTRICT
);
```

---

### 4. Normal Form Comparison Matrix

| Normal Form | Core Requirement | Anomaly Prevented | Real-World Tradeoff |
| :--- | :--- | :--- | :--- |
| **1NF** | Atomic columns, unique primary key | Ambiguous multi-value rows | Low overhead |
| **2NF** | No partial composite-key dependencies | Duplicate non-key data rows | More decomposed tables |
| **3NF** | No transitive non-key dependencies | Inconsistent update anomalies | Requires JOIN queries |
| **BCNF** | Every determinant is a candidate key | Multi-attribute key anomalies | Highest normalization tier |

---

### 📚 Official References & Specifications

- **PostgreSQL DDL & Table Constraints**: [https://www.postgresql.org/docs/current/ddl.html](https://www.postgresql.org/docs/current/ddl.html)
- **Relational Model for Database Management (E.F. Codd)**: [https://dl.acm.org/doi/10.1145/362384.362685](https://dl.acm.org/doi/10.1145/362384.362685)""",
        )

        c2_l2 = Lesson(
            module_id=c2_m2.id,
            title="Understanding B-Tree Indexes and EXPLAIN ANALYZE",
            content_type="article",
            duration_minutes=30,
            order_index=1,
            content_text="""## ⚡ PostgreSQL Indexing & EXPLAIN ANALYZE Profiling

Without indexes, PostgreSQL must scan every 8KB disk page belonging to a table (Sequential Scan). Indexes act as sorted lookup dictionaries.

### 1. B-Tree Index Mechanics
A B-Tree (Balanced Tree) maintains sorted key order with O(log N) search complexity. It excels at:
- Exact equality searches (`WHERE id = 42`)
- Range queries (`WHERE created_at >= '2026-01-01'`)
- Sorting operations (`ORDER BY score DESC`)

---

### 2. Dissecting EXPLAIN ANALYZE Output
`EXPLAIN` calculates estimated planner costs. `EXPLAIN ANALYZE` executes the query and reports actual execution timings:

```sql
EXPLAIN ANALYZE
SELECT id, title FROM courses WHERE instructor_id = 2;
```

Expected output node:
```
Bitmap Heap Scan on courses  (cost=4.20..12.35 rows=4 width=48) (actual time=0.042..0.048 rows=4 loops=1)
  Recheck Cond: (instructor_id = 2)
  ->  Bitmap Index Scan on idx_courses_instructor_id  (cost=0.00..4.20 rows=4 width=0) (actual time=0.018..0.018 rows=4 loops=1)
Planning Time: 0.125 ms
Execution Time: 0.075 ms
```

---

### 3. PostgreSQL Index Types Matrix

| Index Type | Search Complexity | Supported Operators | Best Use Case |
| :--- | :--- | :--- | :--- |
| **B-Tree** | O(log N) | `=`, `<`, `<=`, `>`, `>=`, `BETWEEN` | Primary keys, foreign keys, timestamps, sorting |
| **Hash** | O(1) average | `=` | High-cardinality exact lookups (UUID, string hashes) |
| **GIN** | Inverted Postings | `@>`, `?`, `?&`, `@@` | JSONB documents, full-text search, array containment |
| **GiST** | Generalized Tree | `&&`, `&<`, `<@` | Geometric coordinates, spatial GIS, date range overlaps |
| **BRIN** | Block Range | `=`, `<`, `>` | Multi-gigabyte sequential append-only time series |

---

### 📚 Official References & Manuals

- **PostgreSQL Using EXPLAIN Manual**: [https://www.postgresql.org/docs/current/using-explain.html](https://www.postgresql.org/docs/current/using-explain.html)
- **PostgreSQL Index Types Guide**: [https://www.postgresql.org/docs/current/indexes-types.html](https://www.postgresql.org/docs/current/indexes-types.html)""",
        )

        c2_l3 = Lesson(
            module_id=c2_m3.id,
            title="ACID Transactions, MVCC & Row-Level Locking in PostgreSQL",
            content_type="article",
            duration_minutes=35,
            order_index=1,
            content_text="""## 🔒 ACID Transactions, MVCC & Concurrency Control

PostgreSQL manages high concurrent read and write operations without deadlocks using Multi-Version Concurrency Control (MVCC).

### 1. The ACID Guarantees in PostgreSQL
- **Atomicity**: All operations in a `BEGIN ... COMMIT` block succeed or completely roll back without partial data corruption.
- **Consistency**: All schema constraints (`CHECK`, `FOREIGN KEY`, `UNIQUE`, `NOT NULL`) are strictly verified before state transitions persist.
- **Isolation**: Concurrent transactions cannot observe each other's uncommitted intermediate states.
- **Durability**: Committed data is written to Write-Ahead Logging (WAL) disks before acknowledging success to clients.

---

### 2. ANSI SQL Transaction Isolation Levels

| Isolation Level | Dirty Reads | Non-Repeatable Reads | Phantom Reads | Serialization Anomalies |
| :--- | :--- | :--- | :--- | :--- |
| **Read Uncommitted** | Prevented in Postgres | Possible | Possible | Possible |
| **Read Committed** (Default) | Prevented | Possible | Possible | Possible |
| **Repeatable Read** | Prevented | Prevented | Prevented in Postgres | Possible |
| **Serializable** | Prevented | Prevented | Prevented | Prevented |

---

### 3. Explicit Row-Level Concurrency Locking

```sql
-- Explicit Concurrency Locking
BEGIN;

-- Row-level exclusive lock preventing race conditions in enrollment counting
SELECT id, total_enrollments 
FROM courses 
WHERE id = 1 
FOR UPDATE;

UPDATE courses 
SET total_enrollments = total_enrollments + 1 
WHERE id = 1;

COMMIT;
```

---

### 📚 Official References & Documentation

- **PostgreSQL Transaction Isolation**: [https://www.postgresql.org/docs/current/transaction-iso.html](https://www.postgresql.org/docs/current/transaction-iso.html)
- **Explicit Locking in PostgreSQL**: [https://www.postgresql.org/docs/current/explicit-locking.html](https://www.postgresql.org/docs/current/explicit-locking.html)""",
        )

        db.add_all([c2_l0, c2_l1, c2_l2, c2_l3])
        db.flush()

        db.add_all([
            Resource(lesson_id=c2_l0.id, title="Official PostgreSQL 16 Reference Manual", resource_type="link", file_path_or_url="https://www.postgresql.org/docs/current/"),
            Resource(lesson_id=c2_l0.id, title="Official PostgreSQL Index Types & Anatomy", resource_type="link", file_path_or_url="https://www.postgresql.org/docs/current/indexes-types.html"),
            Resource(lesson_id=c2_l2.id, title="PostgreSQL EXPLAIN ANALYZE Deep Dive Guide", resource_type="link", file_path_or_url="https://www.postgresql.org/docs/current/using-explain.html"),
            Resource(lesson_id=c2_l3.id, title="PostgreSQL Transaction Isolation & MVCC Specs", resource_type="link", file_path_or_url="https://www.postgresql.org/docs/current/transaction-iso.html"),
        ])
        db.flush()

        q2 = Quiz(
            course_id=course_2.id,
            lesson_id=c2_l2.id,
            title="PostgreSQL Relational Optimization & Indexing Quiz",
            description="Evaluate your mastery of normal forms, index structures, and query execution plans.",
            time_limit_minutes=15,
            passing_score=75.0,
        )
        db.add(q2)
        db.flush()

        q2_quest1 = Question(quiz_id=q2.id, prompt="Which normal form specifically addresses transitive functional dependencies between non-key columns?", order_index=1)
        q2_quest2 = Question(quiz_id=q2.id, prompt="What is the primary default index data structure employed by PostgreSQL for scalar comparisons?", order_index=2)
        q2_quest3 = Question(quiz_id=q2.id, prompt="How does EXPLAIN ANALYZE differ from a standard EXPLAIN command in PostgreSQL?", order_index=3)
        q2_quest4 = Question(quiz_id=q2.id, prompt="What is Multi-Version Concurrency Control (MVCC) designed to achieve in PostgreSQL?", order_index=4)
        db.add_all([q2_quest1, q2_quest2, q2_quest3, q2_quest4])
        db.flush()

        db.add_all([
            AnswerOption(question_id=q2_quest1.id, text="First Normal Form (1NF)", is_correct=False),
            AnswerOption(question_id=q2_quest1.id, text="Second Normal Form (2NF)", is_correct=False),
            AnswerOption(question_id=q2_quest1.id, text="Third Normal Form (3NF)", is_correct=True),
            AnswerOption(question_id=q2_quest1.id, text="Denormalization", is_correct=False),
            AnswerOption(question_id=q2_quest2.id, text="B-Tree Index", is_correct=True),
            AnswerOption(question_id=q2_quest2.id, text="Hash Index", is_correct=False),
            AnswerOption(question_id=q2_quest2.id, text="GIN Index", is_correct=False),
            AnswerOption(question_id=q2_quest2.id, text="BRIN Index", is_correct=False),
            AnswerOption(question_id=q2_quest3.id, text="EXPLAIN ANALYZE actually executes the query to return real runtime metrics rather than purely estimated planner costs", is_correct=True),
            AnswerOption(question_id=q2_quest3.id, text="EXPLAIN ANALYZE runs without contacting the database server", is_correct=False),
            AnswerOption(question_id=q2_quest3.id, text="EXPLAIN ANALYZE only works on SQLite", is_correct=False),
            AnswerOption(question_id=q2_quest3.id, text="EXPLAIN ANALYZE automatically adds missing indexes to disk", is_correct=False),
            AnswerOption(question_id=q2_quest4.id, text="Allow readers to not block writers and writers to not block readers by maintaining snapshot row versions", is_correct=True),
            AnswerOption(question_id=q2_quest4.id, text="Lock the entire database file during every read operation", is_correct=False),
            AnswerOption(question_id=q2_quest4.id, text="Encrypt stored passwords with SHA-1", is_correct=False),
            AnswerOption(question_id=q2_quest4.id, text="Eliminate the need for primary keys", is_correct=False),
        ])
        db.flush()

        # =========================================================================
        # COURSE 3: Modern UI/UX Design Systems & Web Accessibility
        # =========================================================================
        print("Authoring Course 3: Modern UI/UX Design Systems & Web Accessibility...")
        course_3 = sync_course(
            db,
            slug="modern-ui-ux-design-systems-accessibility",
            title="Modern UI/UX Design Systems & Accessibility",
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
            thumbnail_url="/images/course-3-uiux-design.jpg",
            price=0,  # Free course
        )

        c3_m0 = Module(course_id=course_3.id, title="Section 0: Course Roadmap & Design System Pathway", order_index=0)
        c3_m1 = Module(course_id=course_3.id, title="Module 1: Design Tokens & CSS Variables", order_index=1)
        c3_m2 = Module(course_id=course_3.id, title="Module 2: Semantic HTML5, ARIA & Web Accessibility", order_index=2)
        db.add_all([c3_m0, c3_m1, c3_m2])
        db.flush()

        c3_l0 = Lesson(
            module_id=c3_m0.id,
            title="UI/UX Architecture Roadmap & Accessibility Benchmarks",
            content_type="article",
            duration_minutes=20,
            order_index=1,
            content_text="""## 🗺️ Academic Engineering Roadmap: UI/UX & Web Accessibility

Master the art of creating inclusive, high-contrast, token-driven web applications that comply with international accessibility standards.

```roadmap
┌────────────────────────┐      ┌──────────────────────────┐      ┌─────────────────────────┐
│ 1. Design Token Scales │ ───> │ 2. CSS Custom Properties │ ───> │ 3. Semantic HTML5 & ARIA│
│ (Color, Spacing, Type) │      │ (Theming & Dark Mode)    │      │ (Landmarks & Live Roles)│
└────────────────────────┘      └──────────────────────────┘      └─────────────────────────┘
                                                                               │
                                                                               ▼
┌────────────────────────┐      ┌──────────────────────────┐      ┌─────────────────────────┐
│ 5. Automated Auditing  │ <─── │ 4. Keyboard Navigation   │ <───┘ 3b. WCAG 2.1 Contrast Ratio│
│  (Lighthouse & Axe-core│      │ (Focus Rings & Taborder) │      │   (4.5:1 AA Standard)   │
└────────────────────────┘      └──────────────────────────┘      └─────────────────────────┘
```

---

### 🎯 Milestone Checkpoints

1. **Milestone 1 — Design Token System**: Formulate consistent color palettes, 4px/8px spacing scales, and typography hierarchies.
2. **Milestone 2 — CSS Custom Properties**: Implement dynamic theme switching (light/dark mode) using pure CSS variables.
3. **Milestone 3 — Semantic HTML5 & ARIA**: Structure pages with `<main>`, `<nav>`, `<article>`, and proper ARIA states (`aria-expanded`, `aria-label`).
4. **Milestone 4 — WCAG 2.1 Level AA Compliance**: Ensure 4.5:1 contrast for normal text and 3:1 for large graphical elements.

---

### 📚 Official Documentation & Standards

| Authority / Spec | Scope | Official Portal |
| :--- | :--- | :--- |
| **W3C WCAG 2.1 Guidelines** | Contrast Ratios, Perceivable, Operable, Understandable | [https://www.w3.org/TR/WCAG21/](https://www.w3.org/TR/WCAG21/) |
| **MDN CSS Custom Properties** | Pure CSS runtime tokens and dynamic theme switching | [https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) |
| **W3C WAI-ARIA Practices (APG)** | Accessible widget design patterns, roles, states | [https://www.w3.org/WAI/ARIA/apg/](https://www.w3.org/WAI/ARIA/apg/) |""",
        )

        c3_l1 = Lesson(
            module_id=c3_m1.id,
            title="Design Tokens, Spacing Scales & Color Harmony",
            content_type="article",
            duration_minutes=25,
            order_index=1,
            content_text="""## 🎨 Design Systems with CSS Custom Properties

Design tokens are visual design atoms: named entities storing raw values for color, spacing, typography, and elevation.

### 1. Spacing & Typography Scale Definition
```css
:root {
  /* 4px/8px Harmonic Scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* Typography Scale */
  --font-xs: 0.75rem;   /* 12px */
  --font-sm: 0.875rem;  /* 14px */
  --font-base: 1rem;    /* 16px */
  --font-lg: 1.125rem;  /* 18px */
  --font-xl: 1.25rem;   /* 20px */
  --font-2xl: 1.5rem;   /* 24px */
  --font-3xl: 2rem;     /* 32px */
}
```

---

### 2. WCAG 2.1 Contrast Requirements Matrix

| UI Content Type | Level AA Minimum | Level AAA Enhanced | Applicable Elements |
| :--- | :--- | :--- | :--- |
| **Normal Text (< 18pt)** | **4.5:1** | **7.0:1** | Body paragraphs, captions, form input labels |
| **Large Text (>= 18pt or 14pt bold)** | **3.0:1** | **4.5:1** | Page titles, hero banners, prominent badges |
| **User Interface Components** | **3.0:1** | **4.5:1** | Input border outlines, button focus rings |
| **Graphical Objects** | **3.0:1** | **3.0:1** | Standalone informative icons, chart elements |

---

### 📚 Official References & Specifications

- **W3C Design Tokens Community Group**: [https://design-tokens.github.io/community-group/format/](https://design-tokens.github.io/community-group/format/)
- **MDN CSS Custom Properties Guide**: [https://developer.mozilla.org/en-US/docs/Web/CSS/--*](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- **WebAIM Contrast Matrix Guide**: [https://webaim.org/resources/contrastchecker/](https://webaim.org/resources/contrastchecker/)""",
        )

        c3_l2 = Lesson(
            module_id=c3_m2.id,
            title="Accessible Form Controls, Focus Indicators & ARIA",
            content_type="article",
            duration_minutes=25,
            order_index=1,
            content_text="""## ♿ Semantic HTML5, Focus Management & ARIA Roles

Building accessible applications ensures that students relying on keyboard navigation or screen readers have an equivalent learning experience.

### 1. The Five Rules of ARIA
1. **If you can use a native HTML5 element with the semantics you need, do so instead of re-purposing an element with ARIA.** (e.g., use `<button>` instead of `<div role="button">`).
2. **Do not change native semantics unless you have to.**
3. **All interactive ARIA controls must be usable with the keyboard.**
4. **Do not use `role="presentation"` or `aria-hidden="true"` on a visible focusable element.**
5. **All interactive elements must have an accessible name.**

---

### 2. Focus Visible Styles & Keyboard Navigation

```css
/* Never write 'outline: none' without an accessible focus indicator! */
button:focus-visible, 
a:focus-visible, 
input:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px var(--primary-light);
}
```

---

### 3. HTML5 Landmark Elements vs ARIA Roles

| HTML5 Semantic Tag | Implicit ARIA Role | Screen Reader Announcement | Usage Rule |
| :--- | :--- | :--- | :--- |
| `<header>` | `role="banner"` | Announced as site banner | Exactly 1 top-level banner per page |
| `<nav>` | `role="navigation"` | Major landmark for keyboard tabs | Use `aria-label` when multiple navs exist |
| `<main>` | `role="main"` | Primary content shortcut | Exactly 1 `<main>` per page document |
| `<aside>` | `role="complementary"`| Secondary supplementary drawer | Syllabi sidebars, related reading links |
| `<footer>` | `role="contentinfo"` | Colophon and legal footer | Exactly 1 top-level footer per page |

---

### 📚 Official References & Guidelines

- **W3C WAI-ARIA Authoring Practices Guide (APG)**: [https://www.w3.org/WAI/ARIA/apg/](https://www.w3.org/WAI/ARIA/apg/)
- **WebAIM Contrast Checker**: [https://webaim.org/resources/contrastchecker/](https://webaim.org/resources/contrastchecker/)""",
        )

        db.add_all([c3_l0, c3_l1, c3_l2])
        db.flush()

        db.add_all([
            Resource(lesson_id=c3_l0.id, title="Official W3C WCAG 2.1 Quick Reference & Checklist", resource_type="link", file_path_or_url="https://www.w3.org/WAI/WCAG21/quickref/"),
            Resource(lesson_id=c3_l0.id, title="Official W3C WAI-ARIA Authoring Practices Guide (APG)", resource_type="link", file_path_or_url="https://www.w3.org/WAI/ARIA/apg/"),
            Resource(lesson_id=c3_l1.id, title="Official MDN CSS Custom Properties Specification", resource_type="link", file_path_or_url="https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties"),
        ])
        db.flush()

        q3 = Quiz(
            course_id=course_3.id,
            lesson_id=c3_l2.id,
            title="Modern UI/UX & Web Accessibility Standards Quiz",
            description="Test your knowledge of design tokens, WCAG AA contrast criteria, and ARIA roles.",
            time_limit_minutes=15,
            passing_score=75.0,
        )
        db.add(q3)
        db.flush()

        q3_quest1 = Question(quiz_id=q3.id, prompt="What is the minimum WCAG 2.1 Level AA contrast ratio required for standard body text against its background?", order_index=1)
        q3_quest2 = Question(quiz_id=q3.id, prompt="Why should web developers avoid setting 'outline: none' on interactive elements without a fallback?", order_index=2)
        q3_quest3 = Question(quiz_id=q3.id, prompt="In CSS Custom Properties, what syntax is used to define and consume a variable?", order_index=3)
        q3_quest4 = Question(quiz_id=q3.id, prompt="Which HTML5 element represents the primary, non-repeated content area of a document?", order_index=4)
        db.add_all([q3_quest1, q3_quest2, q3_quest3, q3_quest4])
        db.flush()

        db.add_all([
            AnswerOption(question_id=q3_quest1.id, text="2:1", is_correct=False),
            AnswerOption(question_id=q3_quest1.id, text="3:1", is_correct=False),
            AnswerOption(question_id=q3_quest1.id, text="4.5:1", is_correct=True),
            AnswerOption(question_id=q3_quest1.id, text="7:1", is_correct=False),
            AnswerOption(question_id=q3_quest2.id, text="It strips the visual focus indicator needed by keyboard navigators", is_correct=True),
            AnswerOption(question_id=q3_quest2.id, text="It causes memory leaks in the browser", is_correct=False),
            AnswerOption(question_id=q3_quest2.id, text="It disables CSS animations", is_correct=False),
            AnswerOption(question_id=q3_quest2.id, text="It slows down HTTP requests", is_correct=False),
            AnswerOption(question_id=q3_quest3.id, text="Define with --name and consume with var(--name)", is_correct=True),
            AnswerOption(question_id=q3_quest3.id, text="Define with $name and consume with @name", is_correct=False),
            AnswerOption(question_id=q3_quest3.id, text="Define with !name and consume with #name", is_correct=False),
            AnswerOption(question_id=q3_quest3.id, text="Define with def:name and consume with use:name", is_correct=False),
            AnswerOption(question_id=q3_quest4.id, text="<main>", is_correct=True),
            AnswerOption(question_id=q3_quest4.id, text="<section>", is_correct=False),
            AnswerOption(question_id=q3_quest4.id, text="<article>", is_correct=False),
            AnswerOption(question_id=q3_quest4.id, text="<aside>", is_correct=False),
        ])
        db.flush()

        # =========================================================================
        # COURSE 4: Cloud-Native DevOps, Docker & CI/CD Pipelines
        # =========================================================================
        print("Authoring Course 4: Cloud-Native DevOps, Docker & CI/CD Pipelines...")
        course_4 = sync_course(
            db,
            slug="cloud-native-devops-docker-cicd",
            title="Cloud-Native DevOps, Docker & CI/CD Pipelines",
            short_description="Containerize applications with multi-stage Dockerfiles, orchestrate services with Compose, and build automated GitHub Actions pipelines.",
            description="""Master continuous integration, automated testing, and container deployment.

Students gain hands-on expertise with:
- Multi-stage Docker builds to reduce image attack surfaces and disk footprints
- Docker Compose orchestration for multi-container full-stack web environments
- Continuous Integration pipelines with GitHub Actions matrix jobs
- Container vulnerability scanning and production readiness checks""",
            instructor_id=instructor_2.id,
            category_id=cat_cloud.id,
            level="intermediate",
            thumbnail_url="/images/course-4-devops-docker.jpg",
            price=899,
        )

        c4_m0 = Module(course_id=course_4.id, title="Section 0: Course Roadmap & DevOps Pathway", order_index=0)
        c4_m1 = Module(course_id=course_4.id, title="Module 1: Containerization with Docker & Multi-Stage Builds", order_index=1)
        c4_m2 = Module(course_id=course_4.id, title="Module 2: Continuous Integration & Automated Delivery (CI/CD)", order_index=2)
        db.add_all([c4_m0, c4_m1, c4_m2])
        db.flush()

        c4_l0 = Lesson(
            module_id=c4_m0.id,
            title="Cloud-Native DevOps Roadmap & Continuous Delivery Pathway",
            content_type="article",
            duration_minutes=20,
            order_index=1,
            content_text="""## 🗺️ Academic Engineering Roadmap: Cloud-Native DevOps & CI/CD

Follow the complete pipeline from local code check-in to automated cloud container verification.

```roadmap
┌────────────────────────┐      ┌──────────────────────────┐      ┌─────────────────────────┐
│ 1. Containerization    │ ───> │ 2. Compose Orchestration │ ───> │ 3. Automated CI Tests   │
│ (Multi-stage Dockerfile│      │ (Multi-service network)  │      │ (GitHub Actions Matrix) │
└────────────────────────┘      └──────────────────────────┘      └─────────────────────────┘
                                                                               │
                                                                               ▼
┌────────────────────────┐      ┌──────────────────────────┐      ┌─────────────────────────┐
│ 5. Rolling Deployment  │ <─── │ 4. Vulnerability Scan    │ <───┘ 3b. Registry Artifacts   │
│ (Health Checks & Cloud)│      │ (Trivy / Non-root User)  │      │  (Docker Hub / OCI OIDC)│
└────────────────────────┘      └──────────────────────────┘      └─────────────────────────┘
```

---

### 🎯 Milestone Checkpoints

1. **Milestone 1 — Efficient Multi-Stage Builds**: Structure Dockerfiles separating builder dependencies from lightweight runtime containers (`alpine`/`slim`).
2. **Milestone 2 — Declarative Composition**: Declare networking, volumes, environment variables, and health checks with Docker Compose.
3. **Milestone 3 — Automated CI Matrix**: Author GitHub Actions workflows executing linters and unit tests across multiple Python and Node versions.
4. **Milestone 4 — Security Hardening**: Run non-root user containers and integrate automated CVE scanning.

---

### 📚 Official Documentation & Primary References

| Technology | Standard / Documentation Scope | Official Portal |
| :--- | :--- | :--- |
| **Docker Engine** | Images, Layer Caches, BuildKit & Container Runtime | [https://docs.docker.com/](https://docs.docker.com/) |
| **Docker Compose** | Multi-service orchestration, service discovery, volumes | [https://docs.docker.com/compose/](https://docs.docker.com/compose/) |
| **GitHub Actions** | Workflow triggers, hosted runner environments, matrix builds | [https://docs.github.com/en/actions](https://docs.github.com/en/actions) |""",
        )

        c4_l1 = Lesson(
            module_id=c4_m1.id,
            title="Writing Production Multi-Stage Dockerfiles for Python & React",
            content_type="article",
            duration_minutes=30,
            order_index=1,
            content_text="""## 🐳 Multi-Stage Dockerfile Engineering

A naive Dockerfile packages compilation tools, SDK headers, and package caches directly into the production container, resulting in 1GB+ bloated images filled with potential CVE vulnerabilities.

### 1. Production Multi-Stage Pattern
```dockerfile
# -------------------------------------------------------------
# STAGE 1: Dependency Compiler & Wheel Builder
# -------------------------------------------------------------
FROM python:3.12-slim AS builder

WORKDIR /build
RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# -------------------------------------------------------------
# STAGE 2: Hardened, Minimal Runtime Container
# -------------------------------------------------------------
FROM python:3.12-slim

# Install only shared dynamic libraries (libpq for postgres)
RUN apt-get update && apt-get install -y --no-install-recommends libpq5 curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /install /usr/local
COPY . .

# Security: Never execute as root!
RUN addgroup --system appgroup && adduser --system --group appuser
USER appuser

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

### 2. Dockerfile Optimization Directives

| Directive | Cache Invalidation Risk | Layer Impact | Best Practice |
| :--- | :--- | :--- | :--- |
| `FROM` | Low | Base layer | Always pin explicit tags (`python:3.12-slim`), never `:latest` |
| `RUN apt-get` | Medium | Creates filesystem layer | Combine `update && install` and remove `/var/lib/apt/lists/*` |
| `COPY requirements.txt` | Low (infrequent change) | Single file layer | Copy dependencies before application source to preserve cache |
| `COPY . .` | High (frequent change) | Application layer | Place toward the bottom of the Dockerfile |
| `USER appuser` | None | Metadata change | Run as non-root user to prevent container breakout exploits |

---

### 📚 Official References & Best Practices

- **Docker Multi-Stage Build Guide**: [https://docs.docker.com/build/building/multi-stage/](https://docs.docker.com/build/building/multi-stage/)
- **Dockerfile Best Practices**: [https://docs.docker.com/develop/develop-images/dockerfile_best-practices/](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- **CIS Docker Benchmark Standards**: [https://www.cisecurity.org/benchmark/docker](https://www.cisecurity.org/benchmark/docker)""",
        )

        c4_l2 = Lesson(
            module_id=c4_m2.id,
            title="Automated Testing Workflows with GitHub Actions",
            content_type="article",
            duration_minutes=25,
            order_index=1,
            content_text="""## 🚀 Continuous Integration with GitHub Actions

Continuous Integration (CI) guarantees that changes to main are verified automatically against tests, linters, and type checkers.

### 1. Enterprise CI Workflow YAML
```yaml
name: CI Test Suite

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: studyhub_db
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: testpassword
        ports:
          - 5432:5432
        options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'

      - name: Install dependencies
        run: pip install -r backend/requirements.txt

      - name: Run Backend Pytest Suite
        run: pytest backend/tests --verbose
```

---

### 2. CI/CD Delivery Pipeline Stages

| Pipeline Stage | Tooling | Execution Trigger | Gate Condition |
| :--- | :--- | :--- | :--- |
| **Static Linting** | Flake8, Ruff, ESLint | Pull Request | Zero syntax / style warnings |
| **Unit Testing** | Pytest, Vitest | Pull Request | 100% test pass rate |
| **Integration Testing** | Testcontainers, Postgres | Merge to `main` | Full end-to-end API verification |
| **Vulnerability Scan** | Trivy, Snyk | Daily / Merge | Zero Critical / High CVEs |
| **Cloud Deployment** | Docker Compose / K8s | Tagged Release | Automated rollback on healthcheck fail |

---

### 📚 Official References & Documentation

- **GitHub Actions Workflow Syntax**: [https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- **GitHub Actions Security Hardening**: [https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)""",
        )

        db.add_all([c4_l0, c4_l1, c4_l2])
        db.flush()

        db.add_all([
            Resource(lesson_id=c4_l0.id, title="Official Docker Documentation & Reference Manual", resource_type="link", file_path_or_url="https://docs.docker.com/"),
            Resource(lesson_id=c4_l0.id, title="Official Docker Compose Specification", resource_type="link", file_path_or_url="https://docs.docker.com/compose/"),
            Resource(lesson_id=c4_l2.id, title="Official GitHub Actions Workflow Documentation", resource_type="link", file_path_or_url="https://docs.github.com/en/actions"),
        ])
        db.flush()

        q4 = Quiz(
            course_id=course_4.id,
            lesson_id=c4_l1.id,
            title="Cloud-Native DevOps & Containerization Quiz",
            description="Test your grasp of multi-stage Docker builds, Compose networking, and CI workflow syntax.",
            time_limit_minutes=15,
            passing_score=75.0,
        )
        db.add(q4)
        db.flush()

        q4_quest1 = Question(quiz_id=q4.id, prompt="What is the primary architectural benefit of utilizing multi-stage Docker builds?", order_index=1)
        q4_quest2 = Question(quiz_id=q4.id, prompt="In a Dockerfile, why is it recommended to run application processes as a non-root user?", order_index=2)
        q4_quest3 = Question(quiz_id=q4.id, prompt="How does Docker Compose enable communication between multiple services declared in the same compose file?", order_index=3)
        q4_quest4 = Question(quiz_id=q4.id, prompt="In GitHub Actions, which keyword triggers a workflow upon code changes?", order_index=4)
        db.add_all([q4_quest1, q4_quest2, q4_quest3, q4_quest4])
        db.flush()

        db.add_all([
            AnswerOption(question_id=q4_quest1.id, text="Reduces final production image size and excludes compile-time build tools and SDKs", is_correct=True),
            AnswerOption(question_id=q4_quest1.id, text="Increases container memory consumption", is_correct=False),
            AnswerOption(question_id=q4_quest1.id, text="Requires multiple physical servers to build", is_correct=False),
            AnswerOption(question_id=q4_quest1.id, text="Disables layer caching in Docker daemon", is_correct=False),
            AnswerOption(question_id=q4_quest2.id, text="Mitigates privilege escalation and limits host system compromise in the event of container breakout", is_correct=True),
            AnswerOption(question_id=q4_quest2.id, text="Allows the container to execute faster", is_correct=False),
            AnswerOption(question_id=q4_quest2.id, text="Prevents Python packages from installing", is_correct=False),
            AnswerOption(question_id=q4_quest2.id, text="Bypasses Linux kernel security modules", is_correct=False),
            AnswerOption(question_id=q4_quest3.id, text="Creates a default bridge network and resolves services by their service names via automatic DNS", is_correct=True),
            AnswerOption(question_id=q4_quest3.id, text="Requires hardcoding public IPv4 addresses", is_correct=False),
            AnswerOption(question_id=q4_quest3.id, text="Only allows one container to run at a time", is_correct=False),
            AnswerOption(question_id=q4_quest3.id, text="Routes all traffic through external internet gateways", is_correct=False),
            AnswerOption(question_id=q4_quest4.id, text="on:", is_correct=True),
            AnswerOption(question_id=q4_quest4.id, text="trigger:", is_correct=False),
            AnswerOption(question_id=q4_quest4.id, text="run:", is_correct=False),
            AnswerOption(question_id=q4_quest4.id, text="listen:", is_correct=False),
        ])
        db.flush()

        # =========================================================================
        # COURSE 5: Enterprise System Design, Scalability & Web Security
        # =========================================================================
        print("Authoring Course 5: Enterprise System Design, Scalability & Web Security...")
        course_5 = sync_course(
            db,
            slug="enterprise-system-design-scalability-security",
            title="Enterprise System Design, Scalability & Web Security",
            short_description="Design high-availability distributed systems, configure Redis caching tiers, and harden APIs against the OWASP Top 10 vulnerabilities.",
            description="""Architect resilient, distributed web systems capable of supporting millions of concurrent users.

Core competencies:
- High-availability topologies with reverse proxies, load balancers, and CDNs
- Distributed in-memory caching strategies (Cache-Aside, Write-Through) with Redis
- OWASP Top 10 web vulnerabilities defense: SQLi, XSS, CSRF, SSRF, and Broken Access Control
- Distributed rate limiting algorithms (Token Bucket, Leaky Bucket) and security headers""",
            instructor_id=instructor_1.id,
            category_id=cat_security.id,
            level="advanced",
            thumbnail_url="/images/course-5-system-design.jpg",
            price=999,
        )

        c5_m0 = Module(course_id=course_5.id, title="Section 0: Course Roadmap & System Design Pathway", order_index=0)
        c5_m1 = Module(course_id=course_5.id, title="Module 1: Scalable Architecture & Distributed In-Memory Caching", order_index=1)
        c5_m2 = Module(course_id=course_5.id, title="Module 2: Web Application Security Hardening & OWASP Defense", order_index=2)
        db.add_all([c5_m0, c5_m1, c5_m2])
        db.flush()

        c5_l0 = Lesson(
            module_id=c5_m0.id,
            title="Enterprise System Design Roadmap & Security Framework",
            content_type="article",
            duration_minutes=20,
            order_index=1,
            content_text="""## 🗺️ Academic Engineering Roadmap: System Design & Web Security

Construct high-throughput, fault-tolerant distributed web architectures fortified against modern security threats.

```roadmap
┌────────────────────────┐      ┌──────────────────────────┐      ┌─────────────────────────┐
│ 1. High Availability   │ ───> │ 2. Distributed Caching   │ ───> │ 3. Asynchronous Queues  │
│ (Load Balancing / CDN) │      │ (Redis Cache-Aside / TTL)│      │ (Message Brokers/Workers│
└────────────────────────┘      └──────────────────────────┘      └─────────────────────────┘
                                                                               │
                                                                               ▼
┌────────────────────────┐      ┌──────────────────────────┐      ┌─────────────────────────┐
│ 5. OWASP Defense       │ <─── │ 4. Database Scaling      │ <───┘ 3b. Rate Limiting Rules  │
│ (SQLi, XSS, CSRF, CSP) │      │ (Read Replicas & Sharding│      │  (Token Bucket / Redis) │
└────────────────────────┘      └──────────────────────────┘      └─────────────────────────┘
```

---

### 🎯 Milestone Checkpoints

1. **Milestone 1 — High-Availability Infrastructure**: Implement layer 4 and layer 7 load balancing with health checks and SSL termination.
2. **Milestone 2 — In-Memory Distributed Caching**: Apply Cache-Aside patterns with Redis, managing TTL expiration and cache-stampede mitigation.
3. **Milestone 3 — Asynchronous Processing**: Decouple intensive background computation using message queues.
4. **Milestone 4 — OWASP Top 10 Mitigation**: Implement strict parameterized SQL queries, sanitized inputs, and Content Security Policies (CSP).

---

### 📚 Official Documentation & Primary References

| Framework / Tool | Architectural Domain | Official Portal |
| :--- | :--- | :--- |
| **OWASP Top 10 Project** | Web Application Vulnerability Mitigation | [https://owasp.org/www-project-top-ten/](https://owasp.org/www-project-top-ten/) |
| **Redis Documentation** | In-Memory Caching, TTLs & Eviction Policies | [https://redis.io/docs/](https://redis.io/docs/) |
| **RFC 6749 OAuth 2.0** | Delegated Authorization & Token Flows | [https://datatracker.ietf.org/doc/html/rfc6749](https://datatracker.ietf.org/doc/html/rfc6749) |
| **MDN Web Security** | CSP, Strict-Transport-Security, CORS | [https://developer.mozilla.org/en-US/docs/Web/Security](https://developer.mozilla.org/en-US/docs/Web/Security) |""",
        )

        c5_l1 = Lesson(
            module_id=c5_m1.id,
            title="High-Availability Architecture: Load Balancers, Proxies & Redis Caching",
            content_type="article",
            duration_minutes=30,
            order_index=1,
            content_text="""## ⚡ Distributed In-Memory Caching with Redis

Serving every query directly from PostgreSQL causes connection pool exhaustion under high concurrency. Redis caches hot data in RAM with sub-millisecond latency.

### 1. Cache-Aside Pattern Implementation
```python
import json
from typing import Optional

async def get_course_data(course_id: int, redis_client, db_session) -> dict:
    cache_key = f"course:{course_id}"

    # 1. Check Redis Cache
    cached = await redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    # 2. On Cache Miss: Query PostgreSQL
    course = db_session.query(Course).filter(Course.id == course_id).first()
    if not course:
        return None

    course_dict = {"id": course.id, "title": course.title, "slug": course.slug}

    # 3. Populate Redis with a 3600-second Time-To-Live (TTL)
    await redis_client.setex(cache_key, 3600, json.dumps(course_dict))
    return course_dict
```

---

### 2. Distributed Caching Strategies Matrix

| Strategy | Write Flow | Read Flow | Cache Staleness Risk | Best Used For |
| :--- | :--- | :--- | :--- | :--- |
| **Cache-Aside** (Lazy) | Application writes to DB | App reads Cache; on miss, loads DB | Low (with TTL) | Read-heavy web workloads (StudyHub) |
| **Write-Through** | App writes to Cache, Cache writes DB | App reads Cache | None | Critical data requiring absolute freshness |
| **Write-Behind** (Async) | App writes to Cache; async worker writes DB | App reads Cache | High (data loss on crash) | Massive write volume (logging, analytics) |
| **Refresh-Ahead** | Background job refreshes before TTL | App reads Cache | Very Low | Predictable hot resources (catalogs) |

---

### 📚 Official References & Documentation

- **Redis Caching Patterns Guide**: [https://redis.io/docs/manual/client-side-caching/](https://redis.io/docs/manual/client-side-caching/)
- **Redis Memory Eviction Algorithms**: [https://redis.io/docs/reference/eviction/](https://redis.io/docs/reference/eviction/)""",
        )

        c5_l2 = Lesson(
            module_id=c5_m2.id,
            title="OWASP Top 10 Defense: Mitigating Injection, Broken Access & XSS",
            content_type="article",
            duration_minutes=30,
            order_index=1,
            content_text="""## 🛡️ Enterprise Defense Against OWASP Top 10

The Open Worldwide Application Security Project (OWASP) identifies the most critical risks facing modern web systems.

### 1. The Critical Vulnerabilities & Defenses

1. **A01: Broken Access Control (BOLA/IDOR)**:
   - *Attack*: Changing `/api/v1/users/4/orders` to `/api/v1/users/5/orders` to inspect another student's private records.
   - *Defense*: Always verify resource ownership against `current_user.id` on every DB query.

2. **A03: Injection (SQLi)**:
   - *Attack*: Inputting `' OR '1'='1` into login forms.
   - *Defense*: Use parameterized SQLAlchemy queries where input is treated strictly as data literals, never executable SQL.

---

### 2. OWASP Top 10 Mitigation Matrix

| Vulnerability Rank | Threat Vector | Primary Impact | Defense Mechanism in StudyHub |
| :--- | :--- | :--- | :--- |
| **A01: Broken Access Control** | IDOR / Privilege escalation | Unauthorized data leak | Token subject validation & RBAC dependencies |
| **A02: Cryptographic Failures** | Plaintext sensitive data | Credential exposure | `bcrypt` (12 rounds) + TLS 1.3 encryption |
| **A03: Injection (SQLi/XSS)** | Malicious SQL/JS inputs | Remote code execution | SQLAlchemy parameterized ORM queries |
| **A05: Security Misconfig** | Default passwords, verbose errors | System reconnaissance | Hardened production headers & non-root containers |
| **A07: Identification Failures** | Session hijacking / brute force | Account takeover | JWT expiration (24h) + rate limiting |

---

### 3. Hardened Production Security Headers

```http
Content-Security-Policy: default-src 'self' https: data:
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

---

### 📚 Official References & Guidelines

- **OWASP Top 10 Official Documentation**: [https://owasp.org/Top10/](https://owasp.org/Top10/)
- **MDN Content Security Policy Guide**: [https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- **OWASP Cheat Sheet Series**: [https://cheatsheetseries.owasp.org/](https://cheatsheetseries.owasp.org/)""",
        )

        db.add_all([c5_l0, c5_l1, c5_l2])
        db.flush()

        db.add_all([
            Resource(lesson_id=c5_l0.id, title="Official OWASP Top 10 Web Security Project", resource_type="link", file_path_or_url="https://owasp.org/www-project-top-ten/"),
            Resource(lesson_id=c5_l0.id, title="Official Redis Architecture & Data Structures Manual", resource_type="link", file_path_or_url="https://redis.io/docs/"),
            Resource(lesson_id=c5_l2.id, title="Official RFC 6749 OAuth 2.0 Authorization Specification", resource_type="link", file_path_or_url="https://datatracker.ietf.org/doc/html/rfc6749"),
            Resource(lesson_id=c5_l2.id, title="MDN Content Security Policy (CSP) Standards", resource_type="link", file_path_or_url="https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP"),
        ])
        db.flush()

        q5 = Quiz(
            course_id=course_5.id,
            lesson_id=c5_l2.id,
            title="Enterprise System Design & Web Security Quiz",
            description="Evaluate your comprehension of distributed caching, horizontal scalability, and OWASP defenses.",
            time_limit_minutes=15,
            passing_score=75.0,
        )
        db.add(q5)
        db.flush()

        q5_quest1 = Question(quiz_id=q5.id, prompt="Which distributed caching pattern involves the application reading from cache first, and populating cache upon database retrieval on a miss?", order_index=1)
        q5_quest2 = Question(quiz_id=q5.id, prompt="What is the most effective engineering defense against SQL Injection vulnerabilities?", order_index=2)
        q5_quest3 = Question(quiz_id=q5.id, prompt="What does Broken Object Level Authorization (BOLA / IDOR) refer to?", order_index=3)
        q5_quest4 = Question(quiz_id=q5.id, prompt="What is the function of the Content-Security-Policy (CSP) HTTP header?", order_index=4)
        db.add_all([q5_quest1, q5_quest2, q5_quest3, q5_quest4])
        db.flush()

        db.add_all([
            AnswerOption(question_id=q5_quest1.id, text="Cache-Aside Pattern", is_correct=True),
            AnswerOption(question_id=q5_quest1.id, text="Write-Through Pattern", is_correct=False),
            AnswerOption(question_id=q5_quest1.id, text="Write-Behind Pattern", is_correct=False),
            AnswerOption(question_id=q5_quest1.id, text="Refresh-Ahead Pattern", is_correct=False),
            AnswerOption(question_id=q5_quest2.id, text="Using Parameterized Queries and ORM Prepared Statements", is_correct=True),
            AnswerOption(question_id=q5_quest2.id, text="Concatenating string variables into raw SQL", is_correct=False),
            AnswerOption(question_id=q5_quest2.id, text="Removing indexes from the database", is_correct=False),
            AnswerOption(question_id=q5_quest2.id, text="Restarting PostgreSQL every hour", is_correct=False),
            AnswerOption(question_id=q5_quest3.id, text="When an API endpoint fails to validate whether the authenticated user has permission to access a specific resource ID", is_correct=True),
            AnswerOption(question_id=q5_quest3.id, text="When a user enters an incorrect password during login", is_correct=False),
            AnswerOption(question_id=q5_quest3.id, text="When a database foreign key is missing", is_correct=False),
            AnswerOption(question_id=q5_quest3.id, text="When an image file fails to load", is_correct=False),
            AnswerOption(question_id=q5_quest4.id, text="Restricts the origins from which scripts, styles, and media can be loaded and executed to prevent XSS attacks", is_correct=True),
            AnswerOption(question_id=q5_quest4.id, text="Enables automatic database backups", is_correct=False),
            AnswerOption(question_id=q5_quest4.id, text="Encrypts local storage on mobile devices", is_correct=False),
            AnswerOption(question_id=q5_quest4.id, text="Replaces HTTPS with HTTP", is_correct=False),
        ])
        db.flush()

        # =========================================================================
        # SEED ENROLLMENTS, PROGRESS, AND NOTIFICATIONS
        # =========================================================================
        print("Ensuring demo enrollments and progress...")
        if not db.query(Enrollment).filter(Enrollment.user_id == student_1.id, Enrollment.course_id == course_1.id).first():
            db.add(Enrollment(user_id=student_1.id, course_id=course_1.id, status="active"))
        if not db.query(Enrollment).filter(Enrollment.user_id == student_1.id, Enrollment.course_id == course_2.id).first():
            db.add(Enrollment(user_id=student_1.id, course_id=course_2.id, status="completed", completed_at=datetime.datetime.now(datetime.UTC)))
        if not db.query(Enrollment).filter(Enrollment.user_id == student_2.id, Enrollment.course_id == course_1.id).first():
            db.add(Enrollment(user_id=student_2.id, course_id=course_1.id, status="active"))
        db.flush()

        # Ensure demo progress on lesson 1 & 2 for student_1
        if not db.query(LessonProgress).filter(LessonProgress.user_id == student_1.id, LessonProgress.lesson_id == c1_l0.id).first():
            db.add(LessonProgress(user_id=student_1.id, lesson_id=c1_l0.id, is_completed=True, completed_at=datetime.datetime.now(datetime.UTC)))
        if not db.query(LessonProgress).filter(LessonProgress.user_id == student_1.id, LessonProgress.lesson_id == c1_l1.id).first():
            db.add(LessonProgress(user_id=student_1.id, lesson_id=c1_l1.id, is_completed=True, completed_at=datetime.datetime.now(datetime.UTC)))

        # Ensure notifications
        if not db.query(Notification).filter(Notification.user_id == student_1.id).first():
            db.add(Notification(
                user_id=student_1.id,
                title="Welcome to StudyHub Academic Learning Platform",
                message="Explore verified curricula, examine Section 0 roadmaps, and take assessments.",
                is_read=False,
            ))

        # Ensure sample payment record for student_1
        if not db.query(Payment).filter(Payment.user_id == student_1.id, Payment.course_id == course_1.id).first():
            db.add(Payment(
                user_id=student_1.id,
                course_id=course_1.id,
                order_id="order_demo_init101",
                payment_id="pay_demo_init101",
                signature="demo_sig_seed101",
                amount=499,
                amount_paise=49900,
                currency="INR",
                status="paid",
                receipt="rcpt_seed_101",
            ))

        db.commit()
        print("✅ Academic Database successfully synchronized! All custom user accounts preserved.")
        print("\n--- SYSTEM REGISTERED ACCOUNTS SUMMARY ---")
        users = db.query(User).all()
        for u in users:
            print(f"👤 [{u.role.upper():10}] {u.full_name:22} | {u.email}")
        print("-------------------------------------------\n")

    except Exception as e:
        db.rollback()
        print(f"❌ Error in database seeder: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
