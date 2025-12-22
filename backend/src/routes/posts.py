from fastapi import APIRouter, Request, Form, HTTPException, Query
from typing import Optional
from datetime import datetime

try:
    from ..users import get_all_tags, get_all_posts, create_post, get_post_by_id, delete_post, create_comment, get_comments_by_post, get_comment_by_id, delete_comment, get_user_by_username, get_user_by_id, search_posts, create_tag, get_posts_by_tag, get_all_tags_with_post_counts, create_or_update_rating, delete_rating, user_rated_post, get_post_rating, increment_post_views, get_top_posters, get_top_posts
    from ..utils import load_session_token
except Exception:
    from users import get_all_tags, get_all_posts, create_post, get_post_by_id, delete_post, create_comment, get_comments_by_post, get_comment_by_id, delete_comment, get_user_by_username, get_user_by_id, search_posts, create_tag, get_posts_by_tag, get_all_tags_with_post_counts, create_or_update_rating, delete_rating, user_rated_post, get_post_rating, increment_post_views, get_top_posters, get_top_posts
    from utils import load_session_token

router = APIRouter()


@router.get("/tags")
async def get_tags():
    tags = await get_all_tags_with_post_counts()
    return tags


@router.get("/tags/{tag_id}/posts")
async def get_posts_by_tag_endpoint(tag_id: int):
    posts = await get_posts_by_tag(tag_id)
    return posts


@router.get("/posts")
async def get_posts():
    posts = await get_all_posts()
    return posts


@router.post("/posts")
async def create_new_post(request: Request, title: str = Form(...), text: str = Form(...), tags: str = Form(default="")):
    token = request.cookies.get("session")
    if not token:
        raise HTTPException(status_code=401, detail="Нет аутентификации")
    data = load_session_token(token)
    if not data:
        raise HTTPException(status_code=401, detail="Недействительная или истекшая сессия")

    if len(title) >= 500:
        raise HTTPException(status_code=400, detail="Заголовок не должен превышать 500 символов")

    user = await get_user_by_username(data.get("username"))
    if not user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    if user.is_banned:
        raise HTTPException(status_code=403, detail="Ваш аккаунт заблокирован и не может создавать посты")

    # Parse tag IDs from comma-separated string
    tag_ids = []
    if tags:
        try:
            tag_ids = [int(tag_id.strip()) for tag_id in tags.split(",") if tag_id.strip()]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid tag IDs")

    try:
        post = await create_post(title=title, text=text, author_id=user.id, tag_ids=tag_ids if tag_ids else None)
        return {"status": "ok", "idposts": post.idposts, "message": "Пост создан успешно"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/posts/search")
async def search_posts_endpoint(q: str = Query(..., min_length=1, max_length=150)):
    try:
        posts = await search_posts(q)
        return posts
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/posts/{post_id}")
async def get_post(post_id: int):
    post = await get_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Пост не найден")
    return post


@router.delete("/posts/{post_id}")
async def delete_post_endpoint(post_id: int, request: Request):
    token = request.cookies.get("session")
    if not token:
        raise HTTPException(status_code=401, detail="Нет аутентификации")
    data = load_session_token(token)
    if not data:
        raise HTTPException(status_code=401, detail="Недействительная или истекшая сессия")

    user = await get_user_by_username(data.get("username"))
    if not user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    post = await get_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Пост не найден")

    # Get post author's role
    post_author = await get_user_by_id(post["author_id"])
    post_author_role = post_author.role if post_author else "user"

    is_author = user.id == post["author_id"]
    is_moderator_or_admin = user.role in ["moderator", "admin"]

    # Check permissions
    if is_author:
        allowed = True
    elif user.role == "admin":
        # Admins can't delete posts from other admins
        if post_author_role == "admin" and user.id != post["author_id"]:
            allowed = False
        else:
            allowed = True
    elif user.role == "moderator":
        # Moderators can only delete posts from regular users
        if post_author_role in ["admin", "moderator"]:
            allowed = False
        else:
            allowed = True
    else:
        allowed = False

    if not allowed:
        raise HTTPException(status_code=403, detail="Не авторизован для удаления этого поста")

    deleted = await delete_post(post_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Пост не найден")
    return {"status": "ok", "message": "Пост удален успешно"}


@router.get("/posts/{post_id}/comments")
async def get_post_comments(post_id: int):
    comments = await get_comments_by_post(post_id)
    for c in comments:
        if isinstance(c.get("date"), datetime):
            c["date"] = c["date"].strftime("%d.%m.%Y, %H:%M:%S")
    return comments


@router.post("/posts/{post_id}/comments")
async def create_post_comment(post_id: int, request: Request, text: str = Form(...), parent_id: Optional[int] = Form(None)):
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
        raise HTTPException(status_code=403, detail="Ваш аккаунт заблокирован и не может комментировать")

    if len(text) >= 1000:
        raise HTTPException(status_code=400, detail="Комментарий не должен превышать 1000 символов")

    try:
        comment = await create_comment(post_id=post_id, text=text, author_id=user.id, parent_id=parent_id)
        return {"status": "ok", "idcomments": comment.idcomments, "message": "Комментарий создан"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/comments/{comment_id}")
async def delete_comment_endpoint(comment_id: int, request: Request):
    token = request.cookies.get("session")
    if not token:
        raise HTTPException(status_code=401, detail="Нет аутентификации")
    data = load_session_token(token)
    if not data:
        raise HTTPException(status_code=401, detail="Недействительная или истекшая сессия")

    current_user = await get_user_by_username(data.get("username"))
    if not current_user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    comment = await get_comment_by_id(comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Комментарий не найден")

    author = await get_user_by_id(comment.author_id)
    author_role = author.role if author else "user"

    if current_user.role == "admin":
        # Admins can't delete comments from other admins
        if author_role == "admin" and current_user.id != comment.author_id:
            allowed = False
        else:
            allowed = True
    elif current_user.id == comment.author_id:
        allowed = True
    elif current_user.role == "moderator" and author_role == "user":
        allowed = True
    else:
        allowed = False

    if not allowed:
        raise HTTPException(status_code=403, detail="Не авторизован для удаления этого комментария")

    deleted = await delete_comment(comment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Комментарий не найден")
    return {"status": "ok", "message": "Комментарий удален успешно"}


@router.post("/tags")
async def create_tag_endpoint(request: Request, name: str = Form(...)):
    token = request.cookies.get("session")
    if not token:
        raise HTTPException(status_code=401, detail="Нет аутентификации")
    data = load_session_token(token)
    if not data:
        raise HTTPException(status_code=401, detail="Недействительная или истекшая сессия")

    user = await get_user_by_username(data.get("username"))
    if not user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    if len(name) > 20:
        raise HTTPException(status_code=400, detail="Имя тега не должно превышать 20 символов")
    
    if len(name) == 0:
        raise HTTPException(status_code=400, detail="Имя тега не может быть пустым")

    try:
        tag = await create_tag(name)
        return {"status": "ok", "idtag": tag.idtag, "name": tag.name, "message": "Тег создан успешно"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/posts/{post_id}/rate")
async def rate_post(post_id: int, request: Request, is_positive: bool = Form(...)):
    """Rate a post with positive or negative rating."""
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
        raise HTTPException(status_code=403, detail="Заблокированные пользователи не могут оценивать посты")

    post = await get_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Пост не найден")
    try:
        rating = await create_or_update_rating(user.id, post_id, is_positive)
        post_rating = await get_post_rating(post_id)
        return {
            "status": "ok",
            "message": "Post rated successfully",
            "rating": post_rating["total"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/posts/{post_id}/rate")
async def unrate_post(post_id: int, request: Request):
    """Remove rating from a post."""
    token = request.cookies.get("session")
    if not token:
        raise HTTPException(status_code=401, detail="Нет аутентификации")
    data = load_session_token(token)
    if not data:
        raise HTTPException(status_code=401, detail="Недействительная или истекшая сессия")

    user = await get_user_by_username(data.get("username"))
    if not user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    post = await get_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Пост не найден")

    deleted = await delete_rating(user.id, post_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Оценка не найдена")
    post_rating = await get_post_rating(post_id)
    return {
        "status": "ok",
        "message": "Оценка удалена успешно",
        "rating": post_rating["total"]
    }


@router.get("/posts/{post_id}/rating")
async def get_post_rating_endpoint(post_id: int):
    """Get the rating count for a post."""
    post = await get_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Пост не найден")

    rating = await get_post_rating(post_id)
    return rating


@router.get("/posts/{post_id}/user-rating")
async def get_user_post_rating(post_id: int, request: Request):
    """Get current user's rating for a post."""
    token = request.cookies.get("session")
    if not token:
        return {"rated": False}
    
    data = load_session_token(token)
    if not data:
        return {"rated": False}

    user = await get_user_by_username(data.get("username"))
    if not user:
        return {"rated": False}

    rating = await user_rated_post(user.id, post_id)
    if rating:
        return {
            "rated": True,
            "is_positive": rating["is_positive"]
        }
    return {"rated": False}


@router.post("/posts/{post_id}/view")
async def increment_view(post_id: int):
    """Increment view count for a post."""
    post = await get_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    success = await increment_post_views(post_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to increment view count")

    return {"status": "ok", "view_count": post["view_count"] + 1}


@router.get("/posts/stats/top-posters")
async def get_top_posters_endpoint(period: str = Query("week", regex="^(today|week)$")):
    """Get top posters by total post views. Period can be 'today' or 'week'."""
    days = 1 if period == "today" else 7
    posters = await get_top_posters(days=days, limit=5)
    return posters


@router.get("/posts/stats/top-posts")
async def get_top_posts_endpoint(period: str = Query("week", regex="^(today|week)$")):
    """Get top posts by view count. Period can be 'today' or 'week'."""
    days = 1 if period == "today" else 7
    posts = await get_top_posts(days=days, limit=5)
    return posts
