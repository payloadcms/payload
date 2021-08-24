import { NextFunction, Response } from 'express';
import { PayloadRequest } from '../express/types';

const bindCollectionMiddleware = (collection: string) => (req: PayloadRequest, res: Response, next: NextFunction) => {
  req.collection = collection;
  next();
};

export default bindCollectionMiddleware;
