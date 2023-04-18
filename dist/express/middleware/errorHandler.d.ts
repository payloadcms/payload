import { NextFunction, Response } from 'express';
import { Logger } from 'pino';
import { SanitizedConfig } from '../../config/types';
import { ErrorResponse } from '../responses/formatError';
import { PayloadRequest } from '../types';
import APIError from '../../errors/APIError';
export type ErrorHandler = (err: APIError, req: PayloadRequest, res: Response, next: NextFunction) => Promise<Response<ErrorResponse> | void>;
declare const errorHandler: (config: SanitizedConfig, logger: Logger) => (err: APIError, req: PayloadRequest, res: Response, next: NextFunction) => Promise<Response<ErrorResponse> | void>;
export default errorHandler;
