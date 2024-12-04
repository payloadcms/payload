'use client'

import type { Block, PayloadClientReactComponent } from 'payload'

import React from 'react'

export const LabelComponent: PayloadClientReactComponent<Block['admin']['components']['Label']> = (
  props,
) => {
  console.log('!! props', props)
  const { formData } = props
  return <div>Hello world --{formData?.key}</div>
}
