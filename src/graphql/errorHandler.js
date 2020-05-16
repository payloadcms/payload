const httpStatus = require('http-status');

const errorHandler = async (err, info, debug, afterErrorHook) => {
  let { status } = info.context.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  let response = {
    ...err,
  };

  // TODO: use payload logging
  console.error(err.stack);

  if (afterErrorHook) {
    ({ response, status } = await afterErrorHook(err, response) || { response, status });
  }

  if (debug && debug === true) {
    response.stack = err.stack;
  }

  // TODO: how to handle collection level hooks for graphQL?
  // if (req.collection && typeof req.collection.config.hooks.afterError === 'function') {
  //   ({ response, status } = await req.collection.config.hooks.afterError(err, response) || { response, status });
  // }

  return response;
};

module.exports = errorHandler;
