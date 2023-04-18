import { CollectionModel } from '../../collections/config/types';
import { PayloadRequest } from '../../express/types';
declare function init(args: {
    Model: CollectionModel;
    req: PayloadRequest;
}): Promise<boolean>;
export default init;
