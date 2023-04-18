import { Config as GeneratedTypes } from 'payload/generated-types';
import { DeepPartial } from 'ts-essentials';
import { Payload } from '../../../payload';
import { Document, Where } from '../../../types';
import { File } from '../../../uploads/types';
import { BulkOperationResult } from '../../config/types';
export type BaseOptions<TSlug extends keyof GeneratedTypes['collections']> = {
    collection: TSlug;
    data: DeepPartial<GeneratedTypes['collections'][TSlug]>;
    depth?: number;
    locale?: string;
    fallbackLocale?: string;
    user?: Document;
    overrideAccess?: boolean;
    showHiddenFields?: boolean;
    filePath?: string;
    file?: File;
    overwriteExistingFiles?: boolean;
    draft?: boolean;
    autosave?: boolean;
};
export type ByIDOptions<TSlug extends keyof GeneratedTypes['collections']> = BaseOptions<TSlug> & {
    id: string | number;
    where?: never;
};
export type ManyOptions<TSlug extends keyof GeneratedTypes['collections']> = BaseOptions<TSlug> & {
    where: Where;
    id?: never;
};
export type Options<TSlug extends keyof GeneratedTypes['collections']> = ByIDOptions<TSlug> | ManyOptions<TSlug>;
declare function updateLocal<TSlug extends keyof GeneratedTypes['collections']>(payload: Payload, options: ByIDOptions<TSlug>): Promise<GeneratedTypes['collections'][TSlug]>;
declare function updateLocal<TSlug extends keyof GeneratedTypes['collections']>(payload: Payload, options: ManyOptions<TSlug>): Promise<BulkOperationResult<TSlug>>;
declare function updateLocal<TSlug extends keyof GeneratedTypes['collections']>(payload: Payload, options: Options<TSlug>): Promise<GeneratedTypes['collections'][TSlug] | BulkOperationResult<TSlug>>;
export default updateLocal;
