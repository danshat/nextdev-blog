// nextdev/app/posts/[id]/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import DeletePostButton from "@/app/components/DeletePostButton";
import CreateCommentForm from "@/app/components/CreateCommentForm";
import CommentThread from "@/app/components/CommentThread";
import RatingButtons from "@/app/components/RatingButtons";
import { getCurrentUser } from "@/app/lib/auth";
import { Post } from "@/app/lib/types";
import { Comment } from "@/app/lib/types";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PostPage({ params }: PageProps) {
  const resolvedParams = await params;

  // Server-side check with backend
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    // Not authenticated -> redirect to login page
    redirect("/login");
  }

  // Fetch the specific post
  const postRes = await fetch(`http://localhost:8000/posts/${resolvedParams.id}`, {
    cache: "no-store",
  });

  if (!postRes.ok) {
    redirect("/");
  }

  const post: Post = await postRes.json();

  // Increment view count
  try {
    await fetch(`http://localhost:3000/api/posts/${resolvedParams.id}/view`, {
      method: 'POST',
    });
  } catch (err) {
    console.error('Failed to increment view:', err);
  }

  // Check if current user is the author or has moderator/admin role
  const isAuthor = currentUser.id === post.author_id;
  const isModeratorOrAdmin = currentUser.role === "moderator" || currentUser.role === "admin";

  // Fetch comments for this post
  const commentsRes = await fetch(`http://localhost:8000/posts/${resolvedParams.id}/comments`, {
    cache: "no-store",
  });

  let comments: Comment[] = [];
  if (commentsRes.ok) {
    comments = await commentsRes.json();
  }

  // Calculate reading time (200 words per minute)
  const wordCount = post.text.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <Navbar currentUser={currentUser} />

      {/* Main Content */}
      <main className="flex-1 flex justify-center pt-10 px-10">
        <div className="w-full max-w-3xl">
          {/* Back button */}
          <Link href="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm mb-6 inline-block">
            ← Вернуться на главную
          </Link>

          {/* Post content */}
          <article className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 border border-gray-200 dark:border-gray-700">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 truncate">
              {post.title}
            </h1>
            
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700 flex-wrap">
              <span>Автор: </span>
              <Link
                href={`/profile/${post.author_id}`}
                className="font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                {post.author_name}
              </Link>
              <span>•</span>
              <span>{new Date(post.date).toLocaleDateString('ru-RU')}</span>
              <span>•</span>
              <span>🕐 {readingTime} мин. чтения</span>
              {post.view_count !== undefined && (
                <>
                  <span>•</span>
                  <span>👁️ {post.view_count} просмотров</span>
                </>
              )}
            </div>

            <div className="prose dark:prose-invert max-w-full">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed break-words">
                {post.text}
              </p>
            </div>

            {/* Tags section */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Теги:</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag.idtag}
                      href={`/tags/${tag.idtag}`}
                      className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Delete button */}
            <DeletePostButton
              postId={post.idposts}
              isAuthor={isAuthor}
              isModeratorOrAdmin={isModeratorOrAdmin}
            />

            {/* Rating section */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Оценка поста</h3>
              <RatingButtons 
                postId={post.idposts}
                initialRating={post.rating || 0}
                isBanned={currentUser.is_banned || false}
              />
            </div>
          
            {/* Comments list */}
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Комментарии</h3>
              {comments.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">К этому посту ещё нет комментариев.</p>
              ) : (
                <div className="space-y-4">
                  {comments
                    .filter((c) => !c.parent_id) // Only show root comments, replies are shown nested
                    .map((rootComment) => (
                      <CommentThread
                        key={rootComment.idcomments}
                        comment={rootComment}
                        allComments={comments}
                        currentUserId={currentUser.id}
                        currentUserRole={currentUser.role}
                        postId={post.idposts}
                      />
                    ))}
                </div>
              )}

              {/* Create comment form */}
              <CreateCommentForm postId={post.idposts} />
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}