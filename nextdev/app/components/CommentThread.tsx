"use client";

import { useState } from "react";
import { Comment } from "@/app/lib/types";
import DeleteCommentButton from "@/app/components/DeleteCommentButton";
import CreateCommentForm from "@/app/components/CreateCommentForm";

interface CommentThreadProps {
  comment: Comment;
  allComments: Comment[];
  currentUserId: number;
  currentUserRole: string;
  postId: number;
  onCommentCreated?: () => void;
}

export default function CommentThread({
  comment,
  allComments,
  currentUserId,
  currentUserRole,
  postId,
  onCommentCreated,
}: CommentThreadProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const replies = allComments.filter((c) => c.parent_id === comment.idcomments);

  return (
    <div className="space-y-3">
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm text-gray-700 dark:text-gray-200 font-medium">
              {comment.author_name} <span className="text-xs text-gray-500">• {comment.author_role}</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{comment.date}</div>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ответить...
            </button>
            {/* Show delete button when: admin OR (moderator and comment author is user) OR comment owner */}
            {(currentUserRole === "admin" || (currentUserRole === "moderator" && comment.author_role === "user") || currentUserId === comment.author_id) && (
              <DeleteCommentButton commentId={comment.idcomments} />
            )}
          </div>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mt-3 whitespace-pre-wrap">{comment.text}</p>
      </div>

      {/* Reply form */}
      {showReplyForm && (
        <div className="ml-6 mt-3">
          <CreateCommentForm
            postId={postId}
            parentId={comment.idcomments}
            onCommentCreated={() => {
              setShowReplyForm(false);
              onCommentCreated?.();
            }}
          />
        </div>
      )}

      {/* Replies */}
      {replies.length > 0 && (
        <div className="ml-6 space-y-3 border-l-2 border-gray-300 dark:border-gray-600 pl-4 mt-3">
          {replies.map((reply) => (
            <CommentThread
              key={reply.idcomments}
              comment={reply}
              allComments={allComments}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              postId={postId}
              onCommentCreated={onCommentCreated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
