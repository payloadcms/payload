'use client'
import type { TextFieldClientComponent } from 'payload'

import { CollectionSelectField } from '../CollectionSelectField/index.js'

export const ImportCollectionField: TextFieldClientComponent = (props) => {
  return <CollectionSelectField textFieldProps={props} />
}
