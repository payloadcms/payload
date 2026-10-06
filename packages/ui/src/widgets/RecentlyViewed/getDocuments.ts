import type { PayloadRequest, RecentlyViewedPreferences, ServerFunction, Where } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL, PREFERENCE_KEYS } from 'payload/shared'

import type { RecentDocument } from './index.client.js'
import type { PinnedItem } from './recents.js'

import { formatRelativeDate, getRelativeTimeFormat } from '../../utilities/formatRelativeDate.js'
import { getPinnedItems } from './pinnedPreferences.js'
import { documentKey, getThumbnailURL, getValueByPath } from './recents.js'

export type DocumentsTab = 'pinned' | 'recents'
export type DocumentsPageArgs = {
  excludedCollections?: string[]
  limit: number
  page: number
  shouldIncludePinPlaceholder?: boolean
  tab: DocumentsTab
}
export type DocumentsPage = {
  items: RecentDocument[]
  page: number
  totalDocs: number
}

type Reference = PinnedItem
type QueryDoc = { id: number | string; updatedAt?: string } & Record<string, unknown>

export const getDashboardDocumentsHandler: ServerFunction<
  DocumentsPageArgs,
  Promise<DocumentsPage>
> = getDashboardDocuments

export async function getDashboardDocuments({
  excludedCollections = [],
  limit,
  page,
  req,
  shouldIncludePinPlaceholder = false,
  tab,
}: { req: PayloadRequest } & DocumentsPageArgs): Promise<DocumentsPage> {
  if (!req.user) {
    throw new Error('Unauthorized')
  }
  if (![1, 2, 4].includes(limit) || !Number.isSafeInteger(page) || page < 1) {
    throw new Error('Invalid dashboard page')
  }
  const excluded = new Set(excludedCollections)
  let references: Reference[]
  let totalDocs: number

  if (tab === 'pinned') {
    const preference = await req.payload.find({
      collection: 'payload-preferences',
      depth: 0,
      limit: 1,
      overrideAccess: false,
      req,
      user: req.user,
      where: { and: [ownerWhere({ req }), { key: { equals: PREFERENCE_KEYS.PINNED_DOCUMENTS } }] },
    })
    const pinnedReferences = getPinnedItems({ value: preference.docs[0]?.value }).filter(
      (item) => req.payload.collections[item.collectionSlug],
    )

    totalDocs = pinnedReferences.length
    const lastPage = Math.max(
      1,
      Math.ceil((totalDocs + Number(shouldIncludePinPlaceholder)) / limit),
    )

    page = Math.min(page, lastPage)
    references = pinnedReferences.slice((page - 1) * limit, page * limit)
  } else if (tab === 'recents') {
    const preference = await req.payload.find({
      collection: 'payload-preferences',
      depth: 0,
      limit: 1,
      overrideAccess: false,
      req,
      user: req.user,
      where: { and: [ownerWhere({ req }), { key: { equals: PREFERENCE_KEYS.RECENTLY_VIEWED } }] },
    })
    const value = preference.docs[0]?.value as RecentlyViewedPreferences | undefined
    const recentReferences = (value?.items ?? []).filter(
      (item) => !excluded.has(item.collectionSlug) && req.payload.collections[item.collectionSlug],
    )
    totalDocs = recentReferences.length
    page = Math.min(page, Math.max(1, Math.ceil(totalDocs / limit)))
    references = recentReferences.slice((page - 1) * limit, page * limit)
  } else {
    throw new Error('Invalid dashboard tab')
  }

  const documents = await loadDocuments({ references, req })
  const items = references
    .map((reference): RecentDocument | undefined => {
      const document = documents.get(documentKey(reference))
      return document
    })
    .filter((item): item is RecentDocument => Boolean(item))

  return { items, page, totalDocs }
}

async function loadDocuments({
  references,
  req,
}: {
  references: Reference[]
  req: PayloadRequest
}): Promise<Map<string, RecentDocument>> {
  const idsByCollection = new Map<string, Array<number | string>>()
  for (const reference of references) {
    if (!req.payload.collections[reference.collectionSlug]) {
      continue
    }
    const ids = idsByCollection.get(reference.collectionSlug) ?? []
    ids.push(reference.id)
    idsByCollection.set(reference.collectionSlug, ids)
  }
  const documents = new Map<string, RecentDocument>()
  await Promise.all(
    [...idsByCollection.entries()].map(async ([collectionSlug, ids]) => {
      const result = await req.payload.find({
        collection: collectionSlug,
        depth: 1,
        disableErrors: true,
        draft: true,
        limit: ids.length,
        overrideAccess: false,
        req,
        user: req.user,
        where: { id: { in: ids } },
      })
      for (const doc of result.docs as QueryDoc[]) {
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
}): RecentDocument {
  const { i18n, payload } = req
  const config = payload.collections[collectionSlug].config
  const rawTitle = getValueByPath({ object: doc, path: config.admin?.useAsTitle || 'id' })
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
      path: `/collections/${collectionSlug}/${doc.id}`,
    }),
    isDraft: doc._status === 'draft',
    statusLabel:
      doc._status === 'draft'
        ? i18n.t('version:draft')
        : doc._status === 'published'
          ? i18n.t('version:published')
          : undefined,
    thumbnailURL: getThumbnailURL({
      doc,
      fields: config.fields,
      isUploadCollection: Boolean(config.upload),
      useAsThumbnail: config.admin?.useAsThumbnail,
    }),
    title: typeof rawTitle === 'string' && rawTitle ? rawTitle : String(doc.id),
    typeLabel: getTranslation(config.labels.plural, i18n),
    updatedAt: doc.updatedAt,
  }
}
