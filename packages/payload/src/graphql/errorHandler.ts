import { GraphQLFormattedError } from 'graphql';
import httpStatus from 'http-status';
import { AfterErrorHook } from '../collections/config/types.js';
import { Payload } from '../payload.js';

const errorHandler = async (
  payload: Payload,
  err: any,
  debug: boolean,
  afterErrorHook: AfterErrorHook,
): Promise<GraphQLFormattedError> => {
  const status = err.originalError.status || httpStatus.INTERNAL_SERVER_ERROR;
  let errorMessage = err.message;

  payload.logger.error(err.stack);

  // Internal server errors can contain anything, including potentially sensitive data.
  // Therefore, error details will be hidden from the response unless `config.debug` is `true`
  if (!debug && status === httpStatus.INTERNAL_SERVER_ERROR) {
    errorMessage = 'Something went wrong.';
  }

  let response: GraphQLFormattedError = {
    message: errorMessage,
    locations: err.locations,
    path: err.path,
    extensions: {
      statusCode: status,
      name: err?.originalError?.name || undefined,
      data: (err && err.originalError && err.originalError.data) || undefined,
      stack: debug ? err.stack : undefined,
    },
  };

  if (afterErrorHook) {
    ({ response } = await afterErrorHook(err, response, null) || { response });
  }

  return response;
};

export default errorHandler;
