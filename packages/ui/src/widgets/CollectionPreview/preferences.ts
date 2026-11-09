import { PREFERENCE_KEYS } from 'payload/shared'

import type { DocumentLayout } from '../../elements/LayoutToggle/index.js'

export type CollectionPreviewPreferences = {
  documentLayout?: DocumentLayout
}

export function getCollectionPreviewPreferenceKey({
  collectionSlug,
  widgetId,
}: {
  collectionSlug: string
  widgetId?: string
}): string {
  if (widgetId) {
    return `${PREFERENCE_KEYS.DASHBOARD_COLLECTION_LAYOUT}-widget-${widgetId}`
  }

  return `${PREFERENCE_KEYS.DASHBOARD_COLLECTION_LAYOUT}-${collectionSlug}`
}

export function getCollectionPreviewLayout({ value }: { value: unknown }): DocumentLayout {
  return value &&
    typeof value === 'object' &&
    'documentLayout' in value &&
    value.documentLayout === 'table'
    ? 'table'
    : 'grid'
}
