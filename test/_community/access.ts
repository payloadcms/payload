import type { Access, FieldAccess } from 'payload'

export const isAdmin: Access = ({ req: { user } }) => user?.role === 'admin'
export const isEditor: Access = ({ req: { user } }) =>
  user?.role === 'admin' || user?.role === 'editor'
export const signedIn: Access = ({ req: { user } }) => Boolean(user)
export const publishedOrEditor: Access = ({ req: { user } }) =>
  user?.role === 'admin' || user?.role === 'editor' ? true : { _status: { equals: 'published' } }
export const adminField: FieldAccess = ({ req: { user } }) => user?.role === 'admin'
export const contentAccess = {
  create: isEditor,
  delete: isAdmin,
  read: () => true,
  update: isEditor,
}
