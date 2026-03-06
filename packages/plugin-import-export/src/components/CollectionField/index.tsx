'use client'
import type { TextFieldClientComponent } from 'payload'

import { CollectionSelectField } from '../CollectionSelectField/index.js'

export const CollectionField: TextFieldClientComponent = (props) => {
  return <CollectionSelectField textFieldProps={props} />
}
