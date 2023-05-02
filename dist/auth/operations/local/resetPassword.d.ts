import { Config as GeneratedTypes } from 'payload/generated-types';
import { Payload } from '../../../payload';
import { Result } from '../resetPassword';
import { PayloadRequest } from '../../../express/types';
export type Options<T extends keyof GeneratedTypes['collections']> = {
    collection: T;
    data: {
        token: string;
        password: string;
    };
    overrideAccess: boolean;
    req?: PayloadRequest;
};
declare function localResetPassword<T extends keyof GeneratedTypes['collections']>(payload: Payload, options: Options<T>): Promise<Result>;
export default localResetPassword;
