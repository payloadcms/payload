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
  readonly AfterInput?: MappedComponent[]
  readonly BeforeInput?: MappedComponent[]
  readonly CustomDescription?: MappedComponent
  readonly CustomError?: MappedComponent
  readonly CustomLabel?: MappedComponent
  readonly Filter?: MappedComponent
  readonly className?: string
  readonly custom?: Record<string, any>
  readonly descriptionProps?: Omit<FieldDescriptionProps, 'type'>
  readonly disabled?: boolean
  readonly docPreferences?: DocumentPreferences
  readonly errorProps?: Omit<ErrorProps, 'type'>
  readonly label?: LabelStatic | false
  readonly labelProps?: SanitizedLabelProps
  readonly locale?: Locale
  readonly localized?: boolean
  readonly path?: string
  readonly readOnly?: boolean
  readonly required?: boolean
  readonly rtl?: boolean
  readonly style?: React.CSSProperties
  readonly user?: User
  readonly validate?: Validate
}
