'use client'

import type { LexicalInlineBlockClientProps } from '@payloadcms/richtext-lexical'

import { useInlineBlockComponentContext } from '@payloadcms/richtext-lexical/client'
import { useFormFields } from '@payloadcms/ui'
import React from 'react'

export const LabelComponent: React.FC<LexicalInlineBlockClientProps> = () => {
  const ctx = useInlineBlockComponentContext()
  const key = useFormFields(([fields]) => fields[`${ctx.parentPath}.key`])

  return <div>{(key?.value as string) ?? '<no value>'}</div>
}
