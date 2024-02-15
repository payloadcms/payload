import React from 'react'
import { DefaultEditView } from '@payloadcms/ui'
import { ServerSideEditViewProps } from '../../../../ui/src/views/types'
import { sanitizedEditViewProps } from './sanitizedEditViewProps'

export const EditView: React.FC<ServerSideEditViewProps> = async (props) => {
  const clientSideProps = sanitizedEditViewProps(props)
  return <DefaultEditView {...clientSideProps} />
}
