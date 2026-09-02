import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { FlattenedField } from '../../fields/config/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { HasManyRelationshipOperator, PayloadRequest, WhereField } from '../../types/index.js'
import type { EntityPolicies, PathToQuery } from './types.js'

import { fieldAffectsData } from '../../fields/config/types.js'
import { hasManyRelationshipOperatorSet, SAFE_FIELD_PATH_REGEX } from '../../types/constants.js'
import { getEntityPermissions } from '../../utilities/getEntityPermissions/getEntityPermissions.js'
import { isolateObjectProperty } from '../../utilities/isolateObjectProperty.js'
import { getLocalizedPaths } from '../getLocalizedPaths.js'
import { isNestedRelationshipQuery } from '../isNestedRelationshipQuery.js'
import { validateQueryPaths } from './validateQueryPaths.js'

type Args = {
  collectionConfig?: SanitizedCollectionConfig
  constraint: WhereField
  errors: { path: string }[]
  fields: FlattenedField[]
  globalConfig?: SanitizedGlobalConfig
  operator: string
  overrideAccess: boolean
  parentIsLocalized?: boolean
  path: string
  // TODO: Rename to permissions or entityPermissions in 4.0
  policies: EntityPolicies
  polymorphicJoin?: boolean
  req: PayloadRequest
  val: unknown
  versionFields?: FlattenedField[]
}

/**
 * Validate the Payload key / value / operator
 */
export async function validateSearchParam({
  collectionConfig,
  constraint,
  errors,
  fields,
  globalConfig,
  operator,
  overrideAccess,
  parentIsLocalized,
  path: incomingPath,
  policies,
  polymorphicJoin,
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
  const { slug } = (collectionConfig || globalConfig)!

  const blockReferencesPermissions = {}

  if (globalConfig && !policies.globals![slug]) {
    policies.globals![slug] = await getEntityPermissions({
      blockReferencesPermissions,
      entity: globalConfig,
      entityType: 'global',
      fetchData: false,
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
      locale: req.locale!,
      overrideAccess,
      parentIsLocalized: parentIsLocalized ?? false,
      payload: req.payload,
    })
  }
  const promises: Promise<void>[] = []

  const relationshipField = paths.length === 1 ? paths[0]?.field : undefined
  const hasNestedWhere = isNestedRelationshipQuery(val)
  const relatedCollectionSlug =
    relationshipField &&
    (relationshipField.type === 'relationship' || relationshipField.type === 'upload') &&
    relationshipField.hasMany &&
    typeof relationshipField.relationTo === 'string'
      ? relationshipField.relationTo
      : undefined
  const isNestedHasManyQuery =
    hasManyRelationshipOperatorSet.has(operator as HasManyRelationshipOperator) &&
    hasNestedWhere &&
    Boolean(relatedCollectionSlug)

  if (isNestedHasManyQuery && relatedCollectionSlug) {
    // Validate the nested query against the related collection.
    promises.push(
      validateQueryPaths({
        collectionConfig: req.payload.collections[relatedCollectionSlug]!.config,
        errors,
        overrideAccess,
        policies,
        req,
        where: val,
      }),
    )
  }

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
        if (!polymorphicJoin || !SAFE_FIELD_PATH_REGEX.test(incomingPath)) {
          errors.push({ path })
        }

        return
      }

      // where: { relatedPosts: { equals: 1}} -> { 'relatedPosts.id': { equals: 1}}
      if (field.type === 'join' && path === incomingPath) {
        const mutableConstraint = constraint as Record<string, unknown>

        mutableConstraint[`${path}.id`] = mutableConstraint[path]
        delete mutableConstraint[path]
      }

      if ('virtual' in field && field.virtual) {
        if (field.virtual === true) {
          errors.push({ path })
        }
      }

      if (polymorphicJoin && path === 'relationTo') {
        return
      }

      if (!overrideAccess && fieldAffectsData(field)) {
        if (collectionSlug) {
          if (!policies.collections![collectionSlug]) {
            policies.collections![collectionSlug] = await getEntityPermissions({
              blockReferencesPermissions,
              entity: req.payload.collections[collectionSlug]!.config,
              entityType: 'collection',
              fetchData: false,
              operations: ['read'],
              req: isolateObjectProperty(req, 'transactionID'),
            })
          }

          if (
            ['hash', 'salt'].includes(incomingPath) &&
            collectionConfig!.auth &&
            !collectionConfig!.auth?.disableLocalStrategy
          ) {
            errors.push({ path: incomingPath })
          }
        }
        let fieldPath = path
        // remove locale from end of path
        if (path.endsWith(`.${req.locale}`)) {
          fieldPath = path.slice(0, -(req.locale!.length + 1))
        }
        // remove ".value" from ends of polymorphic relationship paths
        if (
          (field.type === 'relationship' || field.type === 'upload') &&
          Array.isArray(field.relationTo)
        ) {
          fieldPath = fieldPath.replace('.value', '')
        }

        const entityType: 'collections' | 'globals' = globalConfig ? 'globals' : 'collections'
        const entitySlug = collectionSlug || globalConfig!.slug
        const segments = fieldPath.split('.')

        let fieldAccess: any

        if (versionFields) {
          fieldAccess = policies[entityType]![entitySlug]!.fields

          if (
            segments[0] === 'parent' ||
            segments[0] === 'version' ||
            segments[0] === 'snapshot' ||
            segments[0] === 'latest'
          ) {
            segments.shift()
          }
        } else {
          fieldAccess = policies[entityType]![entitySlug]!.fields
        }

        if (segments.length) {
          segments.forEach((segment) => {
            if (fieldAccess[segment]) {
              if ('fields' in fieldAccess[segment]) {
                fieldAccess = fieldAccess[segment].fields
              } else {
                fieldAccess = fieldAccess[segment]
              }
            }
          })

          if (!fieldAccess?.read?.permission) {
            errors.push({ path: fieldPath })
          }
        }
      }

      if (!isNestedHasManyQuery && i > 1) {
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
                  collectionConfig: req.payload.collections[pathCollectionSlug!]!.config,
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
