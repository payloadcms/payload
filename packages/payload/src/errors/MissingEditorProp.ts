import { APIError } from './APIError.js'

export class MissingEditorProp extends APIError {
  constructor(fieldPath: string) {
    super(
      `RichText field with path ${fieldPath} is missing the editor prop. For sub-richText fields, the editor props is required, as it would otherwise create infinite recursion.`,
    )
  }
}
