from pydantic import BaseModel, Field
from typing import Optional


class CategoryBase(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    slug: str = Field(min_length=2, max_length=120)
    description: Optional[str] = None
    icon: Optional[str] = "BookOpen"


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: int

    class Config:
        from_attributes = True
