import { APIError } from './APIError.js'

/** A filename validation or collision error that upload processing must preserve. */
export class UploadFilenameError extends APIError {
  constructor({ message, status }: { message: string; status: 400 | 409 }) {
    super(message, status)
    this.name = 'UploadFilenameError'
  }
}
