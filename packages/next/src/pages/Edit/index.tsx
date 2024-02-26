import React from 'react'

import type { ServerSideEditViewProps } from './types'

import { DefaultEditViewClient } from './index.client'

export const EditView: React.FC<ServerSideEditViewProps> = async () => {
  return <DefaultEditViewClient />
}
