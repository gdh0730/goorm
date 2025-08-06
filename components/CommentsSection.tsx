// components/CommentsSection.tsx
'use client'
import { useCurrentUser } from '@/hooks/use-auth'
import { useComments, useCreateComment, useDeleteComment, useToggleCommentLike, useUpdateComment } from '@/hooks/use-posts'
import { useToast } from '@/hooks/use-toast'
import { Comment } from '@/lib/types'
import { useState } from 'react'

interface Props { postId: number }

export function CommentsSection({ postId }: Props) {
  const [page, setPage] = useState(1)
  const { data: resp, isLoading } = useComments(postId, page)
  const comments = resp?.data || []
  const totalPages = resp?.pagination.totalPages || 1
  const createComment = useCreateComment()
  const updateComment = useUpdateComment()
  const deleteComment = useDeleteComment()
  const toggleLike = useToggleCommentLike()
  const toast = useToast()

  if (isLoading) return <p>댓글 로딩 중…</p>

  const handleReply = (parentId: number, content: string) => {
    const value = content.trim()
    if (!value) return toast({ description: '댓글을 입력하세요' })
    createComment.mutate(
      { postId, parentCommentId: parentId, content: value },
      { onError: () => toast({ description: '답글 작성 실패' }) }
    )
  }

  const handleUpdate = (commentId: number, content: string) => {
    const value = content.trim()
    if (!value) return toast({ description: '댓글을 입력하세요' })
    updateComment.mutate(
      { postId, commentId, content: value },
      { onError: () => toast({ description: '수정 실패' }) }
    )
  }

  const handleDelete = (commentId: number) => {
    deleteComment.mutate(
      { postId, commentId },
      { onError: () => toast({ description: '삭제 실패' }) }
    )
  }

  const handleToggleLike = (commentId: number) => {
    toggleLike.mutate({ postId, commentId })
  }

  return (
    <section className="mt-8">
      <h3 className="text-lg font-semibold">댓글 및 리뷰</h3>
      {/* 새 댓글 작성 폼 */}
      <form
        onSubmit={e => {
          e.preventDefault()
          const content = (e.currentTarget.elements.namedItem('new') as HTMLInputElement)
            .value
            .trim()
          if (!content) return toast({ description: '댓글을 입력하세요' })
          createComment.mutate(
            { postId, content },
            { onError: () => toast({ description: '댓글 작성 실패' }) }
          )
          ;(e.currentTarget.elements.namedItem('new') as HTMLInputElement).value = ''
        }}
      >
        <input
          name="new"
          placeholder="댓글을 입력하세요"
          className="w-full border rounded px-2 py-1"
        />
        <button type="submit" className="mt-2 btn-primary">
          등록
        </button>
      </form>

      {/* 댓글 목록 */}
      {comments
        .filter(c => c.parentId === null)
        .map(comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            onReply={handleReply}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onToggleLike={handleToggleLike}
          />
        ))}

      {/* 페이지네이션 */}
      <div className="flex justify-center gap-4 mt-4">
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
          이전
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
          다음
        </button>
      </div>
    </section>
  )
}

// CommentItem 컴포넌트
interface ItemProps {
  comment: Comment
  postId: number
  onReply: (parentId: number, content: string) => void
  onUpdate: (commentId: number, content: string) => void
  onDelete: (commentId: number) => void
  onToggleLike: (commentId: number) => void
}
function CommentItem({ comment, postId, onReply, onUpdate, onDelete, onToggleLike }: ItemProps) {
  const { user } = useCurrentUser()
  const [replyOpen, setReplyOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [draft, setDraft] = useState(comment.content)

  return (
    <div className="border-t py-4">
      <div className="flex items-center justify-between">
        <span className="font-medium">{comment.author}</span>
        <span className="text-sm text-gray-500">{comment.timeAgo}</span>
      </div>

      {editOpen ? (
        <form
          onSubmit={e => {
            e.preventDefault()
            onUpdate(comment.id, draft)
            setEditOpen(false)
          }}
          className="mt-2"
        >
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className="w-full border rounded p-2"
          />
          <div className="flex gap-2 mt-2">
            <button type="submit" className="text-blue-600 text-sm">
              저장
            </button>
            <button
              type="button"
              className="text-gray-500 text-sm"
              onClick={() => {
                setDraft(comment.content)
                setEditOpen(false)
              }}
            >
              취소
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-2">{comment.content}</p>
      )}

      <div className="flex items-center gap-4 text-sm mt-2">
        <button onClick={() => onToggleLike(comment.id)}>👍 {comment.likes}</button>
        <button onClick={() => setReplyOpen(o => !o)}>답글</button>
        {comment.authorId === user?.id && (
          <>
            <button onClick={() => setEditOpen(o => !o)}>수정</button>
            <button onClick={() => onDelete(comment.id)}>삭제</button>
          </>
        )}
      </div>

      {/* 답글폼 */}
      {replyOpen && (
        <form onSubmit={e => {
          e.preventDefault()
          const content = (e.currentTarget.elements.namedItem('r') as HTMLInputElement).value.trim()
          if (!content) return
          onReply(comment.id, content)
          ;(e.currentTarget.elements.namedItem('r') as HTMLInputElement).value = ''
          setReplyOpen(false)
        }} className="mt-2 ml-6">
          <input name="r" placeholder="답글을 입력하세요" className="w-full border rounded px-2 py-1" />
          <button type="submit" className="mt-1 text-sm text-blue-600">등록</button>
        </form>
      )}

      {/* 답글 리스트 */}
      {comment.replies?.length > 0 && (
        <div className="mt-4 ml-6 space-y-4">
          {comment.replies.map(r => (
            <CommentItem
              key={r.id}
              comment={r}
              postId={postId}
              onReply={onReply}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onToggleLike={onToggleLike}
            />
          ))}
        </div>
      )}
    </div>
  )
}
