'use client'
import {
  WrapperBlockContainer,
  WrapperBlockEditButton,
  WrapperBlockLabel,
  WrapperBlockRemoveButton,
} from '@payloadcms/richtext-lexical/client'
import { useAllFormFields } from '@payloadcms/ui'
import React from 'react'

export const BlockComponent: React.FC = () => {
  const fields = useAllFormFields()
  console.log({ fields })
  return (
    <WrapperBlockContainer>
      <p>Test</p>
      <WrapperBlockEditButton />
      <WrapperBlockLabel />
      <WrapperBlockRemoveButton />
    </WrapperBlockContainer>
  )
}
