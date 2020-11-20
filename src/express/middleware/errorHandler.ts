import httpStatus from 'http-status';
import formatErrorResponse from '../responses/formatError';
import logger from '../../utilities/logger';

logger();

const errorHandler = (config) => async (err, req, res, next) => {
  const data = formatErrorResponse(err);
  let response;
  let status = err.status || httpStatus.INTERNAL_SERVER_ERROR;

  logger.error(err.stack);

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

export default errorHandler;
