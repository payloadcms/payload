import { Config as GeneratedTypes } from 'payload/generated-types';
import { PayloadRequest } from '../../express/types';
import { Collection } from '../config/types';
import { Where } from '../../types';
export type Arguments = {
    depth?: number;
    collection: Collection;
    where: Where;
    req: PayloadRequest;
    overrideAccess?: boolean;
    showHiddenFields?: boolean;
};
declare function deleteOperation<TSlug extends keyof GeneratedTypes['collections']>(incomingArgs: Arguments): Promise<{
    docs: GeneratedTypes['collections'][TSlug][];
    errors: {
        message: string;
        id: GeneratedTypes['collections'][TSlug]['id'];
    }[];
}>;
export default deleteOperation;
