import datetime
from pydantic import BaseModel, Field
from typing import Optional, List
from app.schemas.user import UserResponse
from app.schemas.category import CategoryResponse


# Resource schemas
class ResourceBase(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    resource_type: str = "link"  # pdf, link, code, notes
    file_path_or_url: str
    file_size_bytes: Optional[int] = 0


class ResourceCreate(ResourceBase):
    pass


class ResourceResponse(ResourceBase):
    id: int
    lesson_id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# Lesson schemas
class LessonBase(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    content_type: str = "article"  # article, video, pdf, link
    content_text: Optional[str] = None
    duration_minutes: int = 10
    order_index: int = 0


class LessonCreate(LessonBase):
    pass


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    content_type: Optional[str] = None
    content_text: Optional[str] = None
    duration_minutes: Optional[int] = None
    order_index: Optional[int] = None


class LessonResponse(LessonBase):
    id: int
    module_id: int
    resources: List[ResourceResponse] = []
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# Module schemas
class ModuleBase(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: Optional[str] = None
    order_index: int = 0


class ModuleCreate(ModuleBase):
    pass


class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None


class ModuleResponse(ModuleBase):
    id: int
    course_id: int
    lessons: List[LessonResponse] = []
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# Course schemas
class CourseBase(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    slug: Optional[str] = None
    short_description: Optional[str] = None
    description: str = Field(min_length=10)
    category_id: Optional[int] = None
    level: str = "beginner"  # beginner, intermediate, advanced
    status: str = "published"  # draft, published, archived
    thumbnail_url: Optional[str] = None


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    level: Optional[str] = None
    status: Optional[str] = None
    thumbnail_url: Optional[str] = None


class CourseSummaryResponse(BaseModel):
    id: int
    title: str
    slug: str
    short_description: Optional[str] = None
    instructor_id: int
    category_id: Optional[int] = None
    level: str
    status: str
    thumbnail_url: Optional[str] = None
    created_at: datetime.datetime
    instructor: Optional[UserResponse] = None
    category: Optional[CategoryResponse] = None
    total_lessons: Optional[int] = 0
    total_enrollments: Optional[int] = 0

    class Config:
        from_attributes = True


class CourseDetailResponse(CourseSummaryResponse):
    description: str
    modules: List[ModuleResponse] = []
    is_enrolled: Optional[bool] = False
    is_bookmarked: Optional[bool] = False
    progress_percentage: Optional[float] = 0.0

    class Config:
        from_attributes = True
