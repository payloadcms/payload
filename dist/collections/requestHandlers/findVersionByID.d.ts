import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../../express/types';
import { Document } from '../../types';
export type FindByIDResult = {
    message: string;
    doc: Document;
};
export default function findVersionByIDHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<FindByIDResult> | void>;
