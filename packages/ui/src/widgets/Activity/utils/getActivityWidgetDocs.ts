import type { PayloadRequest, ServerFunction, Where } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { UnauthorizedError } from 'payload'
import { formatAdminURL, PREFERENCE_KEYS } from 'payload/shared'

import type { ActivityDocument } from '../types.js'
import type { DocumentReference } from './documents.js'

import { formatRelativeDate, getRelativeTimeFormat } from '../../../utilities/formatRelativeDate.js'
import { getDocumentThumbnail } from '../../../utilities/getDocumentThumbnail.js'
import { getDocumentThumbnailPopulate } from '../../../utilities/getDocumentThumbnailPopulate.js'
import { getDocumentThumbnailSelect } from '../../../utilities/getDocumentThumbnailSelect.js'
import { enrichDocsWithVersionStatus } from '../../../views/List/enrichDocsWithVersionStatus.js'
import { documentKey, getDocumentReferences, getValueByPath } from './documents.js'

export type ActivityDocumentType = 'pinned' | 'recents'
export type ActivityDocumentsArgs = {
  excludedCollections?: string[]
  limit: number
  page: number
  shouldIncludePinPlaceholder?: boolean
  type: ActivityDocumentType
}
export type ActivityDocumentsPage = {
  items: ActivityDocument[]
  page: number
  totalDocs: number
}

type Reference = { viewedAt?: string } & DocumentReference
type QueryDoc = { id: number | string; updatedAt?: string } & Record<string, unknown>

export const getActivityWidgetDocsHandler: ServerFunction<
  ActivityDocumentsArgs,
  Promise<ActivityDocumentsPage>
> = getActivityWidgetDocs

export async function getActivityWidgetDocs({
  type,
  excludedCollections = [],
  limit,
  page,
  req,
  shouldIncludePinPlaceholder = false,
}: { req: PayloadRequest } & ActivityDocumentsArgs): Promise<ActivityDocumentsPage> {
  if (!req.user) {
    throw new UnauthorizedError(req.t)
  }
  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !Number.isSafeInteger(page) ||
    page < 1
  ) {
    throw new Error('Invalid dashboard page')
  }
  if (type !== 'pinned' && type !== 'recents') {
    throw new Error('Invalid activity document type')
  }

  const key = type === 'pinned' ? PREFERENCE_KEYS.PINNED_DOCUMENTS : PREFERENCE_KEYS.RECENTLY_VIEWED
  const preference = await req.payload.find({
    collection: 'payload-preferences',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    req,
    user: req.user,
    where: { and: [ownerWhere({ req }), { key: { equals: key } }] },
  })
  const excluded = new Set(type === 'recents' ? excludedCollections : [])
  const storedReferences = getDocumentReferences({ value: preference.docs[0]?.value }).filter(
    ({ collectionSlug }) => {
      const collection = req.payload.collections[collectionSlug]

      return !excluded.has(collectionSlug) && collection && collection.config.admin.group !== false
    },
  )
  const availableReferences = await getAvailableReferences({ references: storedReferences, req })
  const totalDocs = availableReferences.length
  const lastPage = Math.max(
    1,
    Math.ceil((totalDocs + Number(type === 'pinned' && shouldIncludePinPlaceholder)) / limit),
  )

  page = Math.min(page, lastPage)
  const references = availableReferences.slice((page - 1) * limit, page * limit)

  const documents = await loadDocuments({ references, req })
  const items = references
    .map((reference): ActivityDocument | undefined => {
      const document = documents.get(documentKey(reference))
      if (!document || type !== 'recents') {
        return document
      }

      const viewedAt = reference.viewedAt

      return {
        ...document,
        dateLabel: viewedAt
          ? formatRelativeDate({
              relativeTimeFormat: getRelativeTimeFormat(req.i18n.language),
              value: viewedAt,
            })
          : undefined,
        dateTime: viewedAt,
        viewedAt,
      }
    })
    .filter((item): item is ActivityDocument => Boolean(item))

  return { items, page, totalDocs }
}

/** Check identities without populating documents, so deleted or forbidden references do not create empty pages. */
async function getAvailableReferences({
  references,
  req,
}: {
  references: Reference[]
  req: PayloadRequest
}): Promise<Reference[]> {
  const available = new Set<string>()

  await Promise.all(
    [...groupReferenceIDs({ references }).entries()].map(async ([collectionSlug, ids]) => {
      const result = await req.payload.find({
        collection: collectionSlug,
        depth: 0,
        disableErrors: true,
        draft: true,
        limit: ids.length,
        overrideAccess: false,
        pagination: false,
        req,
        select: { id: true },
        sort: 'id',
        user: req.user,
        where: { id: { in: ids } },
      })

      for (const doc of result.docs) {
        available.add(documentKey({ id: doc.id, collectionSlug }))
      }
    }),
  )

  return references.filter((reference) => available.has(documentKey(reference)))
}

function groupReferenceIDs({
  references,
}: {
  references: Reference[]
}): Map<string, Array<number | string>> {
  const idsByCollection = new Map<string, Array<number | string>>()

  for (const reference of references) {
    const ids = idsByCollection.get(reference.collectionSlug) ?? []

    ids.push(reference.id)
    idsByCollection.set(reference.collectionSlug, ids)
  }

  return idsByCollection
}

async function loadDocuments({
  references,
  req,
}: {
  references: Reference[]
  req: PayloadRequest
}): Promise<Map<string, ActivityDocument>> {
  const documents = new Map<string, ActivityDocument>()
  await Promise.all(
    [...groupReferenceIDs({ references }).entries()].map(async ([collectionSlug, ids]) => {
      const config = req.payload.collections[collectionSlug].config
      const select = getDocumentThumbnailSelect({
        collectionConfig: config,
        select: {
          id: true,
          [(config.admin.useAsTitle || 'id').split('.')[0]]: true,
          _status: true,
          updatedAt: true,
          ...(config.admin.useAsThumbnail ? { [config.admin.useAsThumbnail]: true } : {}),
          ...(config.upload ? { width: true } : {}),
        },
      })
      const result = await req.payload.find({
        collection: collectionSlug,
        depth: 1,
        disableErrors: true,
        draft: true,
        limit: ids.length,
        overrideAccess: false,
        populate: getDocumentThumbnailPopulate({
          collectionConfig: config,
          collections: req.payload.config.collections,
        }),
        req,
        select,
        sort: 'id',
        user: req.user,
        where: { id: { in: ids } },
      })
      const enriched = await enrichDocsWithVersionStatus({
        collectionConfig: config,
        data: result,
        req,
      })

      for (const doc of enriched.docs as QueryDoc[]) {
        const item = enrichDocument({ collectionSlug, doc, req })
        documents.set(documentKey(item), item)
      }
    }),
  )
  return documents
}

function ownerWhere({ req }: { req: PayloadRequest }): Where {
  return {
    and: [
      { 'user.relationTo': { equals: req.user.collection } },
      { 'user.value': { equals: req.user.id } },
    ],
  }
}

function enrichDocument({
  collectionSlug,
  doc,
  req,
}: {
  collectionSlug: string
  doc: QueryDoc
  req: PayloadRequest
}): ActivityDocument {
  const { i18n, payload } = req
  const config = payload.collections[collectionSlug].config
  const rawTitle = getValueByPath({ object: doc, path: config.admin?.useAsTitle || 'id' })
  const status = doc._displayStatus || doc._status
  return {
    id: doc.id,
    collectionSlug,
    dateLabel: doc.updatedAt
      ? formatRelativeDate({
          relativeTimeFormat: getRelativeTimeFormat(i18n.language),
          value: doc.updatedAt,
        })
      : undefined,
    dateTime: doc.updatedAt,
    href: formatAdminURL({
      adminRoute: payload.config.routes.admin,
      path: `/collections/${collectionSlug}/${encodeURIComponent(String(doc.id))}`,
    }),
    isChanged: status === 'changed',
    isDraft: status === 'draft',
    statusLabel:
      status === 'draft'
        ? i18n.t('version:draft')
        : status === 'changed'
          ? i18n.t('version:changed')
          : status === 'published'
            ? i18n.t('version:published')
            : undefined,
    thumbnailURL: getDocumentThumbnail({
      doc,
      useAsThumbnail: config.admin?.useAsThumbnail,
    }),
    title: typeof rawTitle === 'string' && rawTitle ? rawTitle : String(doc.id),
    typeLabel: getTranslation(config.labels.plural, i18n),
    updatedAt: doc.updatedAt,
  }
}
