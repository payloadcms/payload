const httpStatus = require('http-status');
const formatErrorResponse = require('../responses/formatError');

const errorHandler = config => async (err, req, res, next) => {
  let response;
  const data = formatErrorResponse(err);
  let status = err.status || httpStatus.INTERNAL_SERVER_ERROR;

  // TODO: use payload logging
  console.error(err.stack);

  if (config.debug && config.debug === true) {
    data.stack = err.stack;
  }
  response = {
    ...data,
  };

  if (req.collection && typeof req.collection.config.hooks.afterError === 'function') {
    ({ response, status } = await req.collection.config.hooks.afterError(err, response) || { response, status });
  }
  if (typeof config.hooks.afterError === 'function') {
    ({ response, status } = await config.hooks.afterError(err, response) || { response, status });
  }

  res.status(status)
    .send(response);
};

module.exports = errorHandler;
