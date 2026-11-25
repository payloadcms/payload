import type { HierarchyViewData, PayloadRequest, SanitizedCollectionConfig, Where } from 'payload'

import { executeAccess } from 'payload'
import { HIERARCHY_CONTENTS_FIELD } from 'payload/internal'
import { combineWhereConstraints, DEFAULT_HIERARCHY_LIST_LIMIT } from 'payload/shared'

import { getDocumentThumbnail } from '../../utilities/getDocumentThumbnail.js'
import { getDocumentThumbnailPopulate } from '../../utilities/getDocumentThumbnailPopulate.js'
import { getDocumentThumbnailSelect } from '../../utilities/getDocumentThumbnailSelect.js'

type JoinedDocuments = NonNullable<HierarchyViewData['joinedDocuments']>
type JoinedDocument = JoinedDocuments['docs'][number]

export type JoinedHierarchyDocumentsArgs = {
  collectionSlug: string
  page?: number
  parentID: number | string
  search?: string
  typeFilter?: string[]
}

export async function getJoinedHierarchyDocuments({
  collectionSlug,
  page = 1,
  parentID,
  req,
  search,
  typeFilter,
}: { req: PayloadRequest } & JoinedHierarchyDocumentsArgs): Promise<JoinedDocuments | undefined> {
  const { payload, user } = req
  const collectionConfig = payload.collections[collectionSlug]?.config
  const hierarchy = collectionConfig?.hierarchy

  if (!user || !hierarchy || typeof hierarchy !== 'object') {
    return undefined
  }

  const join = collectionConfig.polymorphicJoins.find(
    ({ joinPath }) => joinPath === HIERARCHY_CONTENTS_FIELD,
  )
  const allRelated = Object.entries(hierarchy.relatedCollections)
  const isMongo = payload.db.name === 'mongoose'
  const disablesJoinAggregations =
    'useJoinAggregations' in payload.db && payload.db.useJoinAggregations === false

  if (
    !join ||
    !allRelated.length ||
    collectionConfig.trash ||
    collectionConfig.versions?.drafts ||
    !Array.isArray(join.field.collection) ||
    disablesJoinAggregations
  ) {
    return undefined
  }

  const fieldName = hierarchy.parentFieldName
  const targets = join.field.collection.map((slug) => payload.collections[slug])
  const idTypes = new Set(targets.map((target) => target?.customIDType))

  if (idTypes.size > 1 || (isMongo && idTypes.has('text'))) {
    return undefined
  }

  if (
    !allRelated.every(([slug, membership]) => {
      const config = payload.collections[slug]?.config
      const membershipField = config?.flattenedFields.find((field) => field.name === fieldName)
      const titleField = config?.flattenedFields.find(
        (field) => field.name === config.admin.useAsTitle,
      )

      return (
        config &&
        !config.trash &&
        !config.versions?.drafts &&
        !config.admin.formatDocURL &&
        membership.fieldName === fieldName &&
        membershipField?.type === 'relationship' &&
        membershipField.relationTo === collectionSlug &&
        Boolean(membershipField.hasMany) === membership.hasMany &&
        !membershipField.localized &&
        !membershipField.access?.read &&
        titleField?.type === 'text' &&
        !titleField.localized &&
        !titleField.access?.read
      )
    })
  ) {
    return undefined
  }

  if (
    isMongo &&
    !hasCompatibleMongoFields({ configs: targets.map(({ config }) => config), fieldName })
  ) {
    return undefined
  }

  const related = allRelated.filter(([slug]) => !typeFilter || typeFilter.includes(slug))
  if (!related.length) {
    return { docs: [], hasNextPage: false, page, totalDocs: 0 }
  }

  const limit = DEFAULT_HIERARCHY_LIST_LIMIT
  const filters = await Promise.all(
    related.map(async ([slug]) => {
      const config = payload.collections[slug].config
      const titleField = config.admin.useAsTitle || 'id'
      const baseFilter = await (config.admin.baseFilter ?? config.admin.baseListFilter)?.({
        limit,
        page: 1,
        req,
        sort: '-updatedAt',
      })

      return {
        slug,
        config,
        titleField,
        where: combineWhereConstraints([
          baseFilter,
          search ? { [titleField]: { like: search } } : undefined,
        ]),
      }
    }),
  )

  // The Mongo aggregate resolves a field against one schema for all targets. The
  // generated back-reference can differ in cardinality between those targets.
  if (isMongo) {
    for (const { slug, config, where } of filters) {
      const access = await executeAccess({ slug, disableErrors: true, req }, config.access.read)
      if (
        usesMembershipField(where, fieldName) ||
        (typeof access === 'object' && usesMembershipField(access, fieldName))
      ) {
        return undefined
      }
    }
  }

  const joinName = join.joinPath
  const parent = await payload.findByID({
    id: parentID,
    collection: collectionSlug,
    depth: 0,
    draft: false,
    joins: {
      [joinName]: {
        count: true,
        limit,
        page,
        sort: '-updatedAt',
        where: {
          or: filters.map(({ slug, where }) =>
            combineWhereConstraints([{ relationTo: { equals: slug } }, where]),
          ),
        },
      },
    },
    locale: req.locale,
    overrideAccess: false,
    req,
    select: { [joinName]: true },
    user,
  })
  const joined = parent[joinName] as
    | {
        docs: { relationTo: string; value: number | string }[]
        hasNextPage?: boolean
        totalDocs: number
      }
    | undefined

  if (!joined || !Array.isArray(joined.docs) || typeof joined.totalDocs !== 'number') {
    return undefined
  }

  const documents = new Map<string, JoinedDocument>()

  await Promise.all(
    filters.map(async ({ slug, config, titleField, where }) => {
      const ids = joined.docs.filter((doc) => doc.relationTo === slug).map((doc) => doc.value)
      if (!ids.length) {
        return
      }

      const thumbnailField = config.admin.useAsThumbnail
      const { docs } = await payload.find({
        collection: slug,
        depth: thumbnailField ? 1 : 0,
        draft: false,
        fallbackLocale: false,
        includeLockStatus: true,
        joins: false,
        locale: req.locale,
        overrideAccess: false,
        pagination: false,
        populate: thumbnailField
          ? getDocumentThumbnailPopulate({
              collectionConfig: config,
              collections: payload.config.collections,
            })
          : undefined,
        req,
        select: getDocumentThumbnailSelect({
          collectionConfig: config,
          select: {
            id: true,
            ...(thumbnailField ? { [thumbnailField]: true } : {}),
            [titleField]: true,
            updatedAt: true,
          },
        }),
        user,
        where: combineWhereConstraints([
          { id: { in: ids } },
          { [fieldName]: { in: [parentID] } },
          where,
        ]),
      })

      for (const doc of docs) {
        documents.set(JSON.stringify([slug, doc.id]), {
          id: doc.id,
          _collectionSlug: slug,
          _isLocked: doc._isLocked,
          _userEditing: doc._userEditing,
          mimeType: doc.mimeType,
          thumbnailURL: getDocumentThumbnail({ doc, useAsThumbnail: thumbnailField }),
          [titleField]: doc[titleField],
          updatedAt: doc.updatedAt,
        })
      }
    }),
  )

  const docs = joined.docs.flatMap(({ relationTo, value }) => {
    const doc = documents.get(JSON.stringify([relationTo, value]))
    return doc ? [doc] : []
  })

  if (docs.length !== joined.docs.length) {
    return undefined
  }

  return { docs, hasNextPage: Boolean(joined.hasNextPage), page, totalDocs: joined.totalDocs }
}

function hasCompatibleMongoFields({
  configs,
  fieldName,
}: {
  configs: SanitizedCollectionConfig[]
  fieldName: string
}): boolean {
  const definitions = new Map<string, string>()

  for (const config of configs) {
    for (const field of config.flattenedFields) {
      if (field.name === fieldName) {
        continue
      }

      const definition = JSON.stringify({
        type: field.type,
        date: field.type === 'date' ? field.admin?.date : undefined,
        hasMany: 'hasMany' in field ? Boolean(field.hasMany) : false,
        localized: Boolean(field.localized),
        relationTo: 'relationTo' in field ? field.relationTo : undefined,
      })

      if (
        definitions.has(field.name) &&
        (definitions.get(field.name) !== definition ||
          !['checkbox', 'date', 'number', 'relationship', 'text', 'textarea', 'upload'].includes(
            field.type,
          ))
      ) {
        return false
      }
      definitions.set(field.name, definition)
    }
  }
  return true
}

function usesMembershipField(where: Where, fieldName: string): boolean {
  return Object.entries(where).some(([key, value]) =>
    Array.isArray(value)
      ? value.some((condition) => usesMembershipField(condition, fieldName))
      : key === fieldName || key.startsWith(`${fieldName}.`),
  )
}
