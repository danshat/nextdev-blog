from fastapi import APIRouter, Response, Form, HTTPException, Request
from fastapi.responses import JSONResponse

try:
    from ..users import get_user_by_username, verify_password, user_exists, create_user
    from ..utils import create_session_token, load_session_token
except Exception:
    from users import get_user_by_username, verify_password, user_exists, create_user
    from utils import create_session_token, load_session_token

router = APIRouter(prefix="/auth")


@router.post("/login")
async def login(response: Response, username: str = Form(...), password: str = Form(...)):
    if not username or not password:
        raise HTTPException(status_code=400, detail="Отсутствуют учетные данные")

    user = await get_user_by_username(username)
    if not user:
        raise HTTPException(status_code=401, detail="Отсутствуют учетные данные")

    if not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Отсутствуют учетные данные")

    token = create_session_token({"username": user.username})

    response.set_cookie(
        key="session",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
        secure=False,
        path="/",
    )
    return {"status": "ok", "message": "Вход выполнен успешно"}


@router.post("/register")
async def register(response: Response, username: str = Form(...), password: str = Form(...)):
    import re

    if not username or not password:
        raise HTTPException(status_code=400, detail="Отсутствуют учетные данные")

    if len(username) >= 25:
        raise HTTPException(status_code=400, detail="Логин должен быть короче 25 символов")

    if not re.match(r"^[a-zA-Z0-9_]+$", username):
        raise HTTPException(status_code=400, detail="Логин может содержать только буквы, цифры и подчеркивание")

    if len(password) <= 8:
        raise HTTPException(status_code=400, detail="Пароль должен быть длиннее 8 символов")

    if len(password) >= 20:
        raise HTTPException(status_code=400, detail="Пароль должен быть короче 20 символов")

    if await user_exists(username):
        raise HTTPException(status_code=400, detail="Пользователь с таким логином уже существует")

    try:
        user = await create_user(username=username, password=password, role="user")
        token = create_session_token({"username": user.username})
        response.set_cookie(
            key="session",
            value=token,
            httponly=True,
            samesite="lax",
            max_age=60 * 60 * 24 * 7,
            secure=False,
            path="/",
        )
        return {"status": "ok", "message": "Регистрация прошла успешно"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Регистрация не удалась: {str(e)}")


@router.post("/logout")
async def logout(response: Response):
    resp = JSONResponse({"status": "ok"})
    resp.delete_cookie("session", path="/")
    return resp


@router.get("/me")
async def me(request: Request):
    token = request.cookies.get("session")
    if not token:
        raise HTTPException(status_code=401, detail="Нет аутентификации")
    data = load_session_token(token)
    if not data:
        raise HTTPException(status_code=401, detail="Недействительная или истекшая сессия")

    user = await get_user_by_username(data.get("username"))
    if not user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    return {"id": user.id, "username": user.username, "role": user.role}
