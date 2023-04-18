import { Config as GeneratedTypes } from 'payload/generated-types';
import { Payload } from '../../../payload';
export type Options<T extends keyof GeneratedTypes['collections']> = {
    token: string;
    collection: T;
};
declare function localVerifyEmail<T extends keyof GeneratedTypes['collections']>(payload: Payload, options: Options<T>): Promise<boolean>;
export default localVerifyEmail;
