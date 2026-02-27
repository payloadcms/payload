'use client'

import type { LexicalBlockClientProps } from '@payloadcms/richtext-lexical'

import {
  BlockCollapsible,
  BlockEditButton,
  BlockRemoveButton,
  useBlockComponentContext,
} from '@payloadcms/richtext-lexical/client'
import { useFormFields } from '@payloadcms/ui'
import React from 'react'

export const BlockComponent: React.FC<LexicalBlockClientProps> = () => {
  const { parentPath } = useBlockComponentContext()
  const key = useFormFields(([fields]) => fields[`${parentPath}.key`])

  return (
    <BlockCollapsible>
      MY BLOCK COMPONENT. Value: {(key?.value as string) ?? '<no value>'}
      Edit: <BlockEditButton />
      <BlockRemoveButton />
    </BlockCollapsible>
  )
}
