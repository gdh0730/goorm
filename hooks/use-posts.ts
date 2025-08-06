import { commentApi, postApi } from '@/lib/api'
import { Post, PostFilters } from '@/lib/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// 포스트 목록 조회 훅
export function usePosts(filters: PostFilters = {}) {
  return useQuery({
    queryKey: ['posts', filters],
    queryFn: () => postApi.getPosts(filters),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  })
}

// 단일 포스트 조회 훅
export function usePost(postId: number) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: () => postApi.getPost(postId),
    enabled: !!postId,
    staleTime: 2 * 60 * 1000, // 2분
  })
}

// 포스트 생성 훅
export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: postApi.createPost,
    onSuccess: () => {
      // 포스트 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

// 포스트 수정 훅
export function useUpdatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Post> }) =>
      postApi.updatePost(id, data),
    onSuccess: (_, { id }) => {
      // 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post', id] })
    },
  })
}

// 포스트 삭제 훅
export function useDeletePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: postApi.deletePost,
    onSuccess: () => {
      // 포스트 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

// 좋아요 토글 훅
export function useToggleLike() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: postApi.toggleLike,
    onSuccess: (data, postId) => {
      // 포스트 상세 정보 업데이트
      queryClient.setQueryData(['post', postId], (old: any) => {
        if (old?.data) {
          return {
            ...old,
            data: {
              ...old.data,
              likes: data.data.likesCount,
            },
          }
        }
        return old
      })

      // 포스트 목록에서도 업데이트
      queryClient.setQueriesData({ queryKey: ['posts'] }, (old: any) => {
        if (old?.data) {
          return {
            ...old,
            data: old.data.map((post: Post) =>
              post.id === postId ? { ...post, likes: data.data.likesCount } : post
            ),
          }
        }
        return old
      })
    },
  })
}

// 조회수 증가 훅
export function useIncrementViews() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: postApi.incrementViews,
    onSuccess: (data, postId) => {
      // 포스트 상세 정보 업데이트
      queryClient.setQueryData(['post', postId], (old: any) => {
        if (old?.data) {
          return {
            ...old,
            data: {
              ...old.data,
              views: data.data.viewsCount,
            },
          }
        }
        return old
      })

      // 포스트 목록에서도 업데이트
      queryClient.setQueriesData({ queryKey: ['posts'] }, (old: any) => {
        if (old?.data) {
          return {
            ...old,
            data: old.data.map((post: Post) =>
              post.id === postId ? { ...post, views: data.data.viewsCount } : post
            ),
          }
        }
        return old
      })
    },
  })
}

// 댓글 목록 조회 훅
export function useComments(postId: number, page: number = 1) {
  return useQuery({
    queryKey: ['comments', postId, page],
    queryFn: () => commentApi.getComments(postId, page),
    enabled: !!postId,
    staleTime: 2 * 60 * 1000, // 2분
  })
}

// 댓글 생성 훅
export function useCreateComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ postId, content, parentCommentId }) =>
      commentApi.createComment(postId, content, parentCommentId),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      queryClient.setQueryData(['post', postId], (old: any) => {
        if (old?.data) {
          return {
            ...old,
            data: { ...old.data, comments: old.data.comments + 1 },
          }
        }
        return old
      })
    }
  })
}

// 댓글 수정 훅
export function useUpdateComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ commentId, content }) => commentApi.updateComment(commentId, content),
    onSuccess: (_, { postId }) => queryClient.invalidateQueries({ queryKey: ['comments', postId] }),
  })
}

// 댓글 삭제 훅
export function useDeleteComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (commentId: number) => commentApi.deleteComment(commentId),
    onSuccess: () =>
      // 댓글 목록 캐시 무효화 
      queryClient.invalidateQueries({ queryKey: ['comments'] }),
    // 포스트의 댓글 수 업데이트 (댓글 목록에서 postId를 찾아야 함)
    // 이 부분은 실제 구현에서 댓글 데이터 구조에 따라 조정 필요
  })
}

// hooks/use-posts.ts 에 아래 두 훅을 추가

/*
// 답글 생성 훅
export function useCreateReply() {
  const qc = useQueryClient()
  return useMutation(
    ({ postId, parentCommentId, content }: { postId: number; parentCommentId: number; content: string }) =>
      commentApi.createComment(postId, content, parentCommentId),
    {
      onSuccess: (_, { postId }) => {
        qc.invalidateQueries({ queryKey: ['comments', postId] })
      },
    }
  )
}
*/

// 댓글 좋아요 토글 훅
export function useToggleCommentLike() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: number) => commentApi.toggleCommentLike(commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments'] }),
  })
}
