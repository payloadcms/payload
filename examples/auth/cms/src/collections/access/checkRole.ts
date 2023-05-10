import type { User } from '../../payload-types'

export const checkRole = (allRoles: User['roles'] = [], user: User = undefined): boolean => {
  if (user) {
    if (
      allRoles.some(role => {
        return user?.roles?.some(individualRole => {
          return individualRole === role
        })
      })
    )
      return true
  }

  return false
}
