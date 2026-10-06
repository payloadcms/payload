import type { PayloadRequest, SelectType, ServerFunction, Where } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { UnauthorizedError } from 'payload'
import { formatAdminURL, PREFERENCE_KEYS } from 'payload/shared'

import type { RecentDocument } from './index.client.js'
import type { PinnedItem } from './recents.js'

import { formatRelativeDate, getRelativeTimeFormat } from '../../utilities/formatRelativeDate.js'
import { getDocumentThumbnail } from '../../utilities/getDocumentThumbnail.js'
import { getPinnedItems } from './pinnedPreferences.js'
import { documentKey, getValueByPath } from './recents.js'

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
    throw new UnauthorizedError(req.t)
  }
  if (![1, 2, 4].includes(limit) || !Number.isSafeInteger(page) || page < 1) {
    throw new Error('Invalid dashboard page')
  }
  if (tab !== 'pinned' && tab !== 'recents') {
    throw new Error('Invalid dashboard tab')
  }

  const key = tab === 'pinned' ? PREFERENCE_KEYS.PINNED_DOCUMENTS : PREFERENCE_KEYS.RECENTLY_VIEWED
  const preference = await req.payload.find({
    collection: 'payload-preferences',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    req,
    user: req.user,
    where: { and: [ownerWhere({ req }), { key: { equals: key } }] },
  })
  const excluded = new Set(tab === 'recents' ? excludedCollections : [])
  const storedReferences = getPinnedItems({ value: preference.docs[0]?.value }).filter(
    ({ collectionSlug }) =>
      !excluded.has(collectionSlug) && req.payload.collections[collectionSlug],
  )
  const availableReferences = await getAvailableReferences({ references: storedReferences, req })
  const totalDocs = availableReferences.length
  const lastPage = Math.max(
    1,
    Math.ceil((totalDocs + Number(tab === 'pinned' && shouldIncludePinPlaceholder)) / limit),
  )

  page = Math.min(page, lastPage)
  const references = availableReferences.slice((page - 1) * limit, page * limit)

  const documents = await loadDocuments({ references, req })
  const items = references
    .map((reference): RecentDocument | undefined => {
      const document = documents.get(documentKey(reference))
      return document
    })
    .filter((item): item is RecentDocument => Boolean(item))

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
}): Promise<Map<string, RecentDocument>> {
  const documents = new Map<string, RecentDocument>()
  await Promise.all(
    [...groupReferenceIDs({ references }).entries()].map(async ([collectionSlug, ids]) => {
      const config = req.payload.collections[collectionSlug].config
      const select: SelectType = {
        id: true,
        [(config.admin.useAsTitle || 'id').split('.')[0]]: true,
        _status: true,
        updatedAt: true,
        ...(config.admin.useAsThumbnail ? { [config.admin.useAsThumbnail]: true } : {}),
        ...(config.upload
          ? { mimeType: true, thumbnailURL: true, url: true, variants: true, width: true }
          : {}),
      }
      const result = await req.payload.find({
        collection: collectionSlug,
        depth: 1,
        disableErrors: true,
        draft: true,
        limit: ids.length,
        overrideAccess: false,
        req,
        select,
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
    thumbnailURL: getDocumentThumbnail({
      doc,
      useAsThumbnail: config.admin?.useAsThumbnail,
    }),
    title: typeof rawTitle === 'string' && rawTitle ? rawTitle : String(doc.id),
    typeLabel: getTranslation(config.labels.plural, i18n),
    updatedAt: doc.updatedAt,
  }
}
