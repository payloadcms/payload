import type { ServerSideEditViewComponent } from 'payload/types'

import React from 'react'

import { APIViewClient } from './index.client.js'

export const APIView: ServerSideEditViewComponent = () => {
  return <APIViewClient />
}
