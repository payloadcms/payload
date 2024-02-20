import React from 'react'
import { ServerSideEditViewProps } from '../../../../ui/src/views/types'
import { sanitizedEditViewProps } from './sanitizedEditViewProps'
import { DefaultEditViewClient } from './index.client'

export const EditView: React.FC<ServerSideEditViewProps> = async (props) => {
  const clientSideProps = sanitizedEditViewProps(props)
  return <DefaultEditViewClient {...clientSideProps} />
}
