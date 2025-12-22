from typing import Optional
from sqlalchemy import select, insert, func, or_
from passlib.context import CryptContext

try:
    # package import (preferred when running as module)
    from .models import User, Tag, Post, Comment, Rating, PrivateMessage, post_tags
    from .db import async_session
except Exception:
    # fallback when running as script (no package context)
    from models import User, Tag, Post, Comment, Rating, PrivateMessage, post_tags
    from db import async_session

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


async def get_user_by_username(username: str) -> Optional[User]:
    async with async_session() as session:
        result = await session.execute(select(User).where(User.username == username))
        user = result.scalars().first()
        return user


async def get_all_users(limit: int = 100):
    """Get all users sorted by username, limited to specified count."""
    async with async_session() as session:
        result = await session.execute(
            select(User).order_by(User.username).limit(limit)
        )
        users = result.scalars().all()
        
        return [
            {
                "id": user.id,
                "username": user.username,
                "role": user.role,
                "is_banned": user.is_banned,
                "registration_date": user.registration_date
            }
            for user in users
        ]


async def create_user(username: str, password: str, role: str) -> User:
    hashed = pwd_context.hash(password)
    new_user = User(username=username, hashed_password=hashed, role=role)
    async with async_session() as session:
        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)
    return new_user


async def user_exists(username: str) -> bool:
    user = await get_user_by_username(username)
    return user is not None


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


async def get_all_tags() -> list[Tag]:
    async with async_session() as session:
        result = await session.execute(select(Tag))
        tags = result.scalars().all()
        return tags


async def get_all_tags_with_post_counts():
    """Get all tags with their post counts."""
    async with async_session() as session:
        from sqlalchemy import func
        
        result = await session.execute(select(Tag))
        tags = result.scalars().all()
        
        tags_data = []
        for tag in tags:
            # Count posts for this tag
            count_result = await session.execute(
                select(func.count(post_tags.c.post_id)).where(post_tags.c.tag_id == tag.idtag)
            )
            post_count = count_result.scalar() or 0
            
            tags_data.append({
                "idtag": tag.idtag,
                "name": tag.name,
                "description": tag.description,
                "post_count": post_count
            })
        
        return tags_data


async def get_all_posts():
    async with async_session() as session:
        result = await session.execute(select(Post).order_by(Post.date.desc()))
        posts = result.scalars().all()
        
        # Fetch author information for each post
        posts_with_authors = []
        for post in posts:
            author = await get_user_by_id(post.author_id)
            rating = await get_post_rating(post.idposts)
            comments_count = await get_post_comments_count(post.idposts)
            posts_with_authors.append({
                "idposts": post.idposts,
                "title": post.title,
                "text": post.text,
                "date": post.date,
                "author_id": post.author_id,
                "author_name": author.username if author else "Unknown",
                "rating": rating["total"],
                "comment_count": comments_count,
                "view_count": post.view_count or 0
            })
        return posts_with_authors


async def get_user_by_id(user_id: int) -> Optional[User]:
    async with async_session() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()
        return user


async def create_post(title: str, text: str, author_id: int, tag_ids: list[int] = None) -> Post:
    if len(title) >= 500:
        raise ValueError("Title must be less than 500 characters")
    
    async with async_session() as session:
        new_post = Post(title=title, text=text, author_id=author_id)
        session.add(new_post)
        await session.flush()  # Flush to get the post ID
        post_id = new_post.idposts
        
        # Add tags if provided by inserting into junction table directly
        if tag_ids:
            # Prepare values for bulk insert into post_tags junction table
            values = [{"post_id": post_id, "tag_id": tag_id} for tag_id in tag_ids]
            if values:
                await session.execute(insert(post_tags).values(values))
        
        await session.commit()
    
    # Retrieve the created post
    async with async_session() as session:
        result = await session.execute(select(Post).where(Post.idposts == post_id))
        return result.scalars().first()


async def get_post_by_id(post_id: int):
    async with async_session() as session:
        result = await session.execute(select(Post).where(Post.idposts == post_id))
        post = result.scalars().first()
        
        if not post:
            return None
        
        author = await get_user_by_id(post.author_id)
        rating = await get_post_rating(post_id)
        comments_count = await get_post_comments_count(post_id)
        
        # Fetch associated tags (limit to 5)
        tags_result = await session.execute(
            select(Tag).join(post_tags).where(post_tags.c.post_id == post_id).limit(5)
        )
        tags = tags_result.scalars().all()
        
        return {
            "idposts": post.idposts,
            "title": post.title,
            "text": post.text,
            "date": post.date,
            "author_id": post.author_id,
            "author_name": author.username if author else "Unknown",
            "tags": [{"idtag": tag.idtag, "name": tag.name} for tag in tags],
            "rating": rating["total"],
            "comment_count": comments_count,
            "view_count": post.view_count or 0
        }



async def delete_post(post_id: int) -> bool:
    async with async_session() as session:
        result = await session.execute(select(Post).where(Post.idposts == post_id))
        post = result.scalars().first()
        
        if not post:
            return False
        
        await session.delete(post)
        await session.commit()
        return True


async def get_user_posts(user_id: int):
    async with async_session() as session:
        result = await session.execute(
            select(Post).where(Post.author_id == user_id).order_by(Post.date.desc())
        )
        posts = result.scalars().all()
        
        posts_with_ratings = []
        for post in posts:
            author = await get_user_by_id(post.author_id)
            rating = await get_post_rating(post.idposts)
            comments_count = await get_post_comments_count(post.idposts)
            posts_with_ratings.append({
                "idposts": post.idposts,
                "title": post.title,
                "text": post.text,
                "date": post.date,
                "author_id": post.author_id,
                "author_name": author.username if author else "Unknown",
                "rating": rating["total"],
                "comment_count": comments_count,
                "view_count": post.view_count or 0
            })
        return posts_with_ratings


async def promote_user_to_moderator(user_id: int) -> bool:
    async with async_session() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()
        
        if not user:
            return False
        
        user.role = "moderator"
        await session.commit()
        return True


async def demote_user_to_user(user_id: int) -> bool:
    async with async_session() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()

        if not user:
            return False

        user.role = "user"
        await session.commit()
        return True


async def create_comment(post_id: int, text: str, author_id: int, parent_id: int = None) -> Comment:
    if len(text) >= 1000:
        raise ValueError("Comment must be less than 1000 characters")

    new_comment = Comment(text=text, author_id=author_id, post=post_id, parent_id=parent_id)
    async with async_session() as session:
        session.add(new_comment)
        await session.commit()
        await session.refresh(new_comment)
    return new_comment


async def get_comments_by_post(post_id: int):
    async with async_session() as session:
        result = await session.execute(select(Comment).where(Comment.post == post_id).order_by(Comment.date.asc()))
        comments = result.scalars().all()

        comments_with_authors = []
        for c in comments:
            author = await get_user_by_id(c.author_id)
            comments_with_authors.append({
                "idcomments": c.idcomments,
                "text": c.text,
                "author_id": c.author_id,
                "author_name": author.username if author else "Unknown",
                "author_role": author.role if author else "user",
                "parent_id": c.parent_id,
                "date": c.date,
            })
        return comments_with_authors


async def get_comment_by_id(comment_id: int):
    async with async_session() as session:
        result = await session.execute(select(Comment).where(Comment.idcomments == comment_id))
        comment = result.scalars().first()
        return comment


async def delete_comment(comment_id: int) -> bool:
    async with async_session() as session:
        result = await session.execute(select(Comment).where(Comment.idcomments == comment_id))
        comment = result.scalars().first()

        if not comment:
            return False

        await session.delete(comment)
        await session.commit()
        return True


async def ban_user(user_id: int) -> bool:
    async with async_session() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()

        if not user:
            return False

        user.is_banned = True
        await session.commit()
        return True


async def unban_user(user_id: int) -> bool:
    async with async_session() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()

        if not user:
            return False

        user.is_banned = False
        await session.commit()
        return True


async def search_posts(query: str):
    """Search posts by title or text content."""
    if len(query) > 150:
        raise ValueError("Search query cannot exceed 150 characters")
    
    async with async_session() as session:
        # Search in both title and text, case-insensitive
        result = await session.execute(
            select(Post)
            .where(
                (Post.title.ilike(f"%{query}%")) | (Post.text.ilike(f"%{query}%"))
            )
            .order_by(Post.date.desc())
        )
        posts = result.scalars().all()

        posts_with_authors = []
        for post in posts:
            author = await get_user_by_id(post.author_id)
            rating = await get_post_rating(post.idposts)
            comments_count = await get_post_comments_count(post.idposts)
            posts_with_authors.append({
                "idposts": post.idposts,
                "title": post.title,
                "text": post.text,
                "date": post.date,
                "author_id": post.author_id,
                "author_name": author.username if author else "Unknown",
                "rating": rating["total"],
                "comment_count": comments_count,
                "view_count": post.view_count or 0
            })
        return posts_with_authors



async def create_tag(name: str) -> Optional[Tag]:
    """Create a new tag if it doesn't exist and name is valid."""
    if len(name) > 20:
        raise ValueError("Tag name cannot exceed 20 characters")
    
    if len(name) == 0:
        raise ValueError("Tag name cannot be empty")

    async with async_session() as session:
        # Check if tag already exists
        result = await session.execute(select(Tag).where(Tag.name.ilike(name)))
        existing_tag = result.scalars().first()
        if existing_tag:
            raise ValueError("Tag already exists")

        # Create new tag
        new_tag = Tag(name=name, description=None)
        session.add(new_tag)
        await session.commit()
        await session.refresh(new_tag)
        return new_tag

async def get_posts_by_tag(tag_id: int):
    """Get all posts associated with a specific tag."""
    async with async_session() as session:
        # Query posts through the junction table
        result = await session.execute(
            select(Post)
            .join(post_tags)
            .where(post_tags.c.tag_id == tag_id)
            .order_by(Post.date.desc())
        )
        posts = result.scalars().all()
        
        posts_with_authors = []
        for post in posts:
            author = await get_user_by_id(post.author_id)
            rating = await get_post_rating(post.idposts)
            comments_count = await get_post_comments_count(post.idposts)
            posts_with_authors.append({
                "idposts": post.idposts,
                "title": post.title,
                "text": post.text,
                "date": post.date,
                "author_id": post.author_id,
                "author_name": author.username if author else "Unknown",
                "rating": rating["total"],
                "comment_count": comments_count,
                "view_count": post.view_count or 0
            })
        return posts_with_authors

async def search_users(query: str):
    """Search users by username with partial matches."""
    if len(query) > 100:
        raise ValueError("Search query cannot exceed 100 characters")
    
    async with async_session() as session:
        # Search by username, case-insensitive
        result = await session.execute(
            select(User)
            .where(User.username.ilike(f"%{query}%"))
            .order_by(User.username)
        )
        users = result.scalars().all()
        
        return [
            {
                "id": user.id,
                "username": user.username,
                "role": user.role,
                "is_banned": user.is_banned,
                "registration_date": user.registration_date
            }
            for user in users
        ]


async def get_post_rating(post_id: int) -> dict:
    """Get the rating count for a post (positive - negative)."""
    async with async_session() as session:
        # Count positive ratings
        positive_result = await session.execute(
            select(func.count(Rating.id)).where(
                (Rating.post_id == post_id) & (Rating.is_positive == True)
            )
        )
        positive_count = positive_result.scalar() or 0
        
        # Count negative ratings
        negative_result = await session.execute(
            select(func.count(Rating.id)).where(
                (Rating.post_id == post_id) & (Rating.is_positive == False)
            )
        )
        negative_count = negative_result.scalar() or 0
        
        return {
            "post_id": post_id,
            "positive": positive_count,
            "negative": negative_count,
            "total": positive_count - negative_count
        }


async def user_rated_post(user_id: int, post_id: int) -> Optional[dict]:
    """Check if a user has rated a post and return the rating details."""
    async with async_session() as session:
        result = await session.execute(
            select(Rating).where(
                (Rating.user_id == user_id) & (Rating.post_id == post_id)
            )
        )
        rating = result.scalars().first()
        
        if rating:
            return {
                "id": rating.id,
                "is_positive": rating.is_positive
            }
        return None

async def get_user_total_rating(user_id: int) -> int:
    """Get the total rating sum for all posts by a user (positive - negative)."""
    async with async_session() as session:
        # Get all posts by the user
        posts_result = await session.execute(
            select(Post.idposts).where(Post.author_id == user_id)
        )
        post_ids = posts_result.scalars().all()
        
        if not post_ids:
            return 0
        
        # Count positive ratings for all user's posts
        positive_result = await session.execute(
            select(func.count(Rating.id)).where(
                (Rating.post_id.in_(post_ids)) & (Rating.is_positive == True)
            )
        )
        positive_count = positive_result.scalar() or 0
        
        # Count negative ratings for all user's posts
        negative_result = await session.execute(
            select(func.count(Rating.id)).where(
                (Rating.post_id.in_(post_ids)) & (Rating.is_positive == False)
            )
        )
        negative_count = negative_result.scalar() or 0
        
        return positive_count - negative_count

async def create_or_update_rating(user_id: int, post_id: int, is_positive: bool) -> Rating:
    """Create a new rating or update existing rating for a post by a user."""
    async with async_session() as session:
        # Check if rating exists
        result = await session.execute(
            select(Rating).where(
                (Rating.user_id == user_id) & (Rating.post_id == post_id)
            )
        )
        existing_rating = result.scalars().first()
        
        if existing_rating:
            # Update existing rating
            existing_rating.is_positive = is_positive
            await session.commit()
            await session.refresh(existing_rating)
            return existing_rating
        else:
            # Create new rating
            new_rating = Rating(user_id=user_id, post_id=post_id, is_positive=is_positive)
            session.add(new_rating)
            await session.commit()
            await session.refresh(new_rating)
            return new_rating


async def delete_rating(user_id: int, post_id: int) -> bool:
    """Delete a rating by a user for a post."""
    async with async_session() as session:
        result = await session.execute(
            select(Rating).where(
                (Rating.user_id == user_id) & (Rating.post_id == post_id)
            )
        )
        rating = result.scalars().first()
        
        if rating:
            await session.delete(rating)
            await session.commit()
            return True
        return False


async def get_post_comments_count(post_id: int) -> int:
    """Get the count of comments for a post."""
    async with async_session() as session:
        result = await session.execute(
            select(func.count(Comment.idcomments)).where(Comment.post == post_id)
        )
        count = result.scalar() or 0
        return count


async def increment_post_views(post_id: int) -> bool:
    """Increment the view count for a post."""
    async with async_session() as session:
        result = await session.execute(select(Post).where(Post.idposts == post_id))
        post = result.scalars().first()
        
        if post:
            post.view_count = (post.view_count or 0) + 1
            await session.commit()
            return True
        return False



async def send_private_message(user_from_id: int, user_to_id: int, text: str) -> Optional[PrivateMessage]:
    """Send a private message from one user to another."""
    if len(text) > 5000:
        raise ValueError("Message cannot exceed 5000 characters")
    
    # Check if sender is banned
    sender = await get_user_by_id(user_from_id)
    if sender and sender.is_banned:
        raise ValueError("Banned users cannot send messages")
    
    # Check if recipient is banned
    recipient = await get_user_by_id(user_to_id)
    if recipient and recipient.is_banned:
        raise ValueError("Cannot send message to banned user")
    
    new_message = PrivateMessage(user_from=user_from_id, user_to=user_to_id, text=text)
    async with async_session() as session:
        session.add(new_message)
        await session.commit()
        await session.refresh(new_message)
    return new_message


async def get_conversation(user_id: int, other_user_id: int) -> list[dict]:
    """Get all messages in a conversation between two users."""
    async with async_session() as session:
        result = await session.execute(
            select(PrivateMessage).where(
                ((PrivateMessage.user_from == user_id) & (PrivateMessage.user_to == other_user_id)) |
                ((PrivateMessage.user_from == other_user_id) & (PrivateMessage.user_to == user_id))
            ).order_by(PrivateMessage.date.asc())
        )
        messages = result.scalars().all()
        
        messages_data = []
        for msg in messages:
            sender = await get_user_by_id(msg.user_from)
            messages_data.append({
                "id": msg.id,
                "user_from": msg.user_from,
                "user_to": msg.user_to,
                "sender_name": sender.username if sender else "Unknown",
                "text": msg.text,
                "date": msg.date
            })
        return messages_data


async def get_user_conversations(user_id: int) -> list[dict]:
    """Get all users this user has had conversations with."""
    async with async_session() as session:
        result = await session.execute(
            select(PrivateMessage).where(
                (PrivateMessage.user_from == user_id) | (PrivateMessage.user_to == user_id)
            ).order_by(PrivateMessage.date.desc())
        )
        messages = result.scalars().all()
        
        # Get unique users from conversation
        conversation_users = {}
        for msg in messages:
            other_user_id = msg.user_to if msg.user_from == user_id else msg.user_from
            if other_user_id not in conversation_users:
                other_user = await get_user_by_id(other_user_id)
                conversation_users[other_user_id] = {
                    "id": other_user_id,
                    "username": other_user.username if other_user else "Unknown",
                    "last_message_date": msg.date
                }
        
        return list(conversation_users.values())


async def save_profile_photo(user_id: int, filename: str) -> bool:
    """Save profile photo filename for a user."""
    async with async_session() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()
        if not user:
            return False
        user.profile_photo = filename
        await session.commit()
        return True


async def delete_profile_photo(user_id: int) -> bool:
    """Delete profile photo for a user."""
    async with async_session() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()
        if not user:
            return False
        user.profile_photo = None
        await session.commit()
        return True


async def get_top_posters(days: int = 7, limit: int = 5):
    """Get top posters by total post views for the last N days."""
    from datetime import datetime, timedelta
    
    async with async_session() as session:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get posts from last N days with their authors and view counts
        result = await session.execute(
            select(Post.author_id, User.username, func.sum(Post.view_count).label('total_views'))
            .join(User, Post.author_id == User.id)
            .where(Post.date >= start_date)
            .group_by(Post.author_id, User.username)
            .order_by(func.sum(Post.view_count).desc())
            .limit(limit)
        )
        
        rows = result.all()
        return [
            {
                "author_id": row.author_id,
                "username": row.username,
                "total_views": row.total_views or 0
            }
            for row in rows
        ]


async def get_top_posts(days: int = 7, limit: int = 5):
    """Get top posts by view count for the last N days."""
    from datetime import datetime, timedelta
    
    async with async_session() as session:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        result = await session.execute(
            select(Post.idposts, Post.title, Post.view_count, Post.author_id, User.username)
            .join(User, Post.author_id == User.id)
            .where(Post.date >= start_date)
            .order_by(Post.view_count.desc())
            .limit(limit)
        )
        
        rows = result.all()
        return [
            {
                "idposts": row.idposts,
                "title": row.title,
                "view_count": row.view_count,
                "author_id": row.author_id,
                "author_name": row.username
            }
            for row in rows
        ]
