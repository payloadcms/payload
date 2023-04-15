import { Payload } from '..';
import { SanitizedCollectionConfig } from '../collections/config/types';
import { PayloadRequest } from '../express/types';
type Args = {
    payload: Payload;
    config?: SanitizedCollectionConfig;
    req: PayloadRequest;
    docWithLocales: any;
    id: string | number;
};
export declare const saveCollectionVersion: ({ payload, config, req, id, docWithLocales, }: Args) => Promise<void>;
export {};
