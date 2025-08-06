export interface Post {
  id: number
  title: string
  content: string
  author: string
  avatar?: string
  category: string
  likes: number
  comments: number
  views: number
  timeAgo: string
  isPinned: boolean
  tags: string[]
  rating?: number
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: number
  postId: number
  author: string
  avatar?: string
  authorId: number            // 작성자 식별용
  content: string
  likes: number
  timeAgo: string
  createdAt: string
  updatedAt: string
  parentId: number | null;    // null: 최상위 댓글, 숫자: 이 댓글의 부모 댓글 ID
  replies?: Comment[];        // depth-1 답글 목록
}

export interface User {
  id: number
  username: string
  avatar?: string
  role: "guest" | "member" | "admin"
  joinDate: string
}

export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
  }
  message: string
  success: boolean
}

export interface PostFilters {
  category?: string
  search?: string
  sortBy?: "latest" | "popular" | "trending"
  page?: number
  limit?: number
} 