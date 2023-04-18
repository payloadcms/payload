import { Config as GeneratedTypes } from 'payload/generated-types';
import { PayloadRequest } from '../../../express/types';
import { Payload } from '../../../payload';
export type Options<T extends keyof GeneratedTypes['collections']> = {
    collection: T;
    data: {
        email: any;
    };
    req?: PayloadRequest;
    overrideAccess: boolean;
};
declare function localUnlock<T extends keyof GeneratedTypes['collections']>(payload: Payload, options: Options<T>): Promise<boolean>;
export default localUnlock;
