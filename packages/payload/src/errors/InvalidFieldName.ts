import { APIError } from './APIError.js'

export class InvalidFieldName extends APIError {
  constructor(fieldPath: string, fieldName: string) {
    super(
      `Field at path ${fieldPath} has invalid name '${fieldName}'. Field names can not include periods (.) and must be alphanumeric.`,
    )
  }
}
