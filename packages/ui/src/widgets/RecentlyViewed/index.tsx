import type { WidgetServerProps } from 'payload'

import { formatAdminURL } from 'payload/shared'
import React from 'react'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports dir for proper client boundary
import { RecentsAndPinnedClient } from '../../exports/client/index.js'

type RecentlyViewedWidgetData = {
  excludedCollections?: string[]
}

export function RecentlyViewedWidget({
  req,
  widgetData,
}: WidgetServerProps<{ data?: RecentlyViewedWidgetData }>) {
  const { i18n, payload, user } = req
  if (!user) {
    return null
  }
  return (
    <RecentsAndPinnedClient
      excludedCollections={widgetData?.excludedCollections}
      labels={{
        addPin: i18n.t('dashboard:widgetAddPin'),
        loadError: i18n.t('error:unknown'),
        loading: i18n.t('general:loading'),
        next: i18n.t('general:next'),
        of: i18n.t('general:of'),
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
      pinsURL={formatAdminURL({
        apiRoute: payload.config.routes.api,
        path: '/payload-pinned-documents',
        serverURL: payload.config.serverURL,
      })}
    />
  )
}
