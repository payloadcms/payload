import type { ServerSideEditViewProps } from 'payload/types'

import React from 'react'

import { EditViewClient } from './index.client'

export const EditView: React.FC<ServerSideEditViewProps> = () => {
  return <EditViewClient />
}
