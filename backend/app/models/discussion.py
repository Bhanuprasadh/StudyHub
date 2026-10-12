import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class DiscussionThread(Base):
    __tablename__ = "discussion_threads"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(250), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    course = relationship("Course", back_populates="discussions")
    author = relationship("User", back_populates="discussion_threads")
    replies = relationship("DiscussionReply", back_populates="thread", cascade="all, delete-orphan", order_by="DiscussionReply.created_at")


class DiscussionReply(Base):
    __tablename__ = "discussion_replies"

    id = Column(Integer, primary_key=True, index=True)
    thread_id = Column(Integer, ForeignKey("discussion_threads.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    thread = relationship("DiscussionThread", back_populates="replies")
    author = relationship("User", back_populates="discussion_replies")
