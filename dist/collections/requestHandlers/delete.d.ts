import { Response, NextFunction } from 'express';
import { PayloadRequest } from '../../express/types';
import { Document } from '../../types';
export type DeleteResult = {
    message: string;
    doc: Document;
};
export default function deleteHandler(req: PayloadRequest, res: Response, next: NextFunction): Promise<Response<DeleteResult> | void>;
