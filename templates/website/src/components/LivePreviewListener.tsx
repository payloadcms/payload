'use client'

import { useRouter } from 'next/navigation'
import { RefreshRouteOnSave as PayloadLivePreview } from '@payloadcms/live-preview-react'

import { getClientSideURL } from '@/utils/getURL'

export const LivePreviewListener: React.FC = () => {
  const router = useRouter()
  return <PayloadLivePreview refresh={router.refresh} serverURL={getClientSideURL()} />
}
