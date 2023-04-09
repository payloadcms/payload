import { Config as GeneratedTypes } from 'payload/generated-types';
import { PayloadRequest } from '../../../express/types';
import { Result } from '../forgotPassword';
import { Payload } from '../../../payload';
export type Options<T extends keyof GeneratedTypes['collections']> = {
    collection: T;
    data: {
        email: string;
    };
    expiration?: number;
    disableEmail?: boolean;
    req?: PayloadRequest;
};
declare function localForgotPassword<T extends keyof GeneratedTypes['collections']>(payload: Payload, options: Options<T>): Promise<Result>;
export default localForgotPassword;
