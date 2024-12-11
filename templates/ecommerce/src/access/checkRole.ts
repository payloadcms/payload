import type { User } from '@/payload-types'

export const checkRole = (allRoles: User['roles'] = [], user?: User | null): boolean => {
  if (user && allRoles) {
    return allRoles.some((role) => {
      return user?.roles?.some((individualRole) => {
        return individualRole === role
      })
    })
  }

  return false
}
