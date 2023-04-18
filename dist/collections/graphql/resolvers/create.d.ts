import { Response } from 'express';
import { Config as GeneratedTypes } from 'payload/generated-types';
import { MarkOptional } from 'ts-essentials';
import { PayloadRequest } from '../../../express/types';
import { Collection } from '../../config/types';
export type Resolver<TSlug extends keyof GeneratedTypes['collections']> = (_: unknown, args: {
    data: MarkOptional<GeneratedTypes['collections'][TSlug], 'id' | 'updatedAt' | 'createdAt' | 'sizes'>;
    locale?: string;
    draft: boolean;
}, context: {
    req: PayloadRequest;
    res: Response;
}) => Promise<GeneratedTypes['collections'][TSlug]>;
export default function createResolver<TSlug extends keyof GeneratedTypes['collections']>(collection: Collection): Resolver<TSlug>;
