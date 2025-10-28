import type { ErrorResult } from '../config/types.js'

import { APIError } from '../errors/APIError.js'
import { ValidationError } from '../errors/ValidationError.js'

export const formatErrors = (incoming: unknown): ErrorResult => {
  if (incoming) {
    // Payload 'ValidationError' and 'APIError'
    if ((incoming instanceof ValidationError || incoming instanceof APIError) && incoming.data) {
      return {
        errors: [
          {
            name: incoming.name,
            data: incoming.data,
            message: incoming.message,
          },
        ],
      }
    }

    // Mongoose 'ValidationError': https://mongoosejs.com/docs/api/error.html#Error.ValidationError
    if (
      typeof incoming === 'object' &&
      incoming !== null &&
      !(incoming instanceof APIError || incoming instanceof Error) &&
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

    if (
      typeof incoming === 'object' &&
      incoming !== null &&
      'message' in incoming &&
      Array.isArray(incoming.message)
    ) {
      return {
        errors: incoming.message,
      }
    }

    if (typeof incoming === 'object' && incoming !== null && 'name' in incoming) {
      return {
        errors: [
          {
            message: (incoming as any).message,
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
