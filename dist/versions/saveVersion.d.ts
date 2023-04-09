import { Payload } from '../payload';
import { SanitizedCollectionConfig, TypeWithID } from '../collections/config/types';
import { PayloadRequest } from '../express/types';
import { SanitizedGlobalConfig } from '../globals/config/types';
type Args = {
    payload: Payload;
    global?: SanitizedGlobalConfig;
    collection?: SanitizedCollectionConfig;
    req: PayloadRequest;
    docWithLocales: any;
    id?: string | number;
    autosave?: boolean;
    draft?: boolean;
};
export declare const saveVersion: ({ payload, collection, global, id, docWithLocales: doc, autosave, draft, }: Args) => Promise<TypeWithID>;
export {};
