import React from 'react'
import { ServerSideEditViewProps } from '../../../../ui/src/views/types'
import { APIViewClient } from './index.client'
import { sanitizedEditViewProps } from '../Edit/sanitizedEditViewProps'

export const APIView: React.FC<ServerSideEditViewProps> = async (props) => {
  const clientSideProps = sanitizedEditViewProps(props)
  return <APIViewClient {...clientSideProps} />
}
