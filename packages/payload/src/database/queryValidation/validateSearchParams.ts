import type { SanitizedCollectionConfig } from '../../collections/config/types'
import type { PayloadRequest } from '../../express/types'
import type { Field } from '../../fields/config/types'
import type { SanitizedGlobalConfig } from '../../globals/config/types'
import type { EntityPolicies, PathToQuery } from './types'

import { fieldAffectsData } from '../../fields/config/types'
import { getEntityPolicies } from '../../utilities/getEntityPolicies'
import { getLocalizedPaths } from '../getLocalizedPaths'
import { validateQueryPaths } from './validateQueryPaths'

type Args = {
  collectionConfig?: SanitizedCollectionConfig
  errors: { path: string }[]
  fields: Field[]
  globalConfig?: SanitizedGlobalConfig
  operator: string
  overrideAccess: boolean
  path: string
  policies: EntityPolicies
  req: PayloadRequest
  val: unknown
  versionFields?: Field[]
}

/**
 * Validate the Payload key / value / operator
 */
export async function validateSearchParam({
  collectionConfig,
  errors,
  fields,
  globalConfig,
  operator,
  overrideAccess,
  path: incomingPath,
  policies,
  req,
  val,
  versionFields,
}: Args): Promise<void> {
  // Replace GraphQL nested field double underscore formatting
  let sanitizedPath
  if (incomingPath === '_id') {
    sanitizedPath = 'id'
  } else {
    sanitizedPath = incomingPath.replace(/__/g, '.')
  }
  let paths: PathToQuery[] = []
  const { slug } = collectionConfig || globalConfig

  if (globalConfig && !policies.globals[slug]) {
    // eslint-disable-next-line no-param-reassign
    globalConfig.fields = fields

    // eslint-disable-next-line no-param-reassign
    policies.globals[slug] = await getEntityPolicies({
      entity: globalConfig,
      operations: ['read'],
      req,
      type: 'global',
    })
  }

  if (sanitizedPath !== 'id') {
    paths = await getLocalizedPaths({
      collectionSlug: collectionConfig?.slug,
      fields,
      globalSlug: globalConfig?.slug,
      incomingPath: sanitizedPath,
      locale: req.locale,
      overrideAccess,
      payload: req.payload,
    })
  }
  const promises = []
  promises.push(
    ...paths.map(async ({ collectionSlug, field, invalid, path }, i) => {
      if (invalid) {
        errors.push({ path })
        return
      }

      if (!overrideAccess && fieldAffectsData(field)) {
        if (collectionSlug) {
          if (!policies.collections[collectionSlug]) {
            // eslint-disable-next-line no-param-reassign
            policies.collections[collectionSlug] = await getEntityPolicies({
              entity: req.payload.collections[collectionSlug].config,
              operations: ['read'],
              req,
              type: 'collection',
            })
          }

          if (
            ['hash', 'salt'].includes(incomingPath) &&
            collectionConfig.auth &&
            !collectionConfig.auth?.disableLocalStrategy
          ) {
            errors.push({ path: incomingPath })
          }
        }
        let fieldPath = path
        // remove locale from end of path
        if (path.endsWith(`.${req.locale}`)) {
          fieldPath = path.slice(0, -(req.locale.length + 1))
        }
        // remove ".value" from ends of polymorphic relationship paths
        if (field.type === 'relationship' && Array.isArray(field.relationTo)) {
          fieldPath = fieldPath.replace('.value', '')
        }
        const entityType: 'collections' | 'globals' = globalConfig ? 'globals' : 'collections'
        const entitySlug = collectionSlug || globalConfig.slug
        const segments = fieldPath.split('.')

        let fieldAccess
        if (versionFields) {
          fieldAccess = policies[entityType][entitySlug]
          if (segments[0] === 'parent' || segments[0] === 'version') {
            segments.shift()
          }
        } else {
          fieldAccess = policies[entityType][entitySlug].fields
        }

        segments.forEach((segment) => {
          if (fieldAccess[segment]) {
            if ('fields' in fieldAccess[segment]) {
              fieldAccess = fieldAccess[segment].fields
            } else if ('blocks' in fieldAccess[segment]) {
              fieldAccess = fieldAccess[segment]
            } else {
              fieldAccess = fieldAccess[segment]
            }
          }
        })

        if (!fieldAccess?.read?.permission) {
          errors.push({ path: fieldPath })
        }
      }

      if (i > 1) {
        // Remove top collection and reverse array
        // to work backwards from top
        const pathsToQuery = paths.slice(1).reverse()

        pathsToQuery.forEach(
          ({ collectionSlug: pathCollectionSlug, path: subPath }, pathToQueryIndex) => {
            // On the "deepest" collection,
            // validate query of the relationship
            if (pathToQueryIndex === 0) {
              promises.push(
                validateQueryPaths({
                  collectionConfig: req.payload.collections[pathCollectionSlug].config,
                  errors,
                  globalConfig: undefined,
                  overrideAccess,
                  policies,
                  req,
                  where: {
                    [subPath]: {
                      [operator]: val,
                    },
                  },
                }),
              )
            }
          },
        )
      }
    }),
  )
  await Promise.all(promises)
}
