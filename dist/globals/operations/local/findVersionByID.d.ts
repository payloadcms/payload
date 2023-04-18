import { Config as GeneratedTypes } from 'payload/generated-types';
import { Payload } from '../../../payload';
import { Document } from '../../../types';
import { TypeWithVersion } from '../../../versions/types';
export type Options<T extends keyof GeneratedTypes['globals']> = {
    slug: T;
    id: string;
    depth?: number;
    locale?: string;
    fallbackLocale?: string;
    user?: Document;
    overrideAccess?: boolean;
    showHiddenFields?: boolean;
    disableErrors?: boolean;
};
export default function findVersionByIDLocal<T extends keyof GeneratedTypes['globals']>(payload: Payload, options: Options<T>): Promise<TypeWithVersion<GeneratedTypes['globals'][T]>>;
