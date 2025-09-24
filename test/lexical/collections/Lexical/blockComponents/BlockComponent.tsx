'use client'
import {
  BlockCollapsible,
  BlockEditButton,
  BlockRemoveButton,
} from '@payloadcms/richtext-lexical/client'
import { useFormFields } from '@payloadcms/ui'
import React from 'react'

export const BlockComponent: React.FC = () => {
  const key = useFormFields(([fields]) => fields.key)

  return (
    <BlockCollapsible>
      MY BLOCK COMPONENT. Value: {(key?.value as string) ?? '<no value>'}
      Edit: <BlockEditButton />
      <BlockRemoveButton />
    </BlockCollapsible>
  )
}
