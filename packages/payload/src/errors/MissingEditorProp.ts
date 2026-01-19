import { APIError } from './APIError.js'

type MissingEditorPropArgs =
  | {
      fieldName: string
    }
  | {
      fieldPath: string
    }

export class MissingEditorProp extends APIError {
  constructor(args: MissingEditorPropArgs) {
    const nameOrPath = 'fieldName' in args ? `name ${args.fieldName}` : `path ${args.fieldPath}`
    super(
      `RichText field with ${nameOrPath} is missing the editor prop. For sub-richText fields, the editor props is required, as it would otherwise create infinite recursion.`,
    )
  }
}
