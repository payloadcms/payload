import { NextFunction, Request, Response } from 'express';

const bindCollectionMiddleware = (collection: string) => (req: Request & { collection: string }, res: Response, next: NextFunction) => {
  req.collection = collection;
  next();
};

export default bindCollectionMiddleware;
