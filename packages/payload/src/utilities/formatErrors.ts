import type { ErrorResult } from '../config/types.js'
import type { APIError } from '../errors/APIError.js'

import { APIErrorName } from '../errors/APIError.js'
import { ValidationErrorName } from '../errors/ValidationError.js'

export const formatErrors = (incoming: { [key: string]: unknown } | APIError): ErrorResult => {
  if (incoming) {
    // Cannot use `instanceof` to check error type: https://github.com/microsoft/TypeScript/issues/13965
    // Instead, get the prototype of the incoming error and check its constructor name
    const proto = Object.getPrototypeOf(incoming)

    // Payload 'ValidationError' and 'APIError'
    if (
      (proto.constructor.name === ValidationErrorName || proto.constructor.name === APIErrorName) &&
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
    if (proto.constructor.name === ValidationErrorName && 'errors' in incoming && incoming.errors) {
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
