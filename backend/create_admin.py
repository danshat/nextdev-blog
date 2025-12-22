import asyncio
import getpass

try:
    from src.users import create_user, get_user_by_username
    from src.db import async_session
    from src.models import User
except ImportError:
    from users import create_user, get_user_by_username
    from db import async_session
    from models import User

async def main():
    username = input("Enter admin username: ").strip()
    password = getpass.getpass("Enter admin password: ").strip()
    print(password)
    async with async_session() as session:
        existing = await get_user_by_username(username)
        if existing:
            print(f"User '{username}' already exists.")
            return
        # Use create_user to hash password and add user with admin role
        await create_user(username, password, role="admin")
        await session.commit()
        print(f"Admin user '{username}' created.")

if __name__ == "__main__":
    asyncio.run(main())
