import { Payload } from '../..';
import { SanitizedCollectionConfig } from '../../collections/config/types';
import { PayloadRequest } from '../../express/types';
type Args = {
    payload: Payload;
    config?: SanitizedCollectionConfig;
    req: PayloadRequest;
    data: any;
    id: string | number;
    autosave: boolean;
};
export declare const saveCollectionDraft: ({ payload, config, id, data, autosave, }: Args) => Promise<Record<string, unknown>>;
export {};
