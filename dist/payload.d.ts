import pino from 'pino';
import type { Express, Router } from 'express';
import { GraphQLError, GraphQLFormattedError, GraphQLSchema } from 'graphql';
import { Config as GeneratedTypes } from 'payload/generated-types';
import { BulkOperationResult, Collection, CollectionModel } from './collections/config/types';
import { EmailOptions, InitOptions, SanitizedConfig } from './config/types';
import { TypeWithVersion } from './versions/types';
import { PaginatedDocs } from './mongoose/types';
import { PayloadAuthenticate } from './express/middleware/authenticate';
import { Globals } from './globals/config/types';
import { ErrorHandler } from './express/middleware/errorHandler';
import { decrypt, encrypt } from './auth/crypto';
import { BuildEmailResult, Message } from './email/types';
import { Preferences } from './preferences/types';
import { Options as CreateOptions } from './collections/operations/local/create';
import { Options as FindOptions } from './collections/operations/local/find';
import { ByIDOptions as UpdateByIDOptions, ManyOptions as UpdateManyOptions } from './collections/operations/local/update';
import { ByIDOptions as DeleteByIDOptions, ManyOptions as DeleteManyOptions } from './collections/operations/local/delete';
import { Options as FindByIDOptions } from './collections/operations/local/findByID';
import { Options as FindVersionsOptions } from './collections/operations/local/findVersions';
import { Options as FindVersionByIDOptions } from './collections/operations/local/findVersionByID';
import { Options as RestoreVersionOptions } from './collections/operations/local/restoreVersion';
import { Options as FindGlobalVersionsOptions } from './globals/operations/local/findVersions';
import { Options as FindGlobalVersionByIDOptions } from './globals/operations/local/findVersionByID';
import { Options as RestoreGlobalVersionOptions } from './globals/operations/local/restoreVersion';
import { Options as ForgotPasswordOptions } from './auth/operations/local/forgotPassword';
import { Options as LoginOptions } from './auth/operations/local/login';
import { Options as ResetPasswordOptions } from './auth/operations/local/resetPassword';
import { Options as UnlockOptions } from './auth/operations/local/unlock';
import { Options as VerifyEmailOptions } from './auth/operations/local/verifyEmail';
import { Result as ForgotPasswordResult } from './auth/operations/forgotPassword';
import { Result as ResetPasswordResult } from './auth/operations/resetPassword';
import { Result as LoginResult } from './auth/operations/login';
import { Options as FindGlobalOptions } from './globals/operations/local/findOne';
import { Options as UpdateGlobalOptions } from './globals/operations/local/update';
/**
 * @description Payload
 */
export declare class BasePayload<TGeneratedTypes extends GeneratedTypes> {
    config: SanitizedConfig;
    collections: {
        [slug: string | number | symbol]: Collection;
    };
    versions: {
        [slug: string]: CollectionModel;
    };
    preferences: Preferences;
    globals: Globals;
    logger: pino.Logger;
    emailOptions: EmailOptions;
    email: BuildEmailResult;
    sendEmail: (message: Message) => Promise<unknown>;
    secret: string;
    mongoURL: string | false;
    mongoOptions: InitOptions['mongoOptions'];
    mongoMemoryServer: any;
    local: boolean;
    encrypt: typeof encrypt;
    decrypt: typeof decrypt;
    errorHandler: ErrorHandler;
    authenticate: PayloadAuthenticate;
    express?: Express;
    router?: Router;
    types: {
        blockTypes: any;
        blockInputTypes: any;
        localeInputType?: any;
        fallbackLocaleInputType?: any;
    };
    Query: {
        name: string;
        fields: {
            [key: string]: any;
        };
    };
    Mutation: {
        name: string;
        fields: {
            [key: string]: any;
        };
    };
    schema: GraphQLSchema;
    extensions: (info: any) => Promise<any>;
    customFormatErrorFn: (error: GraphQLError) => GraphQLFormattedError;
    validationRules: any;
    errorResponses: GraphQLFormattedError[];
    errorIndex: number;
    getAdminURL: () => string;
    getAPIURL: () => string;
    /**
     * @description Initializes Payload
     * @param options
     */
    init(options: InitOptions): Promise<Payload>;
    /**
     * @description Performs create operation
     * @param options
     * @returns created document
     */
    create: <T extends keyof TGeneratedTypes["collections"]>(options: CreateOptions<T>) => Promise<TGeneratedTypes["collections"][T]>;
    /**
     * @description Find documents with criteria
     * @param options
     * @returns documents satisfying query
     */
    find: <T extends keyof TGeneratedTypes["collections"]>(options: FindOptions<T>) => Promise<PaginatedDocs<TGeneratedTypes["collections"][T]>>;
    /**
     * @description Find document by ID
     * @param options
     * @returns document with specified ID
     */
    findByID: <T extends keyof TGeneratedTypes["collections"]>(options: FindByIDOptions<T>) => Promise<TGeneratedTypes["collections"][T]>;
    /**
     * @description Update one or more documents
     * @param options
     * @returns Updated document(s)
     */
    update<T extends keyof TGeneratedTypes['collections']>(options: UpdateByIDOptions<T>): Promise<TGeneratedTypes['collections'][T]>;
    update<T extends keyof TGeneratedTypes['collections']>(options: UpdateManyOptions<T>): Promise<BulkOperationResult<T>>;
    /**
     * @description delete one or more documents
     * @param options
     * @returns Updated document(s)
     */
    delete<T extends keyof TGeneratedTypes['collections']>(options: DeleteByIDOptions<T>): Promise<TGeneratedTypes['collections'][T]>;
    delete<T extends keyof TGeneratedTypes['collections']>(options: DeleteManyOptions<T>): Promise<BulkOperationResult<T>>;
    /**
     * @description Find versions with criteria
     * @param options
     * @returns versions satisfying query
     */
    findVersions: <T extends keyof TGeneratedTypes["collections"]>(options: FindVersionsOptions<T>) => Promise<PaginatedDocs<TypeWithVersion<TGeneratedTypes["collections"][T]>>>;
    /**
     * @description Find version by ID
     * @param options
     * @returns version with specified ID
     */
    findVersionByID: <T extends keyof TGeneratedTypes["collections"]>(options: FindVersionByIDOptions<T>) => Promise<TypeWithVersion<TGeneratedTypes["collections"][T]>>;
    /**
     * @description Restore version by ID
     * @param options
     * @returns version with specified ID
     */
    restoreVersion: <T extends keyof TGeneratedTypes["collections"]>(options: RestoreVersionOptions<T>) => Promise<TGeneratedTypes["collections"][T]>;
    login: <T extends keyof TGeneratedTypes["collections"]>(options: LoginOptions<T>) => Promise<LoginResult & {
        user: TGeneratedTypes["collections"][T];
    }>;
    forgotPassword: <T extends keyof TGeneratedTypes["collections"]>(options: ForgotPasswordOptions<T>) => Promise<ForgotPasswordResult>;
    resetPassword: <T extends keyof TGeneratedTypes["collections"]>(options: ResetPasswordOptions<T>) => Promise<ResetPasswordResult>;
    unlock: <T extends keyof TGeneratedTypes["collections"]>(options: UnlockOptions<T>) => Promise<boolean>;
    verifyEmail: <T extends keyof TGeneratedTypes["collections"]>(options: VerifyEmailOptions<T>) => Promise<boolean>;
    findGlobal: <T extends keyof TGeneratedTypes["globals"]>(options: FindGlobalOptions<T>) => Promise<TGeneratedTypes["globals"][T]>;
    updateGlobal: <T extends keyof TGeneratedTypes["globals"]>(options: UpdateGlobalOptions<T>) => Promise<TGeneratedTypes["globals"][T]>;
    /**
     * @description Find global versions with criteria
     * @param options
     * @returns versions satisfying query
     */
    findGlobalVersions: <T extends keyof TGeneratedTypes["globals"]>(options: FindGlobalVersionsOptions<T>) => Promise<PaginatedDocs<TypeWithVersion<TGeneratedTypes["globals"][T]>>>;
    /**
     * @description Find global version by ID
     * @param options
     * @returns global version with specified ID
     */
    findGlobalVersionByID: <T extends keyof TGeneratedTypes["globals"]>(options: FindGlobalVersionByIDOptions<T>) => Promise<TypeWithVersion<TGeneratedTypes["globals"][T]>>;
    /**
     * @description Restore global version by ID
     * @param options
     * @returns version with specified ID
     */
    restoreGlobalVersion: <T extends keyof TGeneratedTypes["globals"]>(options: RestoreGlobalVersionOptions<T>) => Promise<TGeneratedTypes["globals"][T]>;
}
export type Payload = BasePayload<GeneratedTypes>;
export declare const getPayload: (options: InitOptions) => Promise<Payload>;
