import asyncio
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse, UnreadCountResponse
from app.core.security import decode_access_token
from app.core.websocket_manager import manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationResponse])
def get_my_notifications(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns notifications for the authenticated user, newest first."""
    try:
        return (
            db.query(Notification)
            .filter(Notification.user_id == current_user.id)
            .order_by(Notification.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    except SQLAlchemyError as exc:
        logger.error("DB error fetching notifications for user %s: %s", current_user.id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Database error fetching notifications.")


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        count = (
            db.query(Notification)
            .filter(Notification.user_id == current_user.id, Notification.is_read == False)
            .count()
        )
        return UnreadCountResponse(unread_count=count)
    except SQLAlchemyError as exc:
        logger.error("DB error fetching unread count for user %s: %s", current_user.id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Database error fetching unread count.")


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        if notification.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="You do not have access to this notification")

        notification.is_read = True
        db.commit()
        db.refresh(notification)
        return notification
    except SQLAlchemyError as exc:
        db.rollback()
        logger.error("DB error marking notification %s as read: %s", notification_id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Database error marking notification as read.")


@router.patch("/read-all", response_model=List[NotificationResponse])
def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        unread = (
            db.query(Notification)
            .filter(Notification.user_id == current_user.id, Notification.is_read == False)
            .all()
        )
        for n in unread:
            n.is_read = True
        db.commit()

        return (
            db.query(Notification)
            .filter(Notification.user_id == current_user.id)
            .order_by(Notification.created_at.desc())
            .all()
        )
    except SQLAlchemyError as exc:
        db.rollback()
        logger.error("DB error marking all notifications as read for user %s: %s", current_user.id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Database error marking notifications as read.")


# ---------------------------------------------------------------------------
# WebSocket endpoint
# JWT is sent as the FIRST MESSAGE after connection (not in the URL path),
# preventing the token from appearing in server logs, proxy access logs, or
# browser history.
# ---------------------------------------------------------------------------
@router.websocket("/ws")
async def websocket_notifications(websocket: WebSocket):
    """
    Real-time notification stream.  Client authenticates by sending the JWT
    as plain text immediately after the connection is accepted.
    """
    await websocket.accept()

    # Expect auth token within 10 seconds
    try:
        token = await asyncio.wait_for(websocket.receive_text(), timeout=10.0)
    except asyncio.TimeoutError:
        logger.warning("WebSocket auth timed out — closing connection.")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        logger.warning("WebSocket auth failed — invalid token.")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        user_id = int(payload["sub"])
    except (ValueError, TypeError):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(user_id, websocket)
    try:
        while True:
            # Keep the connection alive; ignore any client-side pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
    except Exception:
        manager.disconnect(user_id, websocket)
