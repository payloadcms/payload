import httpStatus from 'http-status';
import { NextFunction, Response } from 'express';
import { Logger } from 'pino';
import { SanitizedConfig } from '../../config/types';
import formatErrorResponse, { ErrorResponse } from '../responses/formatError';
import { PayloadRequest } from '../types';
import APIError from '../../errors/APIError';

export type ErrorHandler = (error: APIError, req: PayloadRequest, res: Response, next: NextFunction) => Promise<Response<ErrorResponse> | void>

// NextFunction must be passed for Express to use this middleware as error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler = (config: SanitizedConfig, logger: Logger) => async (error: APIError, req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<ErrorResponse> | void> => {
  let response = formatErrorResponse(error);
  let status = error.status || httpStatus.INTERNAL_SERVER_ERROR;

  logger.error(error.stack);

  if (config.debug && config.debug === true) {
    response.stack = error.stack;
  }

  await config.hooks.afterError.reduce(async (priorHook, hook) => {
    await priorHook;
    try {
      ({ response, status } = (await hook({ status, error, response, req }) || { response, status }) as { response: ErrorResponse, status: number});
    } catch (hookError) {
      logger.error(hookError.stack);
    }
  }, Promise.resolve());

  res.status(status).send(response);
};

export default errorHandler;
