import { Config as GeneratedTypes } from 'payload/generated-types';
import { DeepPartial } from 'ts-essentials';
import { Payload } from '../../../payload';
import { Document } from '../../../types';
export type Options<TSlug extends keyof GeneratedTypes['globals']> = {
    slug: TSlug;
    depth?: number;
    locale?: string;
    fallbackLocale?: string;
    data: DeepPartial<Omit<GeneratedTypes['globals'][TSlug], 'id'>>;
    user?: Document;
    overrideAccess?: boolean;
    showHiddenFields?: boolean;
    draft?: boolean;
};
export default function updateLocal<TSlug extends keyof GeneratedTypes['globals']>(payload: Payload, options: Options<TSlug>): Promise<GeneratedTypes['globals'][TSlug]>;
