import { Response } from 'express';
import { Collection } from '../../collections/config/types';
import { Document } from '../../types';
import { PayloadRequest } from '../../express/types';
export type Result = {
    exp: number;
    user: Document;
    refreshedToken: string;
};
export type Arguments = {
    collection: Collection;
    token: string;
    req: PayloadRequest;
    res?: Response;
};
declare function refresh(incomingArgs: Arguments): Promise<Result>;
export default refresh;
