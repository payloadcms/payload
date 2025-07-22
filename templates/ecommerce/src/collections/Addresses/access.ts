import type { Access } from 'payload'

export const ownerOrAdminAddress: Access = async ({ id, data, req: { user } }) => {
  if (user?.roles && user?.roles.length && user?.roles?.includes('admin')) {
    return true
  }

  if (user?.id) {
    return {
      customer: {
        equals: user.id,
      },
    }
  }

  return false
}
