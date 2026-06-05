from sqlalchemy import Column, Integer, String, Text, DateTime, Date, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.enums import TicketStatus, TicketPriority

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(SQLEnum(TicketStatus), default=TicketStatus.open, nullable=False)
    priority = Column(SQLEnum(TicketPriority), default=TicketPriority.medium, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    staff_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    deadline = Column(Date, nullable=True)
    form_data = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    student = relationship("User", foreign_keys=[student_id], lazy="joined")
    staff = relationship("User", foreign_keys=[staff_id], lazy="joined")
    category = relationship("Category", lazy="joined")
    # Use "select" for collection relationships to avoid cartesian-product blowup
    # when multiple collections are joined simultaneously.  Controllers use
    # explicit joinedload() on these when they need them.
    notes = relationship("TicketNote", back_populates="ticket", lazy="select")
    attachments = relationship("Attachment", back_populates="ticket", lazy="select")

    @property
    def nama(self):
        return self.student.nama if self.student else None

    @property
    def nim_or_nip(self):
        return self.student.nim_or_nip if self.student else None

    @property
    def nama_kategori(self):
        return self.category.nama_kategori if self.category else None