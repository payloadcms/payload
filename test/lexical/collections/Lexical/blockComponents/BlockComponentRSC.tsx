import type { LexicalBlockServerProps } from '@payloadcms/richtext-lexical'

import { BlockCollapsible } from '@payloadcms/richtext-lexical/client'
import React from 'react'

export const BlockComponentRSC: React.FC<LexicalBlockServerProps> = (props) => {
  const { siblingData } = props

  return (
    <BlockCollapsible>
      <div data-testid="block-rsc-data">Data: {siblingData?.key ?? ''}</div>
    </BlockCollapsible>
  )
}
