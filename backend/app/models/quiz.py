import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    time_limit_minutes = Column(Integer, default=15, nullable=False)
    passing_score = Column(Float, default=70.0, nullable=False)  # in percentage
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    course = relationship("Course", back_populates="quizzes")
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan", order_by="Question.order_index")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    prompt = Column(Text, nullable=False)
    question_type = Column(String(50), default="multiple_choice", nullable=False)
    order_index = Column(Integer, default=0, nullable=False)

    quiz = relationship("Quiz", back_populates="questions")
    options = relationship("AnswerOption", back_populates="question", cascade="all, delete-orphan")


class AnswerOption(Base):
    __tablename__ = "answer_options"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    text = Column(String(500), nullable=False)
    is_correct = Column(Boolean, default=False, nullable=False)

    question = relationship("Question", back_populates="options")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Float, default=0.0, nullable=False)  # Percentage score
    passed = Column(Boolean, default=False, nullable=False)
    started_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    quiz = relationship("Quiz", back_populates="attempts")
    user = relationship("User", back_populates="quiz_attempts")
    submitted_answers = relationship("AttemptAnswer", back_populates="attempt", cascade="all, delete-orphan")


class AttemptAnswer(Base):
    __tablename__ = "attempt_answers"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    selected_option_id = Column(Integer, ForeignKey("answer_options.id", ondelete="CASCADE"), nullable=True)
    is_correct = Column(Boolean, default=False, nullable=False)

    attempt = relationship("QuizAttempt", back_populates="submitted_answers")
    question = relationship("Question")
    selected_option = relationship("AnswerOption")
