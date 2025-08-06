import { userApi } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

export function useCurrentUser() {
  const { data, ...query } = useQuery({
    queryKey: ['currentUser'],
    queryFn: userApi.getCurrentUser,
    staleTime: 5 * 60 * 1000,
  })
  return { user: data?.data, ...query }
}
