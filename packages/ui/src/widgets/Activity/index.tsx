import type { PayloadRequest, WidgetServerProps } from 'payload'

import { formatAdminURL, PREFERENCE_KEYS } from 'payload/shared'
import React from 'react'

import type { DocumentsPage, DocumentsTab } from './Documents/types.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports dir for proper client boundary
import { ActivityWidgetClient } from '../../exports/client/index.js'
import { getVisibleEntities } from '../../utilities/getVisibleEntities.js'
import { DOCUMENTS_BATCH_SIZE } from './Documents/constants.js'
import { getDashboardDocuments } from './Documents/getDocuments.js'

type ActivityWidgetData = {
  excludedCollections?: string[]
}

export async function ActivityWidget({
  permissions,
  req,
  widgetData,
}: WidgetServerProps<{ data?: ActivityWidgetData }>) {
  const { i18n, payload, user } = req
  if (!user) {
    return null
  }
  const excludedCollections = widgetData?.excludedCollections
  const visibleCollections = getVisibleEntities({ req }).collections
  const pinnableCollections = payload.config.collections
    .filter(
      ({ slug }) => visibleCollections.includes(slug) && permissions?.collections?.[slug]?.read,
    )
    .map(({ slug }) => slug)
  const [pinned, recents] = await Promise.all(
    (['pinned', 'recents'] as const).map((tab) =>
      getInitialPage({ excludedCollections, req, tab }),
    ),
  )

  return (
    <ActivityWidgetClient
      excludedCollections={excludedCollections}
      initialPages={{ pinned, recents }}
      labels={{
        addPin: i18n.t('general:selectLabel', { label: i18n.t('general:documents') }),
        loadError: i18n.t('error:unknown'),
        loading: i18n.t('general:loading'),
        next: i18n.t('general:next'),
        pagination: i18n.t('dashboard:widgetPagination'),
        pinned: i18n.t('dashboard:widgetPinned'),
        pinnedEmpty: i18n.t('dashboard:widgetPinnedEmpty'),
        pinnedEmptyDescription: i18n.t('dashboard:widgetPinnedEmptyDescription'),
        pinnedSaveError: i18n.t('dashboard:widgetPinnedSaveError'),
        previous: i18n.t('general:previous'),
        recents: i18n.t('dashboard:widgetRecentlyViewedTitle'),
        recentsEmpty: i18n.t('dashboard:widgetRecentlyViewedEmpty'),
        recentsEmptyDescription: i18n.t('dashboard:widgetRecentlyViewedEmptyDescription'),
        removePin: i18n.t('dashboard:widgetRemovePin'),
        retry: i18n.t('general:retry'),
        title: i18n.t('dashboard:widgetRecentsAndPinned'),
      }}
      pinnableCollections={pinnableCollections}
      pinsURL={formatAdminURL({
        apiRoute: payload.config.routes.api,
        path: `/payload-preferences/${PREFERENCE_KEYS.PINNED_DOCUMENTS}`,
        serverURL: payload.config.serverURL,
      })}
    />
  )
}

/** A failed initial load falls back to fetching on the client, which shows the retry state. */
async function getInitialPage({
  excludedCollections,
  req,
  tab,
}: {
  excludedCollections?: string[]
  req: PayloadRequest
  tab: DocumentsTab
}): Promise<DocumentsPage | undefined> {
  try {
    return await getDashboardDocuments({
      excludedCollections,
      limit: DOCUMENTS_BATCH_SIZE,
      page: 1,
      req,
      tab,
    })
  } catch (err) {
    req.payload.logger.error({ err, msg: `Failed to load ${tab} dashboard documents` })

    return undefined
  }
}
