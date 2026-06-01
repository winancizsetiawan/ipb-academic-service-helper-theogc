from typing import List
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse, UnreadCountResponse
from app.core.security import decode_access_token
from app.core.websocket_manager import manager

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_my_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns a list of notifications for the authenticated user, ordered newest first.
    """
    try:
        notifications = db.query(Notification).filter(
            Notification.user_id == current_user.id
        ).order_by(
            Notification.created_at.desc()
        ).all()
        return notifications
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the count of unread notifications.
    """
    try:
        count = db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        ).count()
        return UnreadCountResponse(unread_count=count)
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Marks a single notification as read, checking ownership.
    """
    try:
        notification = db.query(Notification).filter(
            Notification.id == notification_id
        ).first()
        
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
            
        if notification.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this notification"
            )
            
        notification.is_read = True
        db.commit()
        db.refresh(notification)
        return notification
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.patch("/read-all", response_model=List[NotificationResponse])
def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Marks all notifications for the authenticated user as read.
    """
    try:
        unread_notifications = db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        ).all()
        
        for notification in unread_notifications:
            notification.is_read = True
            
        db.commit()
        
        # Return all notifications for the user
        all_notifications = db.query(Notification).filter(
            Notification.user_id == current_user.id
        ).order_by(
            Notification.created_at.desc()
        ).all()
        return all_notifications
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

# WebSocket Router
@router.websocket("/ws/{token}")
async def websocket_notifications(websocket: WebSocket, token: str):
    """
    WebSocket endpoint for receiving real-time notifications.
    Authenticates by extracting the user ID from the path token parameter.
    """
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        user_id = int(payload["sub"])
    except ValueError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Add connection
    await manager.connect(user_id, websocket)

    try:
        # Keep connection open and listen for any incoming client messages (which we ignore or use for heartbeat)
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
    except Exception:
        manager.disconnect(user_id, websocket)
