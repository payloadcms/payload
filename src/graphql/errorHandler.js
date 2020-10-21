/**
 *
 * @param info
 * @param debug
 * @param afterErrorHook
 * @returns {Promise<unknown[]>}
 */
const errorHandler = async (info, debug, afterErrorHook) => Promise.all(info.result.errors.map(async (err) => {
  // TODO: use payload logging
  console.error(err.stack);

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

module.exports = errorHandler;
