const logger = require('../utilities/logger')();

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
    data: err?.originalError?.data,
  };

  if (afterErrorHook) {
    ({ response } = await afterErrorHook(err, response) || { response });
  }

  if (debug && debug === true) {
    response.stack = err.stack;
  }

  return response;
}));

module.exports = errorHandler;
