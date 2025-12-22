import asyncio
import getpass

try:
    from src.users import get_user_by_username
    from src.db import async_session
    from src.models import User
except ImportError:
    from users import get_user_by_username
    from db import async_session
    from models import User

async def main():
    username = input("Enter username to remove: ").strip()
    async with async_session() as session:
        user = await get_user_by_username(username)
        if not user:
            print(f"User '{username}' does not exist.")
            return
        await session.execute(
            User.__table__.delete().where(User.username == username)
        )
        await session.commit()
        print(f"User '{username}' has been removed.")

if __name__ == "__main__":
    asyncio.run(main())
