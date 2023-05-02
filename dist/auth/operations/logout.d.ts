import { Response } from 'express';
import { PayloadRequest } from '../../express/types';
import { Collection } from '../../collections/config/types';
export type Arguments = {
    req: PayloadRequest;
    res: Response;
    collection: Collection;
};
declare function logout(incomingArgs: Arguments): Promise<string>;
export default logout;
