import { Config as GeneratedTypes } from '../../../generated-types';
import { Document, Where } from '../../../types';
import { Payload } from '../../../payload';
import { BulkOperationResult } from '../../config/types';
export type BaseOptions<T extends keyof GeneratedTypes['collections']> = {
    collection: T;
    depth?: number;
    locale?: string;
    fallbackLocale?: string;
    user?: Document;
    overrideAccess?: boolean;
    showHiddenFields?: boolean;
};
export type ByIDOptions<T extends keyof GeneratedTypes['collections']> = BaseOptions<T> & {
    id: string | number;
    where?: never;
};
export type ManyOptions<T extends keyof GeneratedTypes['collections']> = BaseOptions<T> & {
    where: Where;
    id?: never;
};
export type Options<TSlug extends keyof GeneratedTypes['collections']> = ByIDOptions<TSlug> | ManyOptions<TSlug>;
declare function deleteLocal<TSlug extends keyof GeneratedTypes['collections']>(payload: Payload, options: ByIDOptions<TSlug>): Promise<GeneratedTypes['collections'][TSlug]>;
declare function deleteLocal<TSlug extends keyof GeneratedTypes['collections']>(payload: Payload, options: ManyOptions<TSlug>): Promise<BulkOperationResult<TSlug>>;
declare function deleteLocal<TSlug extends keyof GeneratedTypes['collections']>(payload: Payload, options: Options<TSlug>): Promise<GeneratedTypes['collections'][TSlug] | BulkOperationResult<TSlug>>;
export default deleteLocal;
