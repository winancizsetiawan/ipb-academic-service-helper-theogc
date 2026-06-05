from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.session import Base


class Discussion(Base):
    __tablename__ = "discussions"

    id = Column(Integer, primary_key=True, index=True)
    faq_id = Column(Integer, ForeignKey("faqs.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    author = relationship("User", lazy="joined")
    replies = relationship("DiscussionReply", back_populates="discussion", lazy="joined")


class DiscussionReply(Base):
    __tablename__ = "discussion_replies"

    id = Column(Integer, primary_key=True, index=True)
    discussion_id = Column(Integer, ForeignKey("discussions.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    discussion = relationship("Discussion", back_populates="replies")
    author = relationship("User", lazy="joined")