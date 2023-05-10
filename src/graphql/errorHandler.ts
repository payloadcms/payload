import { GraphQLFormattedError } from 'graphql';
import { AfterErrorHook } from '../collections/config/types';
import { Payload } from '../payload';

const errorHandler = async (
  payload: Payload,
  err: any,
  debug: boolean,
  afterErrorHook: AfterErrorHook,
): Promise<GraphQLFormattedError> => {
  payload.logger.error(err.stack);

  let response: GraphQLFormattedError = {
    message: err.message,
    locations: err.locations,
    path: err.path,
    extensions: {
      name: err?.originalError?.name || undefined,
      data: (err && err.originalError && err.originalError.data) || undefined,
      stack: debug ? err.stack : undefined,
    },
  };

  if (afterErrorHook) {
    ({ response } = await afterErrorHook(err, response) || { response });
  }

  return response;
};

export default errorHandler;
