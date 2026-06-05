import logging
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Maps user_id (int) to a list of active WebSockets
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"WebSocket connected for user {user_id}. Active connections: {len(self.active_connections[user_id])}")

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"WebSocket disconnected for user {user_id}.")

    async def send_personal_message(self, user_id: int, message: dict) -> None:
        if user_id in self.active_connections:
            logger.info(f"Pushing WebSocket notification to user {user_id}...")
            # Use list copy to avoid iteration errors if disconnecting concurrently
            for connection in list(self.active_connections[user_id]):
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending WebSocket message to user {user_id}: {str(e)}")
                    # Connection might be dead, disconnect will clean it up

# Singleton instance to be shared globally
manager = ConnectionManager()
