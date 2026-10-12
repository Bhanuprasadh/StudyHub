from app.schemas.user import UserRegister, UserLogin, UserResponse, UserUpdate, Token
from app.schemas.category import CategoryCreate, CategoryResponse
from app.schemas.course import (
    CourseCreate, CourseUpdate, CourseSummaryResponse, CourseDetailResponse,
    ModuleCreate, ModuleUpdate, ModuleResponse,
    LessonCreate, LessonUpdate, LessonResponse,
    ResourceCreate, ResourceResponse
)
from app.schemas.quiz import (
    QuizCreate, QuizPublicResponse, QuizInstructorResponse, QuizSubmission, QuizAttemptResponse
)
from app.schemas.progress import (
    LessonProgressToggle, LessonProgressResponse, CourseProgressSummary
)
from app.schemas.discussion import ThreadCreate, ThreadResponse, ReplyCreate, ReplyResponse
from app.schemas.admin import AdminStats, UserRoleUpdate

__all__ = [
    "UserRegister", "UserLogin", "UserResponse", "UserUpdate", "Token",
    "CategoryCreate", "CategoryResponse",
    "CourseCreate", "CourseUpdate", "CourseSummaryResponse", "CourseDetailResponse",
    "ModuleCreate", "ModuleUpdate", "ModuleResponse",
    "LessonCreate", "LessonUpdate", "LessonResponse",
    "ResourceCreate", "ResourceResponse",
    "QuizCreate", "QuizPublicResponse", "QuizInstructorResponse", "QuizSubmission", "QuizAttemptResponse",
    "LessonProgressToggle", "LessonProgressResponse", "CourseProgressSummary",
    "ThreadCreate", "ThreadResponse", "ReplyCreate", "ReplyResponse",
    "AdminStats", "UserRoleUpdate",
]
