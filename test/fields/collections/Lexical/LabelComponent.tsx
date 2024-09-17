'use client'

import type { Block, PayloadClientReactComponent } from 'payload'

import React from 'react'

export const LabelComponent: PayloadClientReactComponent<Block['admin']['components']['Label']> = (
  props,
) => {
  const { formData } = props
  return <div>{formData?.key}</div>
}
