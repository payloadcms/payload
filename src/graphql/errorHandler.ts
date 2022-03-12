import { GraphQLFormattedError } from 'graphql';
import utilities from '../utilities/logger';

const logger = utilities();

/**
 *
 * @param info
 * @param debug
 * @param afterErrorHook
 * @returns {Promise<unknown[]>}
 */
const errorHandler = async (info, debug: boolean, afterErrorHook): Promise<GraphQLFormattedError[]> => Promise.all(info.result.errors.map(async (err) => {
  logger.error(err.stack);

  let response = {
    message: err.message,
    data: (err && err.originalError && err.originalError.data) || undefined,
    path: err.path,
    stack: debug ? err.stack : undefined,
  };

  if (afterErrorHook) {
    ({ response } = await afterErrorHook(err, response) || { response });
  }

  return response;
}));

export default errorHandler;
