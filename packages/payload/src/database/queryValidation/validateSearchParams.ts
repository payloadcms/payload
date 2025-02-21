// @ts-strict-ignore
import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { FlattenedField } from '../../fields/config/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { PayloadRequest } from '../../types/index.js'
import type { EntityPolicies, PathToQuery } from './types.js'

import { fieldAffectsData, fieldIsVirtual } from '../../fields/config/types.js'
import { getEntityPolicies } from '../../utilities/getEntityPolicies.js'
import isolateObjectProperty from '../../utilities/isolateObjectProperty.js'
import { getLocalizedPaths } from '../getLocalizedPaths.js'
import { validateQueryPaths } from './validateQueryPaths.js'

type Args = {
  collectionConfig?: SanitizedCollectionConfig
  errors: { path: string }[]
  fields: FlattenedField[]
  globalConfig?: SanitizedGlobalConfig
  operator: string
  overrideAccess: boolean
  parentIsLocalized?: boolean
  path: string
  policies: EntityPolicies
  req: PayloadRequest
  val: unknown
  versionFields?: FlattenedField[]
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
  parentIsLocalized,
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

  const blockPolicies = {}

  if (globalConfig && !policies.globals[slug]) {
    policies.globals[slug] = await getEntityPolicies({
      type: 'global',
      blockPolicies,
      entity: globalConfig,
      operations: ['read'],
      req,
    })
  }

  if (sanitizedPath !== 'id') {
    paths = getLocalizedPaths({
      collectionSlug: collectionConfig?.slug,
      fields,
      globalSlug: globalConfig?.slug,
      incomingPath: sanitizedPath,
      locale: req.locale,
      overrideAccess,
      parentIsLocalized,
      payload: req.payload,
    })
  }
  const promises = []

  // Sanitize relation.otherRelation.id to relation.otherRelation
  if (paths.at(-1)?.path === 'id') {
    const previousField = paths.at(-2)?.field
    if (
      previousField &&
      (previousField.type === 'relationship' || previousField.type === 'upload') &&
      typeof previousField.relationTo === 'string'
    ) {
      paths.pop()
    }
  }

  promises.push(
    ...paths.map(async ({ collectionSlug, field, invalid, path }, i) => {
      if (invalid) {
        errors.push({ path })
        return
      }

      if (fieldIsVirtual(field)) {
        errors.push({ path })
      }

      if (!overrideAccess && fieldAffectsData(field)) {
        if (collectionSlug) {
          if (!policies.collections[collectionSlug]) {
            policies.collections[collectionSlug] = await getEntityPolicies({
              type: 'collection',
              blockPolicies,
              entity: req.payload.collections[collectionSlug].config,
              operations: ['read'],
              req: isolateObjectProperty(req, 'transactionID'),
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
        if (
          (field.type === 'relationship' || field.type === 'upload') &&
          Array.isArray(field.relationTo)
        ) {
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
            } else if (
              'blocks' in fieldAccess[segment] ||
              'blockReferences' in fieldAccess[segment]
            ) {
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
