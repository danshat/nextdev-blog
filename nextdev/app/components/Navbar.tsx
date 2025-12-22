import Link from "next/link";
import LogoutButton from "@/app/LogoutButton";
import { User } from "@/app/lib/types";

interface NavbarProps {
  currentUser: User;
}

export default function Navbar({ currentUser }: NavbarProps) {
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Left side: Logo and navigation buttons */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 transition">
            <img src="/logo.svg" alt="NextDev logo" width={40} height={40} className="block" />
          </Link>
          
          {/* Navigation buttons */}
          <a
            href="/new_post"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          >
            +
          </a>
          <a
            href="/"
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            Главная
          </a>
          <a
            href="/users"
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            Пользователи
          </a>
          <a
            href="/tags"
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            Теги
          </a>
          <a
            href="/search"
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            Поиск
          </a>
        </div>

        {/* Right side: Username and Logout buttons */}
        <div className="flex items-center gap-2">
          <Link
            href={`/profile/${currentUser.id}`}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            {currentUser.username}
          </Link>
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
