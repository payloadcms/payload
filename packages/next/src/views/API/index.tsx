import type { EditViewComponent } from 'payload/types'

import React from 'react'

import { APIViewClient } from './index.client.js'

export const APIView: EditViewComponent = () => {
  return <APIViewClient />
}
