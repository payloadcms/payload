import type { Field } from '../fields/config/types.js'

import { fieldAffectsData } from '../fields/config/types.js'
import { APIError } from './APIError.js'

export class MissingEditorProp extends APIError {
  constructor(field: Field) {
    super(
      `RichText field${fieldAffectsData(field) ? ` "${field.name}"` : ''} is missing the editor prop. For sub-richText fields, the editor props is required, as it would otherwise create infinite recursion.`,
    )

    // Ensure error name is not lost during swc minification when running next build
    this.name = 'MissingEditorProp'
    Object.defineProperty(this.constructor, 'name', { value: 'MissingEditorProp' })
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, MissingEditorProp.prototype)
  }
}
