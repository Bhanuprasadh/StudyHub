import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    content_type = Column(String(50), default="article", nullable=False)  # article, video, link, notes
    content_text = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=10, nullable=False)
    order_index = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    module = relationship("Module", back_populates="lessons")
    resources = relationship("Resource", back_populates="lesson", cascade="all, delete-orphan")
    progress_records = relationship("LessonProgress", back_populates="lesson", cascade="all, delete-orphan")
