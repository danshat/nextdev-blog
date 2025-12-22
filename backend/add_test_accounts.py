#!/usr/bin/env python3
"""
Script to add test accounts to the database.
Test accounts:
  - admin / admin (role: admin)
  - moderator / moderator (role: moderator)
  - user / user (role: user)
"""

import asyncio
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

from src.users import create_user, user_exists


async def main():
    test_accounts = [
        ("admin", "admin", "admin"),
        ("moderator", "moderator", "moderator"),
        ("user", "user", "user"),
    ]

    for username, password, role in test_accounts:
        try:
            # Check if user already exists
            exists = await user_exists(username)
            if exists:
                print(f"✓ User '{username}' already exists")
                continue

            # Create user
            user = await create_user(username, password, role)
            print(f"✓ Created {role} account: {username}")

        except Exception as e:
            print(f"✗ Error creating account '{username}': {e}")
            return 1

    print("\n✓ All test accounts are ready!")
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
