import type { Access } from 'payload'

/** Any signed-in user may access authenticated-only content. */
export const authenticated: Access = ({ req }) => Boolean(req.user)

/** Only users explicitly assigned the administrator role may mutate content. */
export const adminOnly: Access = ({ req }) => req.user?.role === 'admin'

/** Allow public API consumers to read published posts, while administrators can preview drafts. */
export const authenticatedOrPublished: Access = ({ req }) =>
  Boolean(req.user) || {
    _status: {
      equals: 'published',
    },
  }
