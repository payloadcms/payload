import type { EditViewComponent, PayloadServerReactComponent } from 'payload'

import React from 'react'

import { EditViewClient } from './index.client.js'

export const EditView: PayloadServerReactComponent<EditViewComponent> = () => {
  return <EditViewClient />
}
