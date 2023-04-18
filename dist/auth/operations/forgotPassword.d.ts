import { PayloadRequest } from '../../express/types';
import { Collection } from '../../collections/config/types';
export type Arguments = {
    collection: Collection;
    data: {
        email: string;
        [key: string]: unknown;
    };
    disableEmail?: boolean;
    expiration?: number;
    req: PayloadRequest;
};
export type Result = string;
declare function forgotPassword(incomingArgs: Arguments): Promise<string | null>;
export default forgotPassword;
