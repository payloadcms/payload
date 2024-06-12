import type { EditViewComponent } from 'payload/bundle'

import React from 'react'

import { APIViewClient } from './index.client.js'

export const APIView: EditViewComponent = () => {
  return <APIViewClient />
}
