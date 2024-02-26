import React from 'react'

import type { ServerSideEditViewProps } from '../Edit/types'

import { sanitizeEditViewProps } from '../Edit/sanitizeEditViewProps'
import { APIViewClient } from './index.client'

export const APIView: React.FC<ServerSideEditViewProps> = async (props) => {
  const clientSideProps = sanitizeEditViewProps(props)
  return <APIViewClient {...clientSideProps} />
}
