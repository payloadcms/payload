import { Collection } from '../../collections/config/types';
import { PayloadRequest } from '../../express/types';
export type Args = {
    collection: Collection;
    data: {
        email: string;
    };
    req: PayloadRequest;
    overrideAccess?: boolean;
};
declare function unlock(args: Args): Promise<boolean>;
export default unlock;
