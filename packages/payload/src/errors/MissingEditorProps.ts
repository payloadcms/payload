import type { Field } from '../fields/config/types'

import { fieldAffectsData } from '../fields/config/types'
import APIError from './APIError'

class MissingEditorProp extends APIError {
  constructor(field: Field) {
    super(
      `RichText field${
        fieldAffectsData(field) ? ` "${field.name}"` : ''
      } is missing the editor prop`,
    )
  }
}

export default MissingEditorProp
