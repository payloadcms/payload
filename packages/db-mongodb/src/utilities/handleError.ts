import httpStatus from 'http-status'
import { APIError, ValidationError } from 'payload'

export const handleError = ({
  collection,
  error,
  global,
  req,
}: {
  collection?: string
  error
  global?: string
  req
}) => {
  // Handle uniqueness error from MongoDB
  if (error.code === 11000 && error.keyValue) {
    throw new ValidationError(
      {
        collection,
        errors: [
          {
            field: Object.keys(error.keyValue)[0],
            message: req.t('error:valueMustBeUnique'),
          },
        ],
        global,
      },
      req.t,
    )
  } else if (error.code === 11000) {
    throw new APIError(req.t('error:valueMustBeUnique'), httpStatus.BAD_REQUEST)
  } else {
    throw error
  }
}
