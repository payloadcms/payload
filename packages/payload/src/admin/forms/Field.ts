import type { User } from '../../auth/types.js'
import type { Locale } from '../../config/types.js'
import type { Validate } from '../../fields/config/types.js'
import type { DocumentPreferences } from '../../preferences/types.js'
import type { ErrorProps } from './Error.js'
import type { FieldDescriptionProps } from './FieldDescription.js'
import type { LabelProps } from './Label.js'

// TODO: Check if we still need this. Shouldnt most of it be present in the field type?
export type FormFieldBase = {
  readonly descriptionProps?: FieldDescriptionProps
  readonly docPreferences?: DocumentPreferences
  readonly errorProps?: ErrorProps
  /**
   * forceRender is added by RenderField automatically
   */
  readonly forceRender?: boolean
  readonly labelProps?: LabelProps
  readonly locale?: Locale
  readonly user?: User
  readonly validate?: Validate
}
