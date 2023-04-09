import { Config as GeneratedTypes } from 'payload/generated-types';
import { Payload } from '../../../payload';
import { Document } from '../../../types';
export type Options<T extends keyof GeneratedTypes['collections']> = {
    collection: T;
    id: string;
    depth?: number;
    locale?: string;
    fallbackLocale?: string;
    user?: Document;
    overrideAccess?: boolean;
    showHiddenFields?: boolean;
};
export default function restoreVersionLocal<T extends keyof GeneratedTypes['collections']>(payload: Payload, options: Options<T>): Promise<GeneratedTypes['collections'][T]>;
