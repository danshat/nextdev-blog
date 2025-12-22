import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import ChatWindow from "@/app/components/ChatWindow";
import PromoteButton from "@/app/components/PromoteButton";
import BanButton from "@/app/components/BanButton";
import ProfilePhotoUpload from "@/app/components/ProfilePhotoUpload";
import DeleteProfilePhotoButton from "@/app/components/DeleteProfilePhotoButton";
import { getCurrentUser } from "@/app/lib/auth";
import { User, Post } from "@/app/lib/types";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const resolvedParams = await params;

  // Server-side check with backend
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    // Not authenticated -> redirect to login page
    redirect("/login");
  }

  // Fetch the profile of the user being viewed
  const profileRes = await fetch(
    `http://localhost:8000/users/${resolvedParams.id}`,
    {
      cache: "no-store",
    }
  );

  if (!profileRes.ok) {
    redirect("/");
  }

  const profileUser: User = await profileRes.json();

  // Fetch user's posts
  const postsRes = await fetch(
    `http://localhost:8000/users/${resolvedParams.id}/posts`,
    {
      cache: "no-store",
    }
  );

  let userPosts: Post[] = [];
  if (postsRes.ok) {
    userPosts = await postsRes.json();
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <Navbar currentUser={currentUser} />

      {/* Main Content */}
      <main className="flex-1 flex justify-center pt-10 px-10 pb-10">
        <div className="w-full max-w-6xl grid grid-cols-3 gap-6">
          {/* Left/Center Column - Profile and Posts */}
          <div className="col-span-2 space-y-8">
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 border border-gray-200 dark:border-gray-700">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Профиль пользователя
              </h1>

              <div className="flex gap-6 mb-6">
                {/* Profile Photo */}
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-300 dark:border-gray-600">
                    {profileUser.profile_photo ? (
                      <img
                        src={`http://localhost:8000/uploads/profile_photos/${profileUser.profile_photo}?t=${Date.now()}`}
                        alt={profileUser.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">👤</span>
                    )}
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-gray-700 dark:text-gray-300">
                      Никнейм:
                    </p>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {profileUser.username}
                    </h2>
                  </div>
                  <div>
                    <p className="text-gray-700 dark:text-gray-300">
                      Роль:
                    </p>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {profileUser.role}
                    </h2>
                  </div>
                  <div>
                    <p className="text-gray-700 dark:text-gray-300">
                      Дата регистрации:
                    </p>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {profileUser.registration_date}
                    </h2>
                  </div>
                  <div>
                    <p className="text-gray-700 dark:text-gray-300">
                      Общий рейтинг:
                    </p>
                    <h2 className={`text-lg font-semibold ${profileUser.total_rating !== undefined && profileUser.total_rating > 0 ? 'text-green-600 dark:text-green-400' : profileUser.total_rating !== undefined && profileUser.total_rating < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                      {profileUser.total_rating !== undefined ? `${profileUser.total_rating > 0 ? '+' : ''}${profileUser.total_rating}` : '0'}
                    </h2>
                  </div>
                </div>
              </div>
              {profileUser.is_banned && (
                <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg mt-4">
                  <p className="text-red-800 dark:text-red-200 font-semibold">
                    ⚠️ Этот пользователь заблокирован
                  </p>
                </div>
              )}

              {/* Profile Photo Upload/Delete */}
              {currentUser.id === profileUser.id && (
                <ProfilePhotoUpload userId={profileUser.id} isBanned={profileUser.is_banned || false} />
              )}
              {currentUser.id !== profileUser.id && (currentUser.role === "admin" || currentUser.role === "moderator") && (
                <DeleteProfilePhotoButton userId={profileUser.id} userRole={currentUser.role} hasPhoto={!!profileUser.profile_photo} />
              )}

              {/* Promote and Ban Buttons */}
              <div className="mt-6 flex flex-col gap-4">
                <PromoteButton
                  userId={profileUser.id}
                  userRole={profileUser.role}
                  currentUserRole={currentUser.role}
                />
                <BanButton
                  userId={profileUser.id}
                  isBanned={profileUser.is_banned || false}
                  currentUserRole={currentUser.role}
                />
              </div>
            </div>

            {/* User's Posts Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Статьи пользователя
              </h2>

              {userPosts.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  У этого пользователя нет статей.
                </p>
              ) : (
                <div className="space-y-4">
                  {userPosts.map((post) => (
                    <Link key={post.idposts} href={`/posts/${post.idposts}`}>
                      <div className="p-4 mb-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition cursor-pointer">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 truncate">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{new Date(post.date).toLocaleDateString("ru-RU")}</span>
                          <span>•</span>
                          <span>{post.author_name}</span>
                        </div>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>💬 {post.comment_count || 0}</span>
                          <span>👁️ {post.view_count || 0}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Chat Window */}
          {currentUser.id !== profileUser.id && (
            <div className="col-span-1 h-full sticky top-20">
              <ChatWindow currentUser={currentUser} otherUser={profileUser} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
