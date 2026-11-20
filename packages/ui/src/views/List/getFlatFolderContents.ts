import type {
  ListViewClientProps,
  PayloadRequest,
  SanitizedCollectionConfig,
  ServerFunction,
  Where,
} from 'payload'

import { canAccessAdmin, combineWhereConstraints } from 'payload/shared'

import { getDocumentThumbnail } from '../../utilities/getDocumentThumbnail.js'
import { getDocumentThumbnailSelect } from '../../utilities/getDocumentThumbnailSelect.js'

export const FLAT_FOLDER_PAGE_SIZE = 10

export type FlatFolderContents = NonNullable<ListViewClientProps['flatFolderContents']>
export type FlatFolderPage = FlatFolderContents['documents']
export type FlatFolderDocument = FlatFolderPage['docs'][number]

export type FlatFolderContentsArgs = {
  collectionSlug: string
  page?: number
  parentID: number | string
  search?: string
  source?: 'documents' | 'folders'
  typeFilter?: string[]
}

export function canUseFlatFolderContents({
  collectionConfig,
  req,
}: {
  collectionConfig: SanitizedCollectionConfig
  req: PayloadRequest
}): boolean {
  const hierarchy = collectionConfig.hierarchy
  if (!hierarchy || typeof hierarchy !== 'object' || hierarchy.allowHasMany !== false) {
    return false
  }
  if ('useJoinAggregations' in req.payload.db && req.payload.db.useJoinAggregations === false) {
    return false
  }

  const joinName = hierarchy.joinField?.name
  const join = collectionConfig.polymorphicJoins.find(({ joinPath }) => joinPath === joinName)
  const folderTitle = collectionConfig.flattenedFields.find(
    (field) => 'name' in field && field.name === collectionConfig.admin.useAsTitle,
  )
  const related = Object.entries(hierarchy.relatedCollections).filter(
    ([slug]) => slug !== collectionConfig.slug,
  )

  if (
    !join ||
    !related.length ||
    collectionConfig.trash ||
    collectionConfig.versions?.drafts ||
    !folderTitle ||
    folderTitle.type !== 'text' ||
    folderTitle.localized ||
    folderTitle.access?.read ||
    join.field.on !== hierarchy.parentFieldName ||
    join.field.access?.read ||
    join.field.where ||
    join.field.localized ||
    !Array.isArray(join.field.collection) ||
    join.field.collection.length !== related.length + 1 ||
    ![collectionConfig.slug, ...related.map(([slug]) => slug)].every((slug) =>
      join.field.collection.includes(slug),
    )
  ) {
    return false
  }

  const collectionSpecific = hierarchy.collectionSpecific
  if (collectionSpecific) {
    const typeField = collectionConfig.flattenedFields.find(
      (field) => 'name' in field && field.name === collectionSpecific.fieldName,
    )

    if (!typeField || typeField.access?.read) {
      return false
    }
  }

  // Mongo polymorphic joins cast the combined query with the first field of each name.
  // Conflicting target definitions can make joined counts differ from readable rows.
  const fieldDefinitions = new Map<string, string>()
  const customIDTypes = new Set<string>()
  for (const slug of join.field.collection) {
    const collection = req.payload.collections[slug]
    if (!collection) {
      return false
    }
    customIDTypes.add(collection.customIDType ?? 'objectID')

    for (const field of collection.config.flattenedFields) {
      const definition = JSON.stringify({
        type: field.type,
        date: field.type === 'date' ? field.admin?.date : undefined,
        hasMany: 'hasMany' in field ? Boolean(field.hasMany) : false,
        localized: Boolean(field.localized),
        relationTo: 'relationTo' in field ? field.relationTo : undefined,
      })

      const existing = fieldDefinitions.get(field.name)
      if (
        existing !== undefined &&
        (existing !== definition ||
          !['checkbox', 'date', 'number', 'relationship', 'text', 'upload'].includes(field.type))
      ) {
        return false
      }
      fieldDefinitions.set(field.name, definition)
    }
  }
  if (
    customIDTypes.size > 1 ||
    ('useJoinAggregations' in req.payload.db && customIDTypes.has('text'))
  ) {
    return false
  }

  return related.every(([slug, { fieldName, hasMany }]) => {
    const config = req.payload.collections[slug]?.config
    const membership = config?.flattenedFields.find(
      (field) => 'name' in field && field.name === fieldName,
    )
    const title = config?.flattenedFields.find(
      (field) => 'name' in field && field.name === config.admin.useAsTitle,
    )

    return Boolean(
      config &&
      !hasMany &&
      !config.trash &&
      !config.versions?.drafts &&
      !config.admin.formatDocURL &&
      membership &&
      membership.type === 'relationship' &&
      membership.relationTo === collectionConfig.slug &&
      membership.hasMany === false &&
      !membership.localized &&
      !membership.access?.read &&
      title &&
      title.type === 'text' &&
      !title.localized &&
      !title.access?.read,
    )
  })
}

export async function getFlatFolderContents({
  args,
  req,
}: {
  args: FlatFolderContentsArgs
  req: PayloadRequest
}): Promise<FlatFolderContents> {
  const { collectionSlug, page = 1, parentID, search, source, typeFilter } = args
  const collectionConfig = req.payload.collections[collectionSlug]?.config

  await canAccessAdmin({ req })

  if (
    !req.user ||
    !collectionConfig ||
    !canUseFlatFolderContents({ collectionConfig, req }) ||
    !Number.isInteger(page) ||
    page < 1 ||
    page > 10000 ||
    (typeof parentID !== 'string' && typeof parentID !== 'number') ||
    (typeof parentID === 'string' && (parentID.length === 0 || parentID.length > 200)) ||
    (typeof parentID === 'number' && !Number.isFinite(parentID)) ||
    (search !== undefined && (typeof search !== 'string' || search.length > 200)) ||
    (source !== undefined && source !== 'folders' && source !== 'documents') ||
    (typeFilter !== undefined &&
      (!Array.isArray(typeFilter) || typeFilter.some((slug) => typeof slug !== 'string')))
  ) {
    throw new Error('Invalid folder contents request')
  }

  const hierarchy = collectionConfig.hierarchy as Exclude<
    typeof collectionConfig.hierarchy,
    boolean
  >
  await req.payload.findByID({
    id: parentID,
    collection: collectionSlug,
    depth: 0,
    joins: false,
    overrideAccess: false,
    req,
    user: req.user,
  })

  const empty: FlatFolderPage = { docs: [], hasNextPage: false, page, totalDocs: 0 }
  const result: FlatFolderContents = { documents: empty, folders: empty }

  if (!source || source === 'folders') {
    const titleField = collectionConfig.admin.useAsTitle || 'id'
    const baseFilter = await (
      collectionConfig.admin.baseFilter ?? collectionConfig.admin.baseListFilter
    )?.({ limit: FLAT_FOLDER_PAGE_SIZE, page: 1, req, sort: titleField })
    const folders = await req.payload.find({
      collection: collectionSlug,
      depth: 0,
      draft: true,
      fallbackLocale: false,
      includeLockStatus: true,
      joins: false,
      limit: FLAT_FOLDER_PAGE_SIZE,
      locale: req.locale,
      overrideAccess: false,
      page,
      req,
      sort: [titleField, 'id'],
      user: req.user,
      where: combineWhereConstraints([
        { [hierarchy.parentFieldName]: { equals: parentID } },
        baseFilter,
        search ? { [titleField]: { like: search } } : undefined,
      ]),
    })

    result.folders = {
      docs: folders.docs.map((doc) => ({ ...doc, _collectionSlug: collectionSlug })),
      hasNextPage: folders.hasNextPage,
      page,
      totalDocs: folders.totalDocs,
    }
  }

  if (!source || source === 'documents') {
    const related = Object.entries(hierarchy.relatedCollections).filter(
      ([slug]) => slug !== collectionSlug && (!typeFilter || typeFilter.includes(slug)),
    )

    if (related.length) {
      const where: Where = {
        or: await Promise.all(
          related.map(async ([slug]) => {
            const config = req.payload.collections[slug].config
            const titleField = config.admin.useAsTitle || 'id'
            const baseFilter = await (config.admin.baseFilter ?? config.admin.baseListFilter)?.({
              limit: FLAT_FOLDER_PAGE_SIZE,
              page: 1,
              req,
              sort: '-updatedAt',
            })

            return combineWhereConstraints([
              { relationTo: { equals: slug } },
              baseFilter,
              search ? { [titleField]: { like: search } } : undefined,
            ])
          }),
        ),
      }
      const joinName = hierarchy.joinField!.name
      const folder = await req.payload.findByID({
        id: parentID,
        collection: collectionSlug,
        depth: 0,
        draft: false,
        joins: {
          [joinName]: {
            count: true,
            limit: FLAT_FOLDER_PAGE_SIZE,
            page,
            sort: '-updatedAt',
            where,
          },
        },
        locale: req.locale,
        overrideAccess: false,
        req,
        user: req.user,
      })
      const joined = folder?.[joinName] as
        | {
            docs: { relationTo: string; value: number | string }[]
            hasNextPage: boolean
            totalDocs: number
          }
        | undefined

      if (joined) {
        const documents = new Map<string, FlatFolderDocument>()

        await Promise.all(
          related.map(async ([slug]) => {
            const ids = joined.docs
              .filter(({ relationTo }) => relationTo === slug)
              .map(({ value }) => value)

            if (!ids.length) {
              return
            }

            const config = req.payload.collections[slug].config
            const titleField = config.admin.useAsTitle || 'id'
            const membershipField = hierarchy.relatedCollections[slug].fieldName
            const baseFilter = await (config.admin.baseFilter ?? config.admin.baseListFilter)?.({
              limit: FLAT_FOLDER_PAGE_SIZE,
              page: 1,
              req,
              sort: '-updatedAt',
            })
            const { docs } = await req.payload.find({
              collection: slug,
              depth: 0,
              draft: false,
              fallbackLocale: false,
              includeLockStatus: true,
              joins: false,
              locale: req.locale,
              overrideAccess: false,
              pagination: false,
              req,
              select: getDocumentThumbnailSelect({
                collectionConfig: config,
                select: { id: true, [titleField]: true, updatedAt: true },
              }),
              user: req.user,
              where: combineWhereConstraints([
                { id: { in: ids } },
                { [membershipField]: { in: [parentID] } },
                baseFilter,
                search ? { [titleField]: { like: search } } : undefined,
              ]),
            })

            for (const doc of docs) {
              documents.set(JSON.stringify([slug, doc.id]), {
                id: doc.id,
                _collectionSlug: slug,
                _isLocked: doc._isLocked,
                _thumbnailSrc: config.upload ? getDocumentThumbnail({ doc }) : undefined,
                _userEditing: doc._userEditing,
                [titleField]: doc[titleField],
                updatedAt: doc.updatedAt,
              })
            }
          }),
        )

        if (documents.size !== joined.docs.length) {
          throw new Error('Folder contents changed while loading')
        }

        result.documents = {
          docs: joined.docs.flatMap(({ relationTo, value }) => {
            const doc = documents.get(JSON.stringify([relationTo, value]))
            return doc ? [doc] : []
          }),
          hasNextPage: joined.hasNextPage,
          page,
          totalDocs: joined.totalDocs,
        }
      }
    }
  }

  return result
}

export const getFlatFolderContentsHandler: ServerFunction<
  FlatFolderContentsArgs,
  Promise<FlatFolderContents>
> = async ({ req, ...args }) => getFlatFolderContents({ args, req })
