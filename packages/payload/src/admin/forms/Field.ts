import type { User } from '../../auth/types.js'
import type { Locale } from '../../config/types.js'
import type { Validate } from '../../fields/config/types.js'
import type { DocumentPreferences } from '../../preferences/types.js'
import type { ErrorProps } from './Error.js'
import type { FieldDescriptionProps } from './FieldDescription.js'
import type { LabelProps } from './Label.js'

export type FormFieldBase = {
  readonly descriptionProps?: FieldDescriptionProps
  readonly docPreferences?: DocumentPreferences
  readonly errorProps?: ErrorProps
  readonly labelProps?: LabelProps
  readonly locale?: Locale
  readonly readOnly?: boolean
  readonly user?: User
  readonly validate?: Validate
}
