import type { User } from '../../auth/types.js'
import type { Locale } from '../../config/types.js'
import type { Validate } from '../../fields/config/types.js'
import type { DocumentPreferences } from '../../preferences/types.js'

export type FormFieldBase = {
  readonly docPreferences?: DocumentPreferences
  /**
   * `forceRender` is added by RenderField automatically.
   */
  readonly forceRender?: boolean
  readonly locale?: Locale
  /**
   * `readOnly` is added by RenderField automatically. This should be used instead of `field.admin.readOnly`.
   */
  readonly readOnly?: boolean
  readonly user?: User
  readonly validate?: Validate
}
