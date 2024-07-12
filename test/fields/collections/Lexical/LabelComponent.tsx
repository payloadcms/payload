'use client'

import type { Block } from 'payload'

import React from 'react'

export const LabelComponent: Block['admin']['components']['Label'] = (props) => {
  const { formData } = props
  return <div>{formData?.key}</div>
}
