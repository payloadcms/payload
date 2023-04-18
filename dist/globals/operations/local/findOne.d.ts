import { Config as GeneratedTypes } from 'payload/generated-types';
import { Payload } from '../../../payload';
import { Document } from '../../../types';
export type Options<T extends keyof GeneratedTypes['globals']> = {
    slug: T;
    depth?: number;
    locale?: string;
    fallbackLocale?: string;
    user?: Document;
    overrideAccess?: boolean;
    showHiddenFields?: boolean;
    draft?: boolean;
};
export default function findOneLocal<T extends keyof GeneratedTypes['globals']>(payload: Payload, options: Options<T>): Promise<GeneratedTypes['globals'][T]>;
