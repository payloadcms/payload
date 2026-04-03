import type { ErrorResult } from '../config/types.js'
import type { APIError } from '../errors/APIError.js'

import { APIError as APIErrorClass } from '../errors/APIError.js'
import { ValidationError as ValidationErrorClass } from '../errors/ValidationError.js'

export const formatErrors = (incoming: { [key: string]: unknown } | APIError): ErrorResult => {
  if (incoming) {
    // Use instanceof to check error type - this works because APIError and ValidationError
    // call Object.setPrototypeOf in their constructors to fix the instanceof issue
    // referenced in https://github.com/microsoft/TypeScript/issues/13965

    // Payload 'ValidationError' and 'APIError'
    if (
      (incoming instanceof ValidationErrorClass || incoming instanceof APIErrorClass) &&
      incoming.data
    ) {
      return {
        errors: [
          {
            name: incoming.name as string,
            data: incoming.data as Record<string, unknown>,
            message: incoming.message as string,
          },
        ],
      }
    }

    // Mongoose 'ValidationError': https://mongoosejs.com/docs/api/error.html#Error.ValidationError
    if (incoming instanceof ValidationErrorClass && 'errors' in incoming && incoming.errors) {
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
