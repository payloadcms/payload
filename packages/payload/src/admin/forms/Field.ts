import type React from 'react'

import type { User } from '../../auth/types.js'
import type { Locale, StaticLabel } from '../../config/types.js'
import type { FieldTypes, Validate } from '../../fields/config/types.js'
import type { DocumentPreferences } from '../../preferences/types.js'
import type { MappedComponent, StaticDescription } from '../types.js'

export type FormFieldBase = {
  readonly Description?: MappedComponent
  readonly Error?: MappedComponent
  readonly Label?: MappedComponent
  readonly afterInput?: MappedComponent[]
  readonly beforeInput?: MappedComponent[]
  readonly className?: string
  readonly custom?: Record<string, any>
  readonly description?: StaticDescription
  readonly docPreferences?: DocumentPreferences
  readonly label?: StaticLabel
  readonly locale?: Locale
  readonly path?: string
  readonly placeholder?: string
  readonly readOnly?: boolean
  readonly required?: boolean
  readonly rtl?: boolean
  readonly style?: React.CSSProperties
  readonly user?: User
  readonly validate?: Validate
}

export type FieldProps<T extends FieldTypes = FieldTypes> = {
  readonly type: T
} & FormFieldBase
// & ClientFieldConfig TODO: this is a circular reference
