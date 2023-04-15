import { Payload } from '..';
import { PayloadRequest } from '../express/types';
import { SanitizedGlobalConfig } from '../globals/config/types';
type Args = {
    payload: Payload;
    config?: SanitizedGlobalConfig;
    req: PayloadRequest;
    docWithLocales: any;
};
export declare const saveGlobalVersion: ({ payload, config, req, docWithLocales, }: Args) => Promise<void>;
export {};
