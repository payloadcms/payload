import { Response } from 'express';
import { Config as GeneratedTypes } from 'payload/generated-types';
import { Result } from '../login';
import { PayloadRequest } from '../../../express/types';
import { Payload } from '../../../payload';
export type Options<TSlug extends keyof GeneratedTypes['collections']> = {
    collection: TSlug;
    data: {
        email: string;
        password: string;
    };
    req?: PayloadRequest;
    res?: Response;
    depth?: number;
    locale?: string;
    fallbackLocale?: string;
    overrideAccess?: boolean;
    showHiddenFields?: boolean;
};
declare function localLogin<TSlug extends keyof GeneratedTypes['collections']>(payload: Payload, options: Options<TSlug>): Promise<Result & {
    user: GeneratedTypes['collections'][TSlug];
}>;
export default localLogin;
