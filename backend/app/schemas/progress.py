import datetime
from pydantic import BaseModel
from typing import Optional, List


class LessonProgressToggle(BaseModel):
    is_completed: bool


class LessonProgressResponse(BaseModel):
    id: int
    lesson_id: int
    is_completed: bool
    completed_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True


class CourseProgressSummary(BaseModel):
    course_id: int
    total_lessons: int
    completed_lessons: int
    progress_percentage: float
    completed_lesson_ids: List[int] = []
