import type { Response, NextFunction } from 'express';
import type { PayloadRequest } from '../types';
import { populateDefaultRequest } from '../defaultRequest';

function defaultPayload(req: PayloadRequest, res: Response, next: NextFunction) {
  populateDefaultRequest(req);
  next();
}

export default defaultPayload;
