import { Payload } from '../payload';
import { Document } from '../types';
import { GlobalModel, SanitizedGlobalConfig } from '../globals/config/types';
type Args = {
    payload: Payload;
    query: Record<string, unknown>;
    lean?: boolean;
    Model: GlobalModel;
    config: SanitizedGlobalConfig;
};
export declare const getLatestGlobalVersion: ({ payload, config, Model, query, lean, }: Args) => Promise<{
    global: Document;
    globalExists: boolean;
}>;
export {};
