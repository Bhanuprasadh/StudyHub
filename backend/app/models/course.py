import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    slug = Column(String(250), unique=True, nullable=False, index=True)
    short_description = Column(String(500), nullable=True)
    description = Column(Text, nullable=False)
    instructor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    level = Column(String(50), default="beginner", nullable=False)  # beginner, intermediate, advanced
    status = Column(String(50), default="published", nullable=False, index=True)  # draft, published, archived
    thumbnail_url = Column(String(500), nullable=True)
    price = Column(Integer, default=0, nullable=False)  # In INR (0 = Free)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    # Relationships
    instructor = relationship("User", back_populates="taught_courses")
    category = relationship("Category", back_populates="courses")
    modules = relationship("Module", back_populates="course", cascade="all, delete-orphan", order_by="Module.order_index")
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="course", cascade="all, delete-orphan")
    discussions = relationship("DiscussionThread", back_populates="course", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="course", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_course_search", "title", "level", "status"),
    )
