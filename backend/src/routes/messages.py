from fastapi import APIRouter, Request, Form, HTTPException
from datetime import datetime

try:
    from ..users import (
        get_user_by_username,
        get_user_by_id,
        send_private_message,
        get_conversation,
        get_user_conversations,
    )
    from ..utils import load_session_token
except Exception:
    from users import (
        get_user_by_username,
        get_user_by_id,
        send_private_message,
        get_conversation,
        get_user_conversations,
    )
    from utils import load_session_token

router = APIRouter()


@router.post("/messages/{recipient_id}")
async def send_message(recipient_id: int, request: Request, text: str = Form(...)):
    """Send a private message to another user."""
    token = request.cookies.get("session")
    if not token:
        raise HTTPException(status_code=401, detail="Нет аутентификации")
    data = load_session_token(token)
    if not data:
        raise HTTPException(status_code=401, detail="Недействительная или истекшая сессия")

    user = await get_user_by_username(data.get("username"))
    if not user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    if user.is_banned:
        raise HTTPException(status_code=403, detail="Заблокированные пользователи не могут отправлять сообщения")

    recipient = await get_user_by_id(recipient_id)
    if not recipient:
        raise HTTPException(status_code=404, detail="Получатель не найден")
    if recipient.is_banned:
        raise HTTPException(status_code=403, detail="Невозможно отправить сообщение заблокированному пользователю")

    if user.id == recipient_id:
        raise HTTPException(status_code=400, detail="Невозможно отправить сообщение самому себе")

    if len(text) > 5000:
        raise HTTPException(status_code=400, detail="Сообщение не может превышать 5000 символов")

    if len(text) == 0:
        raise HTTPException(status_code=400, detail="Сообщение не может быть пустым")

    try:
        message = await send_private_message(user.id, recipient_id, text)
        return {
            "status": "ok",
            "id": message.id,
            "message": "Сообщение отправлено успешно",
            "date": message.date.strftime("%d.%m.%Y, %H:%M:%S"),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/messages/{other_user_id}")
async def get_conversation_endpoint(other_user_id: int, request: Request):
    """Get conversation with another user."""
    token = request.cookies.get("session")
    if not token:
        raise HTTPException(status_code=401, detail="Нет аутентификации")
    data = load_session_token(token)
    if not data:
        raise HTTPException(status_code=401, detail="Недействительная или истекшая сессия")

    user = await get_user_by_username(data.get("username"))
    if not user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    other_user = await get_user_by_id(other_user_id)
    if not other_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    try:
        messages = await get_conversation(user.id, other_user_id)
        # Format dates
        for msg in messages:
            if isinstance(msg.get("date"), datetime):
                msg["date"] = msg["date"].strftime("%d.%m.%Y, %H:%M:%S")
        return messages
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/conversations")
async def get_conversations_endpoint(request: Request):
    """Get all conversation partners."""
    token = request.cookies.get("session")
    if not token:
        raise HTTPException(status_code=401, detail="Нет аутентификации")
    data = load_session_token(token)
    if not data:
        raise HTTPException(status_code=401, detail="Недействительная или истекшая сессия")

    user = await get_user_by_username(data.get("username"))
    if not user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    try:
        conversations = await get_user_conversations(user.id)
        # Format dates
        for conv in conversations:
            if isinstance(conv.get("last_message_date"), datetime):
                conv["last_message_date"] = conv["last_message_date"].strftime("%d.%m.%Y, %H:%M:%S")
        return conversations
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
