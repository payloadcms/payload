import { Config as GeneratedTypes } from 'payload/generated-types';
import { Response } from 'express';
import { PayloadRequest } from '../../express/types';
import { User } from '../types';
import { Collection } from '../../collections/config/types';
export type Result = {
    user?: User;
    token?: string;
    exp?: number;
};
export type Arguments = {
    collection: Collection;
    data: {
        email: string;
        password: string;
    };
    req: PayloadRequest;
    res?: Response;
    depth?: number;
    overrideAccess?: boolean;
    showHiddenFields?: boolean;
};
declare function login<TSlug extends keyof GeneratedTypes['collections']>(incomingArgs: Arguments): Promise<Result & {
    user: GeneratedTypes['collections'][TSlug];
}>;
export default login;
