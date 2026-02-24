'use client'

import type { LexicalBlockLabelClientProps } from '@payloadcms/richtext-lexical'

import { useBlockComponentContext } from '@payloadcms/richtext-lexical/client'
import { useFormFields } from '@payloadcms/ui'
import React from 'react'

export const LabelComponent: React.FC<LexicalBlockLabelClientProps> = () => {
  const { parentPath } = useBlockComponentContext()
  const key = useFormFields(([fields]) => fields[`${parentPath}.key`])

  return <div>{(key?.value as string) ?? '<no value>'}</div>
}
