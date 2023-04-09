/// <reference types="qs" />
import { NextFunction, Request, Response } from 'express';
import { Collection } from './config/types';
declare const bindCollectionMiddleware: (collection: Collection) => (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>> & {
    collection: Collection;
}, res: Response, next: NextFunction) => void;
export default bindCollectionMiddleware;
