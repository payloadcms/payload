import { createFileRoute } from '@tanstack/react-router'
import React from 'react'

import { LivePreviewPage } from '../components/LivePreviewPage/index.js'
import { getLivePreviewDoc } from '../functions/livePreview.functions.js'

export const Route = createFileRoute('/live-preview/')({
  loader: async () => {
    const doc = await getLivePreviewDoc({ data: { collection: 'pages', slug: 'home' } })
    return { doc }
  },
  component: LivePreviewIndexPage,
})

function LivePreviewIndexPage() {
  const { doc } = Route.useLoaderData()
  return <LivePreviewPage initialData={doc} />
}
