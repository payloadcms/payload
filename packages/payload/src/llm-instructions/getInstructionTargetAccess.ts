import type { PayloadRequest, Where } from '../types/index.js'
import type { InstructionTarget } from './shared.js'

import { executeAccess } from '../auth/executeAccess.js'

export const getInstructionTargetAccess = async ({
  operation,
  req,
  targets,
}: {
  operation: 'read' | 'update'
  req: PayloadRequest
  targets: InstructionTarget[]
}): Promise<false | Where> => {
  if (!req.user) {
    return false
  }

  const constraints = await Promise.all(
    targets.map(async ({ slug, type }): Promise<false | Where> => {
      const target =
        type === 'collection'
          ? req.payload.collections[slug]?.config
          : req.payload.config.globals.find((global) => global.slug === slug)

      if (!target) {
        return false
      }

      const accessArgs = { slug, disableErrors: true, req }
      const canRead = await executeAccess(accessArgs, target.access.read)

      if (!canRead) {
        return false
      }

      if (operation === 'update' && !(await executeAccess(accessArgs, target.access.update))) {
        return false
      }

      // Like admin permissions, a document filter grants conditional entity access.
      // Scope instructions by target instead of applying that filter to instruction documents.
      return { entitySlug: { equals: slug }, entityType: { equals: type } }
    }),
  )
  const where = constraints.filter((constraint): constraint is Where => constraint !== false)

  return where.length ? { or: where } : false
}
