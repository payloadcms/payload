import type React from 'react'

import type { User } from '../../auth/types.js'
import type { LabelStatic, Locale } from '../../config/types.js'
import type { Validate } from '../../fields/config/types.js'
import type { DocumentPreferences } from '../../preferences/types.js'
import type { MappedComponent } from '../types.js'
import type { ErrorProps } from './Error.js'
import type { FieldDescriptionProps } from './FieldDescription.js'
import type { SanitizedLabelProps } from './Label.js'

export type FormFieldBase = {
  AfterInput?: MappedComponent[]
  BeforeInput?: MappedComponent[]
  CustomDescription?: MappedComponent
  CustomError?: MappedComponent
  CustomLabel?: MappedComponent
  Filter?: MappedComponent
  className?: string
  custom?: Record<string, any>
  descriptionProps?: Omit<FieldDescriptionProps, 'type'>
  disabled?: boolean
  docPreferences?: DocumentPreferences
  errorProps?: Omit<ErrorProps, 'type'>
  label?: LabelStatic | false
  labelProps?: SanitizedLabelProps
  locale?: Locale
  localized?: boolean
  path?: string
  readOnly?: boolean
  required?: boolean
  rtl?: boolean
  style?: React.CSSProperties
  user?: User
  validate?: Validate
}
