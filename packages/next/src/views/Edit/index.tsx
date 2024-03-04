import type { ServerSideEditViewProps } from 'payload/types'

import React from 'react'

import { EditViewClient } from './index.client'
import { sanitizeEditViewProps } from './sanitizeEditViewProps'

export const EditView: React.FC<ServerSideEditViewProps> = (props) => {
  // Perform server-side logic here, but no need to fetch data, etc.
  // The `Document` component is a wrapper around all edit views, including this one
  // It sets up the document info context for the client to subscribe to
  const clientSideProps = sanitizeEditViewProps(props)
  return <EditViewClient {...clientSideProps} />
}
