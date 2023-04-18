import { Config as GeneratedTypes } from 'payload/generated-types';
import { PayloadRequest } from '../../express/types';
import { Collection } from '../config/types';
import { Document } from '../../types';
export type Arguments = {
    depth?: number;
    collection: Collection;
    id: string | number;
    req: PayloadRequest;
    overrideAccess?: boolean;
    showHiddenFields?: boolean;
};
declare function deleteByID<TSlug extends keyof GeneratedTypes['collections']>(incomingArgs: Arguments): Promise<Document>;
export default deleteByID;
