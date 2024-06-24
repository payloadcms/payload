import httpStatus from 'http-status'
import { APIError, ValidationError } from 'payload/errors'

const handleError = (error, req) => {
  // Handle uniqueness error from MongoDB
  if (error.code === 11000 && error.keyValue) {
    throw new ValidationError(
      [
        {
          field: Object.keys(error.keyValue)[0],
          message: req.t('error:valueMustBeUnique'),
        },
      ],
      req.t,
    )
  } else if (error.code === 11000) {
    throw new APIError(req.t('error:valueMustBeUnique'), httpStatus.BAD_REQUEST)
  } else {
    throw error
  }
}

export default handleError
