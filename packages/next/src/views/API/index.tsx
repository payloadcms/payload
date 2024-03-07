import type { ServerSideEditViewProps } from 'payload/types'

import React from 'react'

import { APIViewClient } from './index.client.js'

export const APIView: React.FC<ServerSideEditViewProps> = () => {
  return <APIViewClient />
}
