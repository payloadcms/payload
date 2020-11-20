import utilities from '../utilities/logger';

const logger = utilities();

/**
 *
 * @param info
 * @param debug
 * @param afterErrorHook
 * @returns {Promise<unknown[]>}
 */
const errorHandler = async (info, debug, afterErrorHook) => Promise.all(info.result.errors.map(async (err) => {
  logger.error(err.stack);

  let response = {
    message: err.message,
    data: (err && err.originalError && err.originalError.data) || undefined,
  };

  if (afterErrorHook) {
    ({ response } = await afterErrorHook(err, response) || { response });
  }

  if (debug && debug === true) {
    response.stack = err.stack;
  }

  return response;
}));

export default errorHandler;
