import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../types';

function defaultPayload(req: PayloadRequest, res: Response, next: NextFunction) {
  req.payloadContext = req.payloadContext || {};
  next();
}

export default defaultPayload;
