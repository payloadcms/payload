import { createFileRoute } from '@tanstack/react-router'
import React from 'react'

import { LivePreviewPage } from '../components/LivePreviewPage/index.js'
import { getLivePreviewDoc } from '../functions/livePreview.functions.js'

function parseCollectionAndSlug(splat: string): { collection: string; slug: string } {
  const parts = splat.split('/').filter(Boolean)
  if (parts.length === 0) {
    return { collection: 'pages', slug: 'home' }
  }
  if (parts.length === 1) {
    // Single segment — treated as a pages collection slug
    return { collection: 'pages', slug: parts[0]! }
  }
  // First segment is the collection, remaining segments form the slug
  return { collection: parts[0]!, slug: parts.slice(1).join('/') }
}

export const Route = createFileRoute('/live-preview/$')({
  loader: async ({ params }) => {
    const { collection, slug } = parseCollectionAndSlug(params._splat ?? '')
    const doc = await getLivePreviewDoc({ data: { collection, slug } })
    return { doc }
  },
  component: LivePreviewSplatPage,
})

function LivePreviewSplatPage() {
  const { doc } = Route.useLoaderData()
  return <LivePreviewPage initialData={doc} />
}
