/* eslint-disable @typescript-eslint/no-unused-vars */
import httpStatus from 'http-status';
import { Response, NextFunction } from 'express';
import { Logger } from 'pino';
import { Config } from '../../config/types';
import formatErrorResponse, { ErrorResponse } from '../responses/formatError';
import { PayloadRequest } from '../types/payloadRequest';
import APIError from '../../errors/APIError';

export type ErrorHandler = (err: Error, req: PayloadRequest, res: Response, next: NextFunction) => Promise<Response<ErrorResponse>>

// NextFunction must be passed for Express to use this middleware as error handler
const errorHandler = (config: Config, logger: Logger) => async (err: APIError, req: PayloadRequest, res: Response, next: NextFunction): Promise<void> => {
  const errorResponse = formatErrorResponse(err);
  let response;
  let status = err.status || httpStatus.INTERNAL_SERVER_ERROR;

  logger.error(err.stack);

  if (config.debug && config.debug === true) {
    errorResponse.stack = err.stack;
  }

  if (typeof config.hooks.afterError === 'function') {
    ({ response, status } = await config.hooks.afterError(err, response) || { response, status });
  }

  res.status(status).send(response);
};

export default errorHandler;
