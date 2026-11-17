import { BlockCollapsible } from '@payloadcms/richtext-lexical/client'
import { Collapsible } from '@payloadcms/ui'
import React from 'react'

export const NoDragHandleBlock = () => (
  <BlockCollapsible showDragHandle={false}>
    <Collapsible
      dragHandleProps={{
        id: 'nested-row',
        attributes: { role: 'button', tabIndex: 0 },
        listeners: {},
      }}
      header="Nested row"
    >
      Nested content
    </Collapsible>
  </BlockCollapsible>
)
