import { Response } from 'express';
import { Config as GeneratedTypes } from 'payload/generated-types';
import { MarkOptional } from 'ts-essentials';
import { PayloadRequest } from '../../express/types';
import { Collection } from '../../collections/config/types';
export type Arguments<T extends {
    [field: string | number | symbol]: unknown;
}> = {
    collection: Collection;
    data: MarkOptional<T, 'id' | 'updatedAt' | 'createdAt' | 'sizes'> & {
        email: string;
        password: string;
    };
    req: PayloadRequest;
    res: Response;
};
export type Result<T> = {
    message: string;
    user: T;
};
declare function registerFirstUser<TSlug extends keyof GeneratedTypes['collections']>(args: Arguments<GeneratedTypes['collections'][TSlug]>): Promise<Result<GeneratedTypes['collections'][TSlug]>>;
export default registerFirstUser;
