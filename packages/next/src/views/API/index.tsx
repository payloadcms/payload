import React from 'react'

import type { ServerSideEditViewProps } from '../Edit/types'

import { sanitizeEditViewProps } from '../Edit/sanitizeEditViewProps'
import { APIViewClient } from './index.client'

export const APIView: React.FC<ServerSideEditViewProps> = async (props) => {
  // Perform server-side logic here, but no need to fetch data, etc.
  // The `Document` component is a wrapper around all edit views, including this one
  // It sets up the document info context for the client to subscribe to
  const clientSideProps = sanitizeEditViewProps(props)
  return <APIViewClient {...clientSideProps} />
}
