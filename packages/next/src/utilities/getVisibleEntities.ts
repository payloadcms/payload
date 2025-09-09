import type { PayloadRequest, VisibleEntities } from 'payload'

import { isEntityHidden } from 'payload'

export function getVisibleEntities({ req }: { req: PayloadRequest }): VisibleEntities {
  return {
    collections: req.payload.config.collections
      .map(({ slug, admin: { hidden } }) =>
        !isEntityHidden({ hidden, user: req.user }) ? slug : null,
      )
      .filter(Boolean),
    globals: req.payload.config.globals
      .map(({ slug, admin: { hidden } }) =>
        !isEntityHidden({ hidden, user: req.user }) ? slug : null,
      )
      .filter(Boolean),
  }
}
