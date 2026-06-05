from pydantic import BaseModel
from datetime import datetime

class AttachmentResponse(BaseModel):
    id: int
    filename: str
    url: str
    uploaded_at: datetime

    class Config:
        from_attributes = True
