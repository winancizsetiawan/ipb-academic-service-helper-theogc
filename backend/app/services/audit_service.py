"""
Audit logging service.

Usage inside a request handler:
    from app.services.audit_service import audit

    audit(db, actor_id=current_user.id, action="ticket.status_changed",
          resource_type="ticket", resource_id=ticket.id,
          detail=f"{old_status} -> {new_status}", request=request)
"""
import logging
from typing import Optional

from fastapi import Request
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)


def audit(
    db: Session,
    action: str,
    actor_id: Optional[int] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
    detail: Optional[str] = None,
    request: Optional[Request] = None,
) -> None:
    """
    Write a single audit log entry.  Failures are logged but never raise so
    they do not interrupt the main request flow.
    """
    try:
        ip = None
        if request is not None:
            forwarded_for = request.headers.get("x-forwarded-for")
            ip = forwarded_for.split(",")[0].strip() if forwarded_for else request.client.host if request.client else None

        entry = AuditLog(
            actor_id=actor_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            detail=detail,
            ip_address=ip,
        )
        db.add(entry)
        db.flush()
    except Exception as exc:
        logger.warning("Failed to write audit log entry (action=%s): %s", action, exc)
