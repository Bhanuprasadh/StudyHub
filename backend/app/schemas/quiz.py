import datetime
from pydantic import BaseModel, Field
from typing import Optional, List


# Answer Option for taking quiz (NO is_correct field!)
class OptionPublic(BaseModel):
    id: int
    question_id: int
    text: str

    class Config:
        from_attributes = True


# Answer Option for instructors creating/viewing quiz
class OptionAdmin(BaseModel):
    id: Optional[int] = None
    text: str
    is_correct: bool = False

    class Config:
        from_attributes = True


class OptionCreate(BaseModel):
    text: str = Field(min_length=1, max_length=500)
    is_correct: bool = False


# Question Schemas
class QuestionPublic(BaseModel):
    id: int
    prompt: str
    question_type: str
    order_index: int
    options: List[OptionPublic] = []

    class Config:
        from_attributes = True


class QuestionCreate(BaseModel):
    prompt: str = Field(min_length=3)
    question_type: str = "multiple_choice"
    order_index: int = 0
    options: List[OptionCreate] = []


class QuestionDetail(BaseModel):
    id: int
    prompt: str
    question_type: str
    order_index: int
    options: List[OptionAdmin] = []

    class Config:
        from_attributes = True


# Quiz Schemas
class QuizCreate(BaseModel):
    course_id: int
    lesson_id: Optional[int] = None
    title: str = Field(min_length=3, max_length=200)
    description: Optional[str] = None
    time_limit_minutes: int = Field(default=15, ge=1, le=180)
    passing_score: float = Field(default=70.0, ge=0.0, le=100.0)
    questions: Optional[List[QuestionCreate]] = []


class QuizPublicResponse(BaseModel):
    id: int
    course_id: int
    lesson_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    time_limit_minutes: int
    passing_score: float
    total_questions: int = 0
    questions: List[QuestionPublic] = []
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class QuizInstructorResponse(BaseModel):
    id: int
    course_id: int
    lesson_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    time_limit_minutes: int
    passing_score: float
    questions: List[QuestionDetail] = []
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# Quiz Submission & Grading
class AnswerSubmission(BaseModel):
    question_id: int
    selected_option_id: Optional[int] = None


class QuizSubmission(BaseModel):
    answers: List[AnswerSubmission]


class AttemptAnswerDetail(BaseModel):
    question_id: int
    selected_option_id: Optional[int] = None
    correct_option_id: Optional[int] = None
    is_correct: bool


class QuizAttemptResponse(BaseModel):
    id: int
    quiz_id: int
    user_id: int
    score: float
    passed: bool
    started_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None
    breakdown: Optional[List[AttemptAnswerDetail]] = []

    class Config:
        from_attributes = True
