import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    resource_type = Column(String(50), default="link", nullable=False)  # pdf, link, code, notes
    file_path_or_url = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, nullable=True, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    lesson = relationship("Lesson", back_populates="resources")
