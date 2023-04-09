import { Response } from 'express';
import { Collection } from '../../collections/config/types';
import { PayloadRequest } from '../../express/types';
export type Result = {
    token: string;
    user: Record<string, unknown>;
};
export type Arguments = {
    data: {
        token: string;
        password: string;
    };
    collection: Collection;
    req: PayloadRequest;
    overrideAccess?: boolean;
    res?: Response;
};
declare function resetPassword(args: Arguments): Promise<Result>;
export default resetPassword;
