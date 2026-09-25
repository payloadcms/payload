import type { ClientCollectionConfig, PayloadRequest, RecentlyViewedPreferences } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { getAccessResults } from 'payload'
import { formatAdminURL, PREFERENCE_KEYS } from 'payload/shared'

import type { DashboardDocument, DocumentWidgetData } from './shared.js'

import { formatDocTitle } from '../../utilities/formatDocTitle/index.js'
import { getVisibleEntities } from '../../utilities/getVisibleEntities.js'
import { getDocumentThumbnail, getValueAtPath } from './getDocumentThumbnail.js'
import { documentKey, normalizeDocumentPreferences } from './shared.js'

export async function getDocumentWidgetData({
  excludedCollections = [],
  req,
}: {
  excludedCollections?: string[]
  req: PayloadRequest
}): Promise<DocumentWidgetData> {
  const { i18n, payload, user } = req
  const empty: DocumentWidgetData = {
    documents: [],
    draftKeys: [],
    hasError: false,
    preferences: normalizeDocumentPreferences({ value: null }),
    recentKeys: [],
  }
  if (!user) {
    return empty
  }
  const initialData = await Promise.all([
    payload.find({
      collection: 'payload-preferences',
      depth: 0,
      limit: 2,
      overrideAccess: false,
      req,
      user,
      where: {
        key: { in: [PREFERENCE_KEYS.RECENTLY_VIEWED, PREFERENCE_KEYS.DASHBOARD_DOCUMENTS] },
      },
    }),
    getAccessResults({ req }),
  ]).catch((err) => {
    payload.logger.error({
      err,
      msg: 'Dashboard documents: failed to load preferences or permissions',
    })
    return null
  })
  if (!initialData) {
    return { ...empty, hasError: true }
  }
  const [preferencesResult, permissions] = initialData
  if (!permissions.canAccessAdmin) {
    return empty
  }
  const preferences = normalizeDocumentPreferences({
    value: preferencesResult.docs.find((doc) => doc.key === PREFERENCE_KEYS.DASHBOARD_DOCUMENTS)
      ?.value,
  })
  const recent = preferencesResult.docs.find((doc) => doc.key === PREFERENCE_KEYS.RECENTLY_VIEWED)
    ?.value as RecentlyViewedPreferences | undefined
  const recentItems = Array.isArray(recent?.items)
    ? recent.items
        .filter(
          (item) =>
            item &&
            typeof item.collectionSlug === 'string' &&
            ['number', 'string'].includes(typeof item.id),
        )
        .slice(0, 20)
    : []
  const visible = getVisibleEntities({ req }).collections
  const collections = payload.config.collections.filter(
    (collection) =>
      visible.includes(collection.slug) &&
      collection.admin.group !== false &&
      !excludedCollections.includes(collection.slug) &&
      permissions.collections?.[collection.slug]?.read,
  )
  let hasError = false
  const results = await Promise.all(
    collections.map(async (collection) => {
      const ids = [...recentItems, ...preferences.pins]
        .filter((item) => item.collectionSlug === collection.slug)
        .map((item) => item.id)
      const hasDrafts = Boolean(collection.versions && collection.versions.drafts)
      try {
        const [saved, drafts] = await Promise.all([
          ids.length
            ? payload.find({
                collection: collection.slug,
                depth: 1,
                draft: hasDrafts,
                limit: ids.length,
                overrideAccess: false,
                req,
                user,
                where: { id: { in: ids } },
              })
            : { docs: [] },
          hasDrafts
            ? payload.find({
                collection: collection.slug,
                depth: 1,
                draft: true,
                limit: 12,
                overrideAccess: false,
                req,
                sort: '-updatedAt',
                user,
                where: { _status: { equals: 'draft' } },
              })
            : { docs: [] },
        ])
        const allDocs = new Map([...saved.docs, ...drafts.docs].map((doc) => [String(doc.id), doc]))
        const draftIDs = [...allDocs.values()]
          .filter((doc) => doc._status === 'draft')
          .map((doc) => doc.id)
        const published = draftIDs.length
          ? await payload.find({
              collection: collection.slug,
              depth: 0,
              draft: false,
              limit: draftIDs.length,
              overrideAccess: false,
              req,
              select: { id: true },
              user,
              where: { and: [{ id: { in: draftIDs } }, { _status: { equals: 'published' } }] },
            })
          : { docs: [] }
        const publishedIDs = new Set(published.docs.map((doc) => String(doc.id)))
        const documents: DashboardDocument[] = [...allDocs.values()]
          .filter((doc) => !doc.deletedAt)
          .map((doc) => {
            const titlePath = collection.admin.useAsTitle || 'id'
            const updatedByField = collection.flattenedFields.find(
              (field) => field.name === 'updatedBy' && field.type === 'relationship',
            )
            const authorCollection =
              updatedByField &&
              'relationTo' in updatedByField &&
              typeof updatedByField.relationTo === 'string'
                ? payload.collections[updatedByField.relationTo]?.config
                : undefined
            const author = doc.updatedBy
            const updatedBy =
              authorCollection?.auth &&
              author &&
              typeof author === 'object' &&
              !Array.isArray(author)
                ? formatDocTitle({
                    collectionConfig: authorCollection as unknown as ClientCollectionConfig,
                    data: author,
                    dateFormat: payload.config.admin.dateFormat,
                    fallback: typeof author.email === 'string' ? author.email : undefined,
                    i18n,
                  })
                : undefined
            return {
              id: doc.id,
              collectionSlug: collection.slug,
              href: formatAdminURL({
                adminRoute: payload.config.routes.admin,
                path: `/collections/${collection.slug}/${encodeURIComponent(doc.id)}`,
              }),
              status: hasDrafts
                ? doc._status === 'draft'
                  ? publishedIDs.has(String(doc.id))
                    ? 'changed'
                    : 'draft'
                  : doc._status === 'published'
                    ? 'published'
                    : undefined
                : undefined,
              thumbnailURL: getDocumentThumbnail({ collection, doc }),
              title: formatDocTitle({
                collectionConfig: collection as unknown as ClientCollectionConfig,
                data: { ...doc, [titlePath]: getValueAtPath({ path: titlePath, value: doc }) },
                dateFormat: payload.config.admin.dateFormat,
                fallback: typeof doc.filename === 'string' ? doc.filename : String(doc.id),
                i18n,
              }),
              typeLabel: getTranslation(collection.labels.plural, i18n),
              updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : undefined,
              updatedBy,
              viewedAt: recentItems.find(
                (item) =>
                  item.collectionSlug === collection.slug && String(item.id) === String(doc.id),
              )?.viewedAt,
            }
          })
        return {
          documents,
          draftKeys: drafts.docs
            .filter((doc) => !doc.deletedAt)
            .map((doc) => documentKey({ id: doc.id, collectionSlug: collection.slug })),
        }
      } catch (err) {
        hasError = true
        payload.logger.error({ err, msg: `Dashboard documents: failed to load ${collection.slug}` })
        return { documents: [], draftKeys: [] }
      }
    }),
  )
  const documents = results.flatMap((result) => result.documents)
  const keys = new Set(documents.map(documentKey))
  return {
    documents,
    draftKeys: results.flatMap((result) => result.draftKeys),
    hasError,
    preferences,
    recentKeys: recentItems.map(documentKey).filter((key) => keys.has(key)),
  }
}
