from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.session import Base


class TicketNote(Base):
    __tablename__ = "ticket_notes"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ticket = relationship("Ticket", back_populates="notes")
    author = relationship("User", lazy="joined")

    @property
    def author_name(self) -> str:
        return self.author.nama if self.author else None