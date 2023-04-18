import { SanitizedCollectionConfig } from '../../../collections/config/types';
import { SanitizedGlobalConfig } from '../../../globals/config/types';
import { Operation } from '../../../types';
import { PayloadRequest } from '../../../express/types';
type Args<T> = {
    data: T | Record<string, unknown>;
    doc: T | Record<string, unknown>;
    docWithLocales: Record<string, unknown>;
    entityConfig: SanitizedCollectionConfig | SanitizedGlobalConfig;
    id?: string | number;
    operation: Operation;
    req: PayloadRequest;
    skipValidation?: boolean;
};
export declare const beforeChange: <T extends Record<string, unknown>>({ data: incomingData, doc, docWithLocales, entityConfig, id, operation, req, skipValidation, }: Args<T>) => Promise<T>;
export {};
