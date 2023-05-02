import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../../express/types';
import { Document } from '../../types';
export type CreateResult = {
    message: string;
    doc: Document;
};
export default function createHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<CreateResult> | void>;
