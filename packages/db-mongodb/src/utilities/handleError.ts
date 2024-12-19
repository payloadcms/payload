import type { PayloadRequest } from 'payload'

import httpStatus from 'http-status'
import { APIError, ValidationError } from 'payload'

export const handleError = ({
  collection,
  error,
  global,
  req,
}: {
  collection?: string
  error: unknown
  global?: string
  req?: Partial<PayloadRequest>
}) => {
  if (!error || typeof error !== 'object') {
    throw error
  }

  const message = req?.t ? 'error:valueMustBeUnique' : 'Value must be unique'

  // Handle uniqueness error from MongoDB
  if ('code' in error && error.code === 11000 && 'keyValue' in error && error.keyValue) {
    throw new ValidationError(
      {
        collection,
        errors: [
          {
            message,
            path: Object.keys(error.keyValue)[0],
          },
        ],
        global,
      },
      req?.t,
    )
  }

  throw new APIError(message, httpStatus.BAD_REQUEST)
}
