import APIError from '../../errors/APIError'

export type ErrorResponse = { data?: any; errors: unknown[]; stack?: string }

const formatErrorResponse = (
  incoming: { [key: string]: unknown } | APIError | Error,
): ErrorResponse => {
  if (incoming) {
    if (incoming instanceof APIError && incoming.data) {
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

    // mongoose
    if (!(incoming instanceof APIError || incoming instanceof Error) && incoming.errors) {
      return {
        errors: Object.keys(incoming.errors).reduce((acc, key) => {
          acc.push({
            field: incoming.errors[key].path,
            message: incoming.errors[key].message,
          })
          return acc
        }, []),
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
            message: incoming.message,
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

export default formatErrorResponse
