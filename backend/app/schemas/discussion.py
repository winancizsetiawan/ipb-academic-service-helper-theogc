from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DiscussionCreate(BaseModel):
    faq_id: int
    content: str


class DiscussionResponse(BaseModel):
    id: int
    faq_id: int
    author_id: int
    author_name: Optional[str] = None
    content: str
    created_at: Optional[datetime] = None
    reply_count: int = 0

    class Config:
        from_attributes = True


class ReplyCreate(BaseModel):
    content: str


class ReplyResponse(BaseModel):
    id: int
    discussion_id: int
    author_id: int
    author_name: Optional[str] = None
    content: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True