import type { EditViewComponent } from 'payload/types'

import React from 'react'

import { EditViewClient } from './index.client.js'

export const EditView: EditViewComponent = () => {
  return <EditViewClient />
}
