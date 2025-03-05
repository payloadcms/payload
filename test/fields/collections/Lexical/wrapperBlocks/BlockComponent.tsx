'use client'
import {
  WrapperBlockContainer,
  WrapperBlockEditButton,
  WrapperBlockLabel,
  WrapperBlockRemoveButton,
} from '@payloadcms/richtext-lexical/client'
import React from 'react'

export const BlockComponent: React.FC = () => {
  return (
    <WrapperBlockContainer>
      <p>Test</p>
      <WrapperBlockEditButton />
      <WrapperBlockLabel />
      <WrapperBlockRemoveButton />
    </WrapperBlockContainer>
  )
}
