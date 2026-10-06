import type { RecentlyViewedPreferences, WidgetServerProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL, PREFERENCE_KEYS } from 'payload/shared'
import React from 'react'

import type { WidgetListItem } from '../WidgetCard/index.js'

import { formatRelativeDate, getRelativeTimeFormat } from '../../utilities/formatRelativeDate.js'
import { getPreferences } from '../../utilities/upsertPreferences.js'
import { WidgetCard, WidgetList } from '../WidgetCard/index.js'

type RecentlyViewedWidgetData = {
  excludedCollections?: string[]
}

type QueryDoc = {
  id: number | string
  thumbnailURL?: unknown
} & Record<string, unknown>

type EnrichedItem = {
  collectionSlug: string
  href: string
  id: number | string
  thumbnailURL?: string
  title: string
  typeLabel: string
  viewedAt: string
}

const displayLimit = 10

export async function RecentlyViewedWidget({
  req,
  widgetData,
}: WidgetServerProps<{ data?: RecentlyViewedWidgetData }>) {
  const { i18n, user } = req
  const title = i18n.t('dashboard:widgetRecentlyViewedTitle')

  const enrichedItems = user ? await getEnrichedItems({ req, widgetData }) : []
  const relativeTimeFormat = getRelativeTimeFormat(i18n.language)

  const items: WidgetListItem[] = enrichedItems.map((item) => ({
    href: item.href,
    key: `${item.collectionSlug}:${item.id}`,
    main: (
      <>
        {item.thumbnailURL ? (
          <img alt="" className="widget-card__thumbnail" src={item.thumbnailURL} />
        ) : (
          <span className="widget-card__type">{item.typeLabel}</span>
        )}
        <span className="widget-card__row-title">{item.title}</span>
      </>
    ),
    meta: (
      <time dateTime={item.viewedAt}>
        {formatRelativeDate({ relativeTimeFormat, value: item.viewedAt })}
      </time>
    ),
  }))

  return (
    <WidgetCard className="recently-viewed-widget" title={title}>
      <WidgetList emptyMessage={i18n.t('dashboard:widgetRecentlyViewedEmpty')} items={items} />
    </WidgetCard>
  )
}

/**
 * Loads the stored recently viewed identities and computes display fields from the live documents.
 * Documents are queried with access control, so deleted or now-forbidden docs are dropped.
 */
async function getEnrichedItems({
  req,
  widgetData,
}: {
  req: WidgetServerProps['req']
  widgetData: RecentlyViewedWidgetData | undefined
}): Promise<EnrichedItem[]> {
  const { i18n, payload, user } = req
  const excludedCollections = new Set(widgetData?.excludedCollections ?? [])

  const preference = await getPreferences<RecentlyViewedPreferences>(
    PREFERENCE_KEYS.RECENTLY_VIEWED,
    payload,
    user.id,
    user.collection,
  )

  const items = (preference?.value?.items ?? []).filter(
    (item) =>
      !excludedCollections.has(item.collectionSlug) &&
      Boolean(payload.collections[item.collectionSlug]),
  )

  if (items.length === 0) {
    return []
  }

  const idsByCollection = new Map<string, Array<number | string>>()
  for (const item of items) {
    const ids = idsByCollection.get(item.collectionSlug) ?? []
    ids.push(item.id)
    idsByCollection.set(item.collectionSlug, ids)
  }

  const docsByKey = new Map<string, QueryDoc>()
  await Promise.all(
    [...idsByCollection.entries()].map(async ([collectionSlug, ids]) => {
      try {
        const result = await payload.find({
          collection: collectionSlug,
          depth: 0,
          limit: ids.length,
          overrideAccess: false,
          pagination: false,
          user,
          where: { id: { in: ids } },
        })

        for (const doc of result.docs as QueryDoc[]) {
          docsByKey.set(`${collectionSlug}:${doc.id}`, doc)
        }
      } catch (err) {
        payload.logger.error({
          err,
          msg: `RecentlyViewedWidget: failed to load collection "${collectionSlug}"`,
        })
      }
    }),
  )

  const enrichedItems: EnrichedItem[] = []

  for (const item of items) {
    if (enrichedItems.length >= displayLimit) {
      break
    }

    const doc = docsByKey.get(`${item.collectionSlug}:${item.id}`)

    if (!doc) {
      continue
    }

    const collectionConfig = payload.collections[item.collectionSlug].config
    const useAsTitle = collectionConfig.admin?.useAsTitle || 'id'
    const rawTitle = getValueByPath({ object: doc, path: useAsTitle })

    enrichedItems.push({
      id: item.id,
      collectionSlug: item.collectionSlug,
      href: formatAdminURL({
        adminRoute: payload.config.routes.admin,
        path: `/collections/${item.collectionSlug}/${item.id}`,
      }),
      thumbnailURL:
        collectionConfig.upload && typeof doc.thumbnailURL === 'string'
          ? doc.thumbnailURL
          : undefined,
      title: typeof rawTitle === 'string' && rawTitle ? rawTitle : String(item.id),
      typeLabel: getTranslation(collectionConfig.labels.singular, i18n),
      viewedAt: item.viewedAt,
    })
  }

  return enrichedItems
}

function getValueByPath({ object, path }: { object: Record<string, unknown>; path: string }) {
  return path.split('.').reduce<unknown>((value, segment) => {
    if (!value || typeof value !== 'object') {
      return undefined
    }

    return (value as Record<string, unknown>)[segment]
  }, object)
}
