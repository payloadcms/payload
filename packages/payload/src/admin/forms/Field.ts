import type { User } from '../../auth/types.js'
import type { Locale } from '../../config/types.js'
import type { ClientField, Validate } from '../../fields/config/types.js'
import type { DocumentPreferences } from '../../preferences/types.js'
import type { FieldErrorProps } from './Error.js'
import type { FieldDescriptionProps } from './FieldDescription.js'
import type { FieldLabelProps } from './Label.js'

export type FormFieldBase<T extends ClientField = ClientField> = {
  readonly descriptionProps?: FieldDescriptionProps<T>
  readonly docPreferences?: DocumentPreferences
  readonly errorProps?: FieldErrorProps<T>
  readonly field: T
  /**
   * `forceRender` is added by RenderField automatically.
   */
  readonly forceRender?: boolean
  readonly labelProps?: FieldLabelProps<T>
  readonly locale?: Locale
  /**
   * `readOnly` is added by RenderField automatically. This should be used instead of `field.admin.readOnly`.
   */
  readonly readOnly?: boolean
  readonly user?: User
  readonly validate?: Validate
}
