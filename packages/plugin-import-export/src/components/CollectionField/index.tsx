'use client'
import type { TextFieldClientProps } from 'payload'
import type React from 'react'

import { CollectionSelectField } from '../CollectionSelectField/index.js'

export const CollectionField: React.FC<TextFieldClientProps> = (props) => {
  return <CollectionSelectField textFieldProps={props} />
}
