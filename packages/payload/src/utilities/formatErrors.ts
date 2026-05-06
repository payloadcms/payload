import type { ErrorResult } from '../config/types.js'

import { APIError } from '../errors/APIError.js'
import { ValidationError } from '../errors/ValidationError.js'

export const formatErrors = (incoming: { [key: string]: unknown } | APIError): ErrorResult => {
  if (incoming) {
    // Payload 'ValidationError' and 'APIError'
    // Use duck-typing fallback alongside instanceof to handle bundlers (e.g. Vite)
    // that may load duplicate module instances, causing instanceof to fail.
    if (
      (incoming instanceof ValidationError ||
        incoming instanceof APIError ||
        ('isOperational' in incoming && incoming.isOperational === true)) &&
      incoming.data
    ) {
      return {
        errors: [
          {
            name: incoming.name as string | undefined,
            data: incoming.data as Record<string, unknown>,
            message: incoming.message as string | undefined,
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
