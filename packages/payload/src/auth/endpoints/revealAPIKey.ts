import type { PayloadHandler } from '../../config/types.js'

import { combineQueries } from '../../database/combineQueries.js'
import { UnauthorizedError } from '../../errors/UnauthorizedError.js'
import { fieldAffectsData } from '../../fields/config/types.js'
import { canAccessAdmin } from '../../utilities/canAccessAdmin.js'
import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'
import { executeAccess } from '../executeAccess.js'

/**
 * Reveals an encrypted API key when the collection explicitly enables reveal support.
 * This endpoint is only injected when `auth.useAPIKey.reveal` is `true`.
 */
export const revealAPIKeyHandler: PayloadHandler = async (req) => {
  const { id, collection } = getRequestCollectionWithID(req)
  const useAPIKey = collection.config.auth.useAPIKey

  if (typeof useAPIKey !== 'object' || useAPIKey.reveal !== true || !req.user) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await canAccessAdmin({ req })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    throw error
  }

  const userWithReadAccess = await req.payload.findByID({
    id,
    collection: collection.config.slug,
    depth: 0,
    disableErrors: true,
    overrideAccess: false,
    req,
  })

  if (!userWithReadAccess) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  // Reveal is treated as a no-op update, so `data` reflects the current document.
  const updateAccess = await executeAccess(
    { id, data: userWithReadAccess, disableErrors: true, req },
    collection.config.access.update,
  )

  if (!updateAccess) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const user = await req.payload.db.findOne({
    collection: collection.config.slug,
    req,
    select: {
      apiKey: true,
    },
    where: combineQueries({ id: { equals: id } }, updateAccess),
  })

  if (!user) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const apiKeyField = collection.config.fields.find(
    (field) => fieldAffectsData(field) && field.name === 'apiKey',
  )

  if (!apiKeyField || !fieldAffectsData(apiKeyField) || !apiKeyField.access?.update) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const canUpdateAPIKey = await apiKeyField.access.update({
    id,
    data: {},
    doc: userWithReadAccess,
    req,
    siblingData: {},
  })

  if (!canUpdateAPIKey) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!('apiKey' in user) || typeof user.apiKey !== 'string') {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json(
    { apiKey: req.payload.decrypt(user.apiKey) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
