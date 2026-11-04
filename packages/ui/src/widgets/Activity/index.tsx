import type { PayloadRequest, WidgetServerProps } from 'payload'

import { formatAdminURL, PREFERENCE_KEYS } from 'payload/shared'
import React from 'react'

import type { ActivityDocumentsPage, ActivityDocumentType } from './utils/getActivityWidgetDocs.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports dir for proper client boundary
import { ActivityWidgetClient } from '../../exports/client/index.js'
import { getVisibleEntities } from '../../utilities/getVisibleEntities.js'
import { isNavEntityVisible } from '../../utilities/isNavEntityVisible.js'
import { DOCUMENTS_BATCH_SIZE } from './utils/constants.js'
import { getActivityWidgetDocs } from './utils/getActivityWidgetDocs.js'

type ActivityWidgetData = {
  excludedCollections?: string[]
}

/**
 * @internal - may change or be removed without a major version bump
 */
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
      ({ slug, admin }) =>
        visibleCollections.includes(slug) &&
        isNavEntityVisible({
          adminGroup: admin.group,
          entityPermissions: permissions?.collections?.[slug],
        }),
    )
    .map(({ slug }) => slug)
  const [pinned, recents] = await Promise.all(
    (['pinned', 'recents'] as const).map((type) =>
      getInitialPage({ type, excludedCollections, req }),
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
  type,
  excludedCollections,
  req,
}: {
  excludedCollections?: string[]
  req: PayloadRequest
  type: ActivityDocumentType
}): Promise<ActivityDocumentsPage | undefined> {
  try {
    return await getActivityWidgetDocs({
      type,
      excludedCollections,
      limit: DOCUMENTS_BATCH_SIZE,
      page: 1,
      req,
    })
  } catch (err) {
    req.payload.logger.error({ err, msg: `Failed to load ${type} dashboard documents` })

    return undefined
  }
}
