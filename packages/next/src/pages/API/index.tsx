import React from 'react'

import type { ServerSideEditViewProps } from '../../../../ui/src/views/types'

import { sanitizedEditViewProps } from '../Edit/sanitizedEditViewProps'
import { APIViewClient } from './index.client'

export const APIView: React.FC<ServerSideEditViewProps> = async (props) => {
  const clientSideProps = sanitizedEditViewProps(props)
  return <APIViewClient {...clientSideProps} />
}
