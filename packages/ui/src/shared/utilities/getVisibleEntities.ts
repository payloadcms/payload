import type { PayloadRequest, VisibleEntities } from 'payload'

type Hidden = ((args: { user: unknown }) => boolean) | boolean

function isHidden(hidden: Hidden | undefined, user: unknown): boolean {
  if (typeof hidden === 'function') {
    try {
      return hidden({ user })
    } catch {
      return true
    }
  }
  return !!hidden
}

export function getVisibleEntities({ req }: { req: PayloadRequest }): VisibleEntities {
  return {
    collections: req.payload.config.collections
      .map(({ slug, admin: { hidden } }) => (!isHidden(hidden, req.user) ? slug : null))
      .filter(Boolean),
    globals: req.payload.config.globals
      .map(({ slug, admin: { hidden } }) => (!isHidden(hidden, req.user) ? slug : null))
      .filter(Boolean),
  }
}
