import { PayloadRequest } from '../../../express/types';
export type AdminInitEvent = {
    type: 'admin-init';
    domainID?: string;
    userID?: string;
};
export declare const adminInit: (req: PayloadRequest) => void;
