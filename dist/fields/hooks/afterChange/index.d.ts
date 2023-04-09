import { SanitizedCollectionConfig } from '../../../collections/config/types';
import { SanitizedGlobalConfig } from '../../../globals/config/types';
import { PayloadRequest } from '../../../express/types';
type Args<T> = {
    data: T | Record<string, unknown>;
    doc: T | Record<string, unknown>;
    previousDoc: T | Record<string, unknown>;
    entityConfig: SanitizedCollectionConfig | SanitizedGlobalConfig;
    operation: 'create' | 'update';
    req: PayloadRequest;
};
export declare const afterChange: <T extends Record<string, unknown>>({ data, doc: incomingDoc, previousDoc, entityConfig, operation, req, }: Args<T>) => Promise<T>;
export {};
