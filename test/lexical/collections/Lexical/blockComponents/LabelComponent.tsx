'use client'

import type { LexicalBlockLabelClientProps } from '@payloadcms/richtext-lexical'

import { useFormFields } from '@payloadcms/ui'
import React from 'react'

export const LabelComponent: React.FC<LexicalBlockLabelClientProps> = () => {
  const key = useFormFields(([fields]) => fields.key)

  return <div>{(key?.value as string) ?? '<no value>'}yaya</div>
}
