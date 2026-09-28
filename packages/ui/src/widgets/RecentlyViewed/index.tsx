import type { RecentlyViewedPreferences, WidgetServerProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL, PREFERENCE_KEYS } from 'payload/shared'
import React from 'react'

import type { RecentDocument } from './index.client.js'
import type { PinnedItem, PinnedPreferences } from './recents.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports dir for proper client boundary
import { RecentsAndPinnedClient } from '../../exports/client/index.js'
import { formatRelativeDate, getRelativeTimeFormat } from '../../utilities/formatRelativeDate.js'
import { getPreferences } from '../../utilities/upsertPreferences.js'
import { documentKey, getThumbnailURL, getValueByPath } from './recents.js'

type RecentlyViewedWidgetData = {
  excludedCollections?: string[]
}

type QueryDoc = {
  id: number | string
  updatedAt?: string
} & Record<string, unknown>

const displayLimit = 10

export async function RecentlyViewedWidget({
  req,
  widgetData,
}: WidgetServerProps<{ data?: RecentlyViewedWidgetData }>) {
  const { i18n, payload, user } = req
  const excludedCollections = new Set(widgetData?.excludedCollections ?? [])

  if (!user) {
    return null
  }

  const [recentPreference, pinnedPreference] = await Promise.all([
    getPreferences<RecentlyViewedPreferences>(
      PREFERENCE_KEYS.RECENTLY_VIEWED,
      payload,
      user.id,
      user.collection,
    ),
    getPreferences<PinnedPreferences>(PREFERENCE_KEYS.PINNED, payload, user.id, user.collection),
  ])

  const recentReferences = (recentPreference?.value?.items ?? []).filter(
    (item) => !excludedCollections.has(item.collectionSlug),
  )
  const pinnedReferences = (pinnedPreference?.value?.items ?? []).filter(
    (item) => !excludedCollections.has(item.collectionSlug),
  )
  const [documentsByKey, drafts] = await Promise.all([
    loadDocuments({ references: [...recentReferences, ...pinnedReferences], req }),
    loadRecentDrafts({ excludedCollections, req }),
  ])

  const recents = recentReferences
    .map((reference): RecentDocument | undefined => {
      const document = documentsByKey.get(documentKey(reference))
      return document
    })
    .filter((item): item is RecentDocument => Boolean(item))
    .slice(0, displayLimit)
  const pinned = pinnedReferences
    .map((item) => documentsByKey.get(documentKey(item)))
    .filter((item): item is RecentDocument => Boolean(item))

  return (
    <RecentsAndPinnedClient
      drafts={drafts}
      labels={{
        name: i18n.t('general:name'),
        addPin: i18n.t('dashboard:widgetAddPin'),
        collection: i18n.t('general:collection'),
        drafts: i18n.t('dashboard:widgetRecentDrafts'),
        draftsEmpty: i18n.t('dashboard:widgetRecentDraftsEmpty'),
        draftsEmptyDescription: i18n.t('dashboard:widgetRecentDraftsEmptyDescription'),
        grid: i18n.t('dashboard:widgetGridView'),
        list: i18n.t('dashboard:widgetListView'),
        pinned: i18n.t('dashboard:widgetPinned'),
        pinnedEmpty: i18n.t('dashboard:widgetPinnedEmpty'),
        pinnedEmptyDescription: i18n.t('dashboard:widgetPinnedEmptyDescription'),
        pinnedSaveError: i18n.t('dashboard:widgetPinnedSaveError'),
        recents: i18n.t('dashboard:widgetRecentlyViewedTitle'),
        recentsEmpty: i18n.t('dashboard:widgetRecentlyViewedEmpty'),
        recentsEmptyDescription: i18n.t('dashboard:widgetRecentlyViewedEmptyDescription'),
        removePin: i18n.t('dashboard:widgetRemovePin'),
        title: i18n.t('dashboard:widgetRecentsAndPinned'),
        updated: i18n.t('dashboard:widgetUpdated'),
        updatedBy: i18n.t('dashboard:widgetUpdatedBy'),
      }}
      pinned={pinned}
      recents={recents}
    />
  )
}

async function loadDocuments({
  references,
  req,
}: {
  references: PinnedItem[]
  req: WidgetServerProps['req']
}): Promise<Map<string, RecentDocument>> {
  const { payload, user } = req
  const idsByCollection = new Map<string, Array<number | string>>()

  for (const reference of references) {
    if (!payload.collections[reference.collectionSlug]) {
      continue
    }

    const ids = idsByCollection.get(reference.collectionSlug) ?? []
    ids.push(reference.id)
    idsByCollection.set(reference.collectionSlug, ids)
  }

  const documents = new Map<string, RecentDocument>()
  await Promise.all(
    [...idsByCollection.entries()].map(async ([collectionSlug, ids]) => {
      try {
        const result = await payload.find({
          collection: collectionSlug,
          depth: 1,
          limit: ids.length,
          overrideAccess: false,
          pagination: false,
          user,
          where: { id: { in: ids } },
        })

        for (const doc of result.docs as QueryDoc[]) {
          const item = enrichDocument({ collectionSlug, doc, req })
          documents.set(documentKey(item), item)
        }
      } catch (err) {
        payload.logger.error({
          err,
          msg: `RecentlyViewedWidget: failed to load "${collectionSlug}"`,
        })
      }
    }),
  )

  return documents
}

async function loadRecentDrafts({
  excludedCollections,
  req,
}: {
  excludedCollections: Set<string>
  req: WidgetServerProps['req']
}): Promise<RecentDocument[]> {
  const { payload, user } = req
  const draftCollections = Object.values(payload.collections).filter(
    ({ config }) => config.versions?.drafts && !excludedCollections.has(config.slug),
  )
  const draftResults = await Promise.all(
    draftCollections.map(async ({ config }) => {
      try {
        const result = await payload.find({
          collection: config.slug,
          depth: 1,
          draft: true,
          limit: displayLimit,
          overrideAccess: false,
          sort: '-updatedAt',
          user,
          where: { _status: { equals: 'draft' } },
        })

        return (result.docs as QueryDoc[]).map((doc) =>
          enrichDocument({ collectionSlug: config.slug, doc, req }),
        )
      } catch (err) {
        payload.logger.error({
          err,
          msg: `RecentlyViewedWidget: failed to load drafts for "${config.slug}"`,
        })
        return []
      }
    }),
  )

  return draftResults
    .flat()
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
    .slice(0, displayLimit)
}

function enrichDocument({
  collectionSlug,
  doc,
  req,
}: {
  collectionSlug: string
  doc: QueryDoc
  req: WidgetServerProps['req']
}): RecentDocument {
  const { i18n, payload } = req
  const collectionConfig = payload.collections[collectionSlug].config
  const rawTitle = getValueByPath({ object: doc, path: collectionConfig.admin?.useAsTitle || 'id' })

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
      fields: collectionConfig.fields,
      isUploadCollection: Boolean(collectionConfig.upload),
      useAsThumbnail: collectionConfig.admin?.useAsThumbnail,
    }),
    title: typeof rawTitle === 'string' && rawTitle ? rawTitle : String(doc.id),
    typeLabel: getTranslation(collectionConfig.labels.plural, i18n),
    updatedAt: doc.updatedAt,
  }
}
