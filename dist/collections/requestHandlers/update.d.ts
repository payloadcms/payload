import { Response, NextFunction } from 'express';
import { Document } from '../../types';
import { PayloadRequest } from '../../express/types';
export type UpdateResult = {
    message: string;
    doc: Document;
};
export default function updateHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<UpdateResult> | void>;
