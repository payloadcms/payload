import type { PayloadRequest } from '../../express/types';
import type { Permissions } from '../types';
type Arguments = {
    req: PayloadRequest;
};
declare function accessOperation(args: Arguments): Promise<Permissions>;
export default accessOperation;
