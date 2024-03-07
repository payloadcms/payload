import type { ServerSideEditViewProps } from 'payload/types'

import React from 'react'

import { EditViewClient } from './index.client.js'

export const EditView: React.FC<ServerSideEditViewProps> = () => {
  return <EditViewClient />
}
