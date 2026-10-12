import datetime
from pydantic import BaseModel, Field
from typing import Optional, List
from app.schemas.user import UserResponse


class ReplyCreate(BaseModel):
    content: str = Field(min_length=1)


class ReplyResponse(BaseModel):
    id: int
    thread_id: int
    user_id: int
    content: str
    created_at: datetime.datetime
    author: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class ThreadCreate(BaseModel):
    title: str = Field(min_length=3, max_length=250)
    content: str = Field(min_length=5)


class ThreadResponse(BaseModel):
    id: int
    course_id: int
    user_id: int
    title: str
    content: str
    created_at: datetime.datetime
    author: Optional[UserResponse] = None
    replies: List[ReplyResponse] = []

    class Config:
        from_attributes = True
