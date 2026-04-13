import type { ErrorResult } from '../config/types.js'

import { APIError } from '../errors/APIError.js'
import { ValidationError } from '../errors/ValidationError.js'

export const formatErrors = (incoming: { [key: string]: unknown } | APIError): ErrorResult => {
  if (incoming) {
    // Payload 'ValidationError' and 'APIError'
    if ((incoming instanceof ValidationError || incoming instanceof APIError) && incoming.data) {
      return {
        errors: [
          {
            name: incoming.name,
            data: incoming.data as Record<string, unknown>,
            message: incoming.message,
          },
        ],
      }
    }

    // Mongoose 'ValidationError': https://mongoosejs.com/docs/api/error.html#Error.ValidationError
    if (
      'name' in incoming &&
      incoming.name === 'ValidationError' &&
      'errors' in incoming &&
      incoming.errors
    ) {
      return {
        errors: Object.keys(incoming.errors).reduce(
          (acc, key) => {
            acc.push({
              field: (incoming.errors as any)[key].path,
              message: (incoming.errors as any)[key].message,
            })
            return acc
          },
          [] as { field: string; message: string }[],
        ),
      }
    }

    if (Array.isArray(incoming.message)) {
      return {
        errors: incoming.message,
      }
    }

    if (incoming.name) {
      return {
        errors: [
          {
            message: incoming.message as string,
          },
        ],
      }
    }
  }

  return {
    errors: [
      {
        message: 'An unknown error occurred.',
      },
    ],
  }
}
