'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation.js'
import React from 'react'

import { PAYLOAD_SERVER_URL } from '../../../_api/serverURL.js'

export const PayloadLivePreview: React.FC = () => {
  const router = useRouter()
  return <RefreshRouteOnSave refresh={() => router.refresh()} serverURL={PAYLOAD_SERVER_URL} />
}
