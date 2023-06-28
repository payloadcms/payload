import type { Access } from 'payload/config'

export const adminsOrPublished: Access = ({ req: { user } }) => {
  if (user && user.collection === 'admins') {
    return true
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}
