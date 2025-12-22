from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Table, UniqueConstraint
from sqlalchemy.orm import relationship
try:
    # package import (preferred when running as module)
    from .db import Base
except Exception:
    # fallback when running as script (no package context)
    from db import Base


# Junction table for many-to-many relationship between posts and tags
post_tags = Table(
    "post_tags",
    Base.metadata,
    Column("post_id", Integer, ForeignKey("posts.idposts", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.idtag", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(10), default="user")
    is_active = Column(Boolean, default=True)
    is_banned = Column(Boolean, default=False)
    registration_date = Column(DateTime, default=datetime.utcnow)
    profile_photo = Column(String(255), nullable=True)
    # Relationship to ratings
    ratings = relationship("Rating", back_populates="user", cascade="all, delete-orphan")


class Tag(Base):
    __tablename__ = "tags"

    idtag = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(String, nullable=True)
    # Relationship to posts
    posts = relationship("Post", secondary=post_tags, back_populates="tags")


class Post(Base):
    __tablename__ = "posts"

    idposts = Column(Integer, primary_key=True, index=True)
    title = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    text = Column(Text, nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    view_count = Column(Integer, default=0)
    # Relationship to tags
    tags = relationship("Tag", secondary=post_tags, back_populates="posts")
    # Relationship to ratings
    ratings = relationship("Rating", back_populates="post", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    idcomments = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    post = Column(Integer, ForeignKey("posts.idposts", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("comments.idcomments", ondelete="CASCADE"), nullable=True, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    
    # Self-referential relationship for nested comments
    parent = relationship("Comment", remote_side=[idcomments], backref="replies", cascade="all, delete-orphan", single_parent=True)


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    post_id = Column(Integer, ForeignKey("posts.idposts", ondelete="CASCADE"), nullable=False, index=True)
    is_positive = Column(Boolean, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="ratings")
    post = relationship("Post", back_populates="ratings")
    
    # Ensure one rating per user per post
    __table_args__ = (UniqueConstraint('user_id', 'post_id', name='unique_user_post_rating'),)


class PrivateMessage(Base):
    __tablename__ = "private_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_from = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    user_to = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    text = Column(Text, nullable=False)
    date = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sender = relationship("User", foreign_keys=[user_from], backref="sent_messages")
    recipient = relationship("User", foreign_keys=[user_to], backref="received_messages")


# establish relationship so ORM cascade can remove comments when a post is deleted
Post.comments = relationship("Comment", backref="post_obj", cascade="all, delete-orphan", passive_deletes=True)

