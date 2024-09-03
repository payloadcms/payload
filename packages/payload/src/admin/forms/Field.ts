import type { MarkOptional } from 'ts-essentials'

import type { User } from '../../auth/types.js'
import type { Locale } from '../../config/types.js'
import type { ClientField, Validate } from '../../fields/config/types.js'
import type { DocumentPreferences } from '../../preferences/types.js'
import type { FieldDescriptionClientProps } from './Description.js'
import type { FieldErrorClientProps } from './Error.js'
import type { FieldLabelClientProps } from './Label.js'

export type FormFieldBase<
  TFieldClient extends MarkOptional<ClientField, 'type'> = MarkOptional<ClientField, 'type'>,
> = {
  readonly descriptionProps?: FieldDescriptionClientProps<TFieldClient>
  readonly docPreferences?: DocumentPreferences
  readonly errorProps?: FieldErrorClientProps<TFieldClient>
  readonly field: TFieldClient
  /**
   * `forceRender` is added by RenderField automatically.
   */
  readonly forceRender?: boolean
  readonly labelProps?: FieldLabelClientProps<TFieldClient>
  readonly locale?: Locale
  /**
   * `readOnly` is added by RenderField automatically. This should be used instead of `field.admin.readOnly`.
   */
  readonly readOnly?: boolean
  readonly user?: User
  readonly validate?: Validate
}
