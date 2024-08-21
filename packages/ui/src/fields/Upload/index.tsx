'use client'

import type { UploadFieldProps } from 'payload'

import React from 'react'

import type { UploadInputProps } from './HasOne/Input.js'

import { withCondition } from '../../forms/withCondition/index.js'
import { UploadComponentHasMany } from './HasMany/index.js'
import { UploadInputHasOne } from './HasOne/Input.js'
import { UploadComponentHasOne } from './HasOne/index.js'

export { UploadFieldProps, UploadInputHasOne as UploadInput }
export type { UploadInputProps }

export const baseClass = 'upload'

const UploadComponent: React.FC<UploadFieldProps> = (props) => {
  const {
    field: { hasMany },
  } = props

  if (hasMany) {
    return <UploadComponentHasMany {...props} />
  }

  return <UploadComponentHasOne {...props} />
}

export const UploadField = withCondition(UploadComponent)
