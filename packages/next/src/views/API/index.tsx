import type { EditViewComponent, PayloadServerReactComponent } from 'payload'

import React from 'react'

import { APIViewClient } from './index.client.js'

export const APIView: PayloadServerReactComponent<EditViewComponent> = () => {
  return <APIViewClient />
}
