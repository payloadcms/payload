import {
  InlineBlockContainer,
  InlineBlockEditButton,
  InlineBlockLabel,
  InlineBlockRemoveButton,
} from '@payloadcms/richtext-lexical/client'
import React from 'react'

export const BlockComponent: React.FC = () => {
  return (
    <InlineBlockContainer>
      <p>Test</p>
      <InlineBlockEditButton />
      <InlineBlockLabel />
      <InlineBlockRemoveButton />
    </InlineBlockContainer>
  )
}
