import type { UIFieldServerComponent } from 'payload'

import { BlockCollapsible } from '@payloadcms/richtext-lexical/client'
import React from 'react'

export const BlockComponentRSC: UIFieldServerComponent = (props) => {
  const { siblingData } = props

  return <BlockCollapsible>Data: {siblingData?.key ?? ''}</BlockCollapsible>
}
