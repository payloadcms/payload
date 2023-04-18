import { Config as GeneratedTypes } from 'payload/generated-types';
import { Payload } from '../../../payload';
import { Document } from '../../../types';
export type Options<T extends keyof GeneratedTypes['globals']> = {
    slug: string;
    id: string;
    depth?: number;
    locale?: string;
    fallbackLocale?: string;
    user?: Document;
    overrideAccess?: boolean;
    showHiddenFields?: boolean;
};
export default function restoreVersionLocal<T extends keyof GeneratedTypes['globals']>(payload: Payload, options: Options<T>): Promise<GeneratedTypes['globals'][T]>;
