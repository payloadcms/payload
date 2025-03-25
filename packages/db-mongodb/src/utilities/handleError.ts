import type { PayloadRequest } from 'payload'

import { ValidationError } from 'payload'

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

  // Handle uniqueness error from MongoDB
  if (
    'code' in error &&
    error.code === 11000 &&
    'keyValue' in error &&
    error.keyValue &&
    typeof error.keyValue === 'object'
  ) {
    throw new ValidationError(
      {
        collection,
        errors: [
          {
            message: req?.t ? req.t('error:valueMustBeUnique') : 'Value must be unique',
            path: Object.keys(error.keyValue)[0] ?? '',
          },
        ],
        global,
      },
      req?.t,
    )
  }

  // eslint-disable-next-line @typescript-eslint/only-throw-error
  throw error
}
