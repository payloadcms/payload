'use client'
import type { BlocksFieldClientComponent } from 'payload'

import { BlocksField } from '@payloadcms/ui'
import React from 'react'

export const CustomBlocksFieldClient: BlocksFieldClientComponent = (props) => {
  return <BlocksField field={props?.field} path={props.path} permissions={props?.permissions} />
}
