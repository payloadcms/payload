import { Config as GeneratedTypes } from 'payload/generated-types';
import { Payload } from '../../../payload';
import { Document } from '../../../types';
import { PayloadRequest } from '../../../express/types';
import { TypeWithVersion } from '../../../versions/types';
export type Options<T extends keyof GeneratedTypes['collections']> = {
    collection: T;
    id: string;
    depth?: number;
    locale?: string;
    fallbackLocale?: string;
    user?: Document;
    overrideAccess?: boolean;
    showHiddenFields?: boolean;
    disableErrors?: boolean;
    req?: PayloadRequest;
};
export default function findVersionByIDLocal<T extends keyof GeneratedTypes['collections']>(payload: Payload, options: Options<T>): Promise<TypeWithVersion<GeneratedTypes['collections'][T]>>;
