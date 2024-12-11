import type { BlocksFieldServerComponent } from 'payload'

import { BlockCollapsible } from '@payloadcms/richtext-lexical/client'
import React from 'react'

export const BlockComponentRSC: BlocksFieldServerComponent = (props) => {
  const { data } = props

  return <BlockCollapsible>Data: {data?.key ?? ''}</BlockCollapsible>
}
