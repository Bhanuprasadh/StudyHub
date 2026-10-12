from pydantic import BaseModel
from typing import Optional, List
from app.schemas.user import UserResponse


class UserRoleUpdate(BaseModel):
    role: str
    is_active: Optional[bool] = None


class AdminStats(BaseModel):
    total_users: int
    total_students: int
    total_instructors: int
    total_courses: int
    total_enrollments: int
    total_quizzes: int
    total_discussions: int
