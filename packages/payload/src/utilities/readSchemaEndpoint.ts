import type { Endpoint } from '../config/types.js'

import { Forbidden } from '../errors/Forbidden.js'
import { entityToStandaloneJSONSchema } from './configToJSONSchema.js'
import { filterFieldsByAccess } from './entityInputSchema/filterFieldsByAccess.js'
import { getEntityPermissions } from './getEntityPermissions/getEntityPermissions.js'
import { getRequestCollection, getRequestGlobal } from './getRequestEntity.js'
import { sanitizePermissions } from './sanitizePermissions.js'

export const readSchemaEndpoint: Endpoint = {
  handler: async (req) => {
    const { config, db } = req.payload
    const isGlobal = typeof req.routeParams?.global === 'string'
    const entity = isGlobal ? getRequestGlobal(req) : getRequestCollection(req).config
    const permissions = await getEntityPermissions({
      blockReferencesPermissions: {},
      entity,
      entityType: isGlobal ? 'global' : 'collection',
      fetchData: false,
      operations: ['read'],
      req,
    })

    if (permissions.read?.permission !== true) {
      throw new Forbidden(req.t)
    }

    const key = isGlobal ? 'globals' : 'collections'
    const sanitized = sanitizePermissions({ [key]: { [entity.slug]: permissions } })[key]?.[
      entity.slug
    ]
    const readableFields = filterFieldsByAccess({
      blocks: config.blocks,
      fields: entity.flattenedFields,
      // The raw read result above also covers conditional collection access.
      permissions: { fields: sanitized?.fields ?? {}, read: true },
      shouldExcludeField: ({ read }, field) =>
        !read || ('hidden' in field && field.hidden === true),
    })

    const schema = entityToStandaloneJSONSchema({
      config,
      defaultIDType: db.defaultIDType,
      entity: { ...entity, flattenedFields: readableFields },
      i18n: req.i18n,
      isAccessDiscovery: true,
      variant: 'output',
    })

    return Response.json(
      { slug: entity.slug, schema },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  },
  method: 'get',
  path: '/schema',
}
