import type { CollectionPermission } from '../../auth/index.js'
import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { FlattenedField } from '../../fields/config/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { PayloadRequest, WhereField } from '../../types/index.js'
import type { EntityPolicies, PathToQuery } from './types.js'

import { fieldAffectsData } from '../../fields/config/types.js'
import { SAFE_FIELD_PATH_REGEX } from '../../types/constants.js'
import { getEntityPermissions } from '../../utilities/getEntityPermissions/getEntityPermissions.js'
import { isolateObjectProperty } from '../../utilities/isolateObjectProperty.js'
import { getLocalizedPaths } from '../getLocalizedPaths.js'
import { isNestedRelationshipQuery } from '../isNestedRelationshipQuery.js'
import { prefixWherePaths } from '../prefixWherePaths.js'
import { hasReadAccessToQueryPath } from './hasReadAccessToQueryPath.js'
import { pruneFieldsForQueryPath } from './pruneFieldsForQueryPath.js'
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
  showHiddenFields?: boolean
  val: unknown
  versionFields?: FlattenedField[]
}

/**
 * Read permissions per `collectionSlug:path`, built from only the fields on that path.
 * Keyed by the policies object, which lives for one `validateQueryPaths` call.
 */
const queryPathPermissionsByPolicies = new WeakMap<
  EntityPolicies,
  Map<string, Promise<CollectionPermission>>
>()

const getQueryPathPermissions = ({
  collectionSlug,
  policies,
  queryPath,
  req,
}: {
  collectionSlug: string
  policies: EntityPolicies
  queryPath: string
  req: PayloadRequest
}): Promise<CollectionPermission> => {
  let queryPathPermissions = queryPathPermissionsByPolicies.get(policies)

  if (!queryPathPermissions) {
    queryPathPermissions = new Map()
    queryPathPermissionsByPolicies.set(policies, queryPathPermissions)
  }

  const key = `${collectionSlug}:${queryPath}`
  let permissions = queryPathPermissions.get(key)

  if (!permissions) {
    const collectionConfig = req.payload.collections[collectionSlug]!.config

    permissions = getEntityPermissions({
      blockReferencesPermissions: {},
      entity: {
        ...collectionConfig,
        fields: pruneFieldsForQueryPath({
          fields: collectionConfig.fields,
          names: new Set(queryPath.split('.')),
          req,
        }),
      },
      entityType: 'collection',
      fetchData: false,
      operations: ['read'],
      req: isolateObjectProperty(req, 'transactionID'),
    })
    queryPathPermissions.set(key, permissions)
  }

  return permissions
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
  showHiddenFields,
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
      parentIsLocalized,
      payload: req.payload,
      showHiddenFields,
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
  // 3.x supports only the `contains` operator for nested relationship queries.
  const isNestedHasManyQuery =
    operator === 'contains' && hasNestedWhere && Boolean(relatedCollectionSlug)

  const isJoinContainsQuery =
    operator === 'contains' &&
    relationshipField?.type === 'join' &&
    typeof relationshipField.collection === 'string' &&
    hasNestedWhere

  const nestedCollectionSlug = isNestedHasManyQuery
    ? relatedCollectionSlug
    : isJoinContainsQuery &&
        relationshipField?.type === 'join' &&
        typeof relationshipField.collection === 'string'
      ? relationshipField.collection
      : undefined

  // Plain-object values would be merged as raw query fragments.
  if (operator === 'like' || operator === 'not_like' || operator === 'contains') {
    const isValidNestedContains =
      operator === 'contains' && (isNestedHasManyQuery || isJoinContainsQuery)

    const containsPlainObject =
      isNestedRelationshipQuery(val) ||
      (Array.isArray(val) && val.some((entry) => isNestedRelationshipQuery(entry)))

    if (containsPlainObject && !isValidNestedContains) {
      errors.push({ path: incomingPath })
      return
    }
  }

  if ((isNestedHasManyQuery || isJoinContainsQuery) && nestedCollectionSlug) {
    // Validate the nested query against the related collection.
    promises.push(
      validateQueryPaths({
        collectionConfig: req.payload.collections[nestedCollectionSlug]!.config,
        errors,
        overrideAccess,
        policies,
        req,
        showHiddenFields,
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
        const isUnknownPolymorphicJoinField =
          polymorphicJoin && !field && SAFE_FIELD_PATH_REGEX.test(incomingPath)

        if (!isUnknownPolymorphicJoinField) {
          errors.push({ path })
        }

        return
      }

      // where: { relatedPosts: { equals: 1}} -> { 'relatedPosts.id': { equals: 1}}
      if (field.type === 'join' && path === incomingPath) {
        constraint[`${path}.id` as keyof WhereField] = constraint[path as keyof WhereField]
        delete constraint[path as keyof WhereField]
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
        let collectionPermissions: CollectionPermission | undefined

        if (collectionSlug) {
          const queryPath =
            versionFields && !i ? path.replace(/^(?:parent|version|snapshot|latest)\./, '') : path

          collectionPermissions = await getQueryPathPermissions({
            collectionSlug,
            policies,
            queryPath,
            req,
          })

          if (
            ['hash', 'salt'].includes(incomingPath) &&
            collectionConfig!.auth &&
            !collectionConfig!.auth?.disableLocalStrategy
          ) {
            errors.push({ path: incomingPath })
          }

          const relatedCollectionReadPermission = collectionPermissions.read
          const previousSegment = paths[i - 1]
          const traversedField = previousSegment?.field
          const isRelationshipHop =
            Boolean(traversedField) &&
            (traversedField!.type === 'relationship' ||
              traversedField!.type === 'upload' ||
              traversedField!.type === 'join')

          if (
            isRelationshipHop &&
            relatedCollectionReadPermission &&
            typeof relatedCollectionReadPermission === 'object' &&
            relatedCollectionReadPermission.where
          ) {
            const relationshipPath = paths
              .slice(0, i)
              .map(({ path: pathToRelationship }) => pathToRelationship)
              .join('.')

            const mutableWhere = constraint as Record<string, unknown>
            const existingAnd = Array.isArray(mutableWhere.and) ? mutableWhere.and : []

            // Has-many relationships and joins can point to many related documents, so the user's
            // filter and the access constraint must be satisfied by the SAME related document.
            // Scoping both into a single `contains` prevents a different, readable document from
            // masking one the user cannot read (a related-document oracle).
            const isHasManyRelationship =
              (traversedField!.type === 'relationship' || traversedField!.type === 'upload') &&
              traversedField!.hasMany
            const isJoin = traversedField!.type === 'join'

            if (isHasManyRelationship || isJoin) {
              const relatedFieldPath = paths.at(-1)?.path

              if (relatedFieldPath) {
                mutableWhere.and = [
                  ...existingAnd,
                  {
                    [relationshipPath]: {
                      contains: {
                        and: [
                          {
                            [relatedFieldPath]: {
                              [operator]: val,
                            },
                          },
                          relatedCollectionReadPermission.where,
                        ],
                      },
                    },
                  },
                ]

                // The scoped `contains` above fully replaces the user's original filter;
                // so we can remove it from the top-level where clause
                delete mutableWhere[incomingPath]
              }
            } else {
              const accessWhere = prefixWherePaths({
                prefix: relationshipPath,
                where: relatedCollectionReadPermission.where,
              })

              mutableWhere.and = [...existingAnd, accessWhere]
            }
          }
        }
        const entityType = collectionSlug ? 'collections' : 'globals'
        const entitySlug = collectionSlug || globalConfig!.slug
        const entity = collectionSlug
          ? req.payload.collections[collectionSlug]!.config
          : globalConfig!
        let fieldPath = path

        if (
          versionFields &&
          !i &&
          ['latest', 'parent', 'snapshot', 'version'].includes(fieldPath)
        ) {
          return
        }

        if (versionFields && !i) {
          fieldPath = fieldPath.replace(/^(?:parent|version|snapshot|latest)\./, '')
        }

        if (
          !hasReadAccessToQueryPath({
            fields: entity.flattenedFields,
            isParentLocalized: parentIsLocalized,
            isRelatedToMany:
              field.type === 'join' ||
              ((field.type === 'relationship' || field.type === 'upload') &&
                Boolean(field.hasMany)),
            path: fieldPath.split('.'),
            permissions: collectionPermissions
              ? collectionPermissions.fields
              : policies[entityType]![entitySlug]!.fields,
            relatedCollectionSlug: paths[i + 1]?.collectionSlug || nestedCollectionSlug,
            req,
            shouldShowHiddenFields: showHiddenFields,
          })
        ) {
          errors.push({ path: fieldPath })
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
                  showHiddenFields,
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
