import type { WidgetServerProps } from 'payload'

import React from 'react'
// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference the client bundle.
import { DocumentActivityWidget } from '../../exports/client/index.js'
import { getDocumentWidgetData } from './getDocumentWidgetData.js'

export async function RecentlyViewedWidget({
  req,
  widgetData,
}: WidgetServerProps<{ data?: { excludedCollections?: string[] } }>) {
  const data = await getDocumentWidgetData({
    excludedCollections: widgetData?.excludedCollections,
    req,
  })
  return <DocumentActivityWidget {...data} />
}
