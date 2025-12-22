from fastapi import APIRouter, Request, HTTPException, Query, UploadFile, File
import os
from PIL import Image
from io import BytesIO

try:
    from ..users import get_user_by_id, get_user_posts, promote_user_to_moderator, demote_user_to_user, get_all_tags, get_user_by_username, ban_user, unban_user, search_users, get_all_users, get_user_total_rating, save_profile_photo, delete_profile_photo
    from ..utils import load_session_token
except Exception:
    from users import get_user_by_id, get_user_posts, promote_user_to_moderator, demote_user_to_user, get_all_tags, get_user_by_username, ban_user, unban_user, search_users, get_all_users, get_user_total_rating, save_profile_photo, delete_profile_photo
    from utils import load_session_token

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads/profile_photos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/users")


@router.get("")
async def get_all_users_endpoint():
    users = await get_all_users(limit=100)
    return users


@router.get("/search")
async def search_users_endpoint(q: str = Query(..., min_length=1, max_length=100)):
    try:
        users = await search_users(q)
        return users
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{user_id}")
async def get_user(user_id: int):
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    total_rating = await get_user_total_rating(user_id)
    return {"id": user.id, "username": user.username, "role": user.role, "is_banned": user.is_banned, "registration_date": user.registration_date.strftime("%d.%m.%Y, %H:%M:%S"), "total_rating": total_rating, "profile_photo": user.profile_photo}


@router.get("/{user_id}/posts")
async def get_user_posts_endpoint(user_id: int):
    posts = await get_user_posts(user_id)
    return posts


@router.put("/{user_id}/promote")
async def promote_user(user_id: int, request: Request):
    token = request.cookies.get("session")
    if not token:
        raise HTTPException(status_code=401, detail="Нет аутентификации")
    data = load_session_token(token)
    if not data:
        raise HTTPException(status_code=401, detail="Недействительная или истекшая сессия")

    current_user = await get_user_by_username(data.get("username"))
    if not current_user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Только администраторы могут повышать пользователей")

    target_user = await get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="Целевой пользователь не найден")
    success = await promote_user_to_moderator(user_id)
    if not success:
        raise HTTPException(status_code=400, detail="Не удалось повысить пользователя")
    return {"status": "ok", "message": "Пользователь повышен до модератора"}


@router.put("/{user_id}/demote")
async def demote_user(user_id: int, request: Request):
    token = request.cookies.get("session")
    if not token:
        raise HTTPException(status_code=401, detail="Нет аутентификации")
    data = load_session_token(token)
    if not data:
        raise HTTPException(status_code=401, detail="Недействительная или истекшая сессия")

    current_user = await get_user_by_username(data.get("username"))
    if not current_user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Только администраторы могут понижать пользователей")

    target_user = await get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="Целевой пользователь не найден")
    if target_user.role != "moderator":
        raise HTTPException(status_code=400, detail="Целевой пользователь не является модератором")

    success = await demote_user_to_user(user_id)
    if not success:
        raise HTTPException(status_code=400, detail="Не удалось понизить пользователя")
    return {"status": "ok", "message": "Пользователь понижен до обычного пользователя"}


@router.put("/{user_id}/ban")
async def ban_user_endpoint(user_id: int, request: Request):
    token = request.cookies.get("session")
    if not token:
        raise HTTPException(status_code=401, detail="Нет аутентификации")
    data = load_session_token(token)
    if not data:
        raise HTTPException(status_code=401, detail="Недействительная или истекшая сессия")

    current_user = await get_user_by_username(data.get("username"))
    if not current_user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    # Check if trying to ban themselves
    if current_user.id == user_id:
        raise HTTPException(status_code=403, detail="Вы не можете заблокировать себя")

    if current_user.role not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Только администраторы и модераторы могут блокировать пользователей")

    target_user = await get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="Целевой пользователь не найден")

    # Admins can't ban other admins
    if current_user.role == "admin" and target_user.role == "admin":
        raise HTTPException(status_code=403, detail="Вы не можете заблокировать других администраторов")

    # Moderators can't ban admins
    if current_user.role == "moderator" and target_user.role == "admin":
        raise HTTPException(status_code=403, detail="Модераторы не могут блокировать администраторов")
    success = await ban_user(user_id)
    if not success:
        raise HTTPException(status_code=400, detail="Не удалось заблокировать пользователя")
    return {"status": "ok", "message": "Пользователь был заблокирован"}


@router.put("/{user_id}/unban")
async def unban_user_endpoint(user_id: int, request: Request):
    token = request.cookies.get("session")
    if not token:
        raise HTTPException(status_code=401, detail="Нет аутентификации")
    data = load_session_token(token)
    if not data:
        raise HTTPException(status_code=401, detail="Недействительная или истекшая сессия")

    current_user = await get_user_by_username(data.get("username"))
    if not current_user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    # Check if trying to unban themselves
    if current_user.id == user_id:
        raise HTTPException(status_code=403, detail="Вы не можете разблокировать себя")

    if current_user.role not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Только администраторы и модераторы могут разблокировать пользователей")

    target_user = await get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="Целевой пользователь не найден")

    # Admins can't unban other admins
    if current_user.role == "admin" and target_user.role == "admin":
        raise HTTPException(status_code=403, detail="Вы не можете разблокировать других администраторов")

    # Moderators can't unban admins
    if current_user.role == "moderator" and target_user.role == "admin":
        raise HTTPException(status_code=403, detail="Модераторы не могут разблокировать администраторов")
    success = await unban_user(user_id)
    if not success:
        raise HTTPException(status_code=400, detail="Не удалось разблокировать пользователя")
    return {"status": "ok", "message": "Пользователь был разблокирован"}

@router.get("/search")
async def search_users_endpoint(q: str = Query(..., min_length=1, max_length=100)):
    try:
        users = await search_users(q)
        return users
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{user_id}/profile-photo")
async def upload_profile_photo(user_id: int, request: Request, file: UploadFile = File(...)):
    """Upload a profile photo (PNG only). Only the user or moderators/admins can upload."""
    token = request.cookies.get("session")
    if not token:
        raise HTTPException(status_code=401, detail="Нет аутентификации")
    data = load_session_token(token)
    if not data:
        raise HTTPException(status_code=401, detail="Недействительная или истекшая сессия")

    current_user = await get_user_by_username(data.get("username"))
    if not current_user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")

    # Check permissions: own profile or admin/moderator
    if current_user.id != user_id and current_user.role not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Вы не можете загружать фото для другого пользователя")

    # Target user cannot be banned
    target_user = await get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if target_user.is_banned:
        raise HTTPException(status_code=403, detail="Заблокированный пользователь не может загружать фото")

    # Validate file type
    if file.content_type != "image/png":
        raise HTTPException(status_code=400, detail="Только PNG файлы поддерживаются")

    # Validate file extension
    if not file.filename.lower().endswith(".png"):
        raise HTTPException(status_code=400, detail="Файл должен иметь расширение .png")

    # Save the file with user_id as filename (will overwrite previous photo)
    file_extension = ".png"
    unique_filename = f"{user_id}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    try:
        contents = await file.read()
        
        # Resize image to square (256x256)
        try:
            image = Image.open(BytesIO(contents))
            # Convert RGBA to RGB if necessary
            if image.mode in ('RGBA', 'LA', 'P'):
                rgb_image = Image.new('RGB', image.size, (255, 255, 255))
                rgb_image.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                image = rgb_image
            
            # Resize to square (256x256)
            image.thumbnail((256, 256), Image.Resampling.LANCZOS)
            # Create a square canvas
            square_image = Image.new('RGB', (256, 256), (255, 255, 255))
            offset = ((256 - image.width) // 2, (256 - image.height) // 2)
            square_image.paste(image, offset)
            
            # Save resized image
            square_image.save(file_path, 'PNG', optimize=True)
        except Exception as img_err:
            raise HTTPException(status_code=400, detail=f"Ошибка при обработке изображения: {str(img_err)}")
        
        # Delete old photo if exists (same filename, will be overwritten but just in case)
        # No need since we're using the same filename
        
        # Save filename to database
        success = await save_profile_photo(user_id, unique_filename)
        if not success:
            raise HTTPException(status_code=500, detail="Не удалось сохранить фото в базу данных")
        
        return {"status": "ok", "filename": unique_filename, "message": "Фото профиля загружено"}
    except HTTPException:
        # Clean up file if save failed
        if os.path.exists(file_path):
            os.remove(file_path)
        raise
    except Exception as e:
        # Clean up file if save failed
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Ошибка при загрузке фото: {str(e)}")


@router.delete("/{user_id}/profile-photo")
async def delete_profile_photo_endpoint(user_id: int, request: Request):
    """Delete a user's profile photo. Only moderators/admins can do this."""
    token = request.cookies.get("session")
    if not token:
        raise HTTPException(status_code=401, detail="Нет аутентификации")
    data = load_session_token(token)
    if not data:
        raise HTTPException(status_code=401, detail="Недействительная или истекшая сессия")

    current_user = await get_user_by_username(data.get("username"))
    if not current_user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")

    # Only moderators and admins can delete
    if current_user.role not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Только модераторы и администраторы могут удалять фото пользователей")

    target_user = await get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if not target_user.profile_photo:
        raise HTTPException(status_code=400, detail="У этого пользователя нет фото профиля")

    # Delete file
    file_path = os.path.join(UPLOAD_DIR, target_user.profile_photo)
    if os.path.exists(file_path):
        os.remove(file_path)

    # Delete from database
    success = await delete_profile_photo(user_id)
    if not success:
        raise HTTPException(status_code=500, detail="Не удалось удалить фото из базы данных")

    return {"status": "ok", "message": "Фото профиля удалено"}