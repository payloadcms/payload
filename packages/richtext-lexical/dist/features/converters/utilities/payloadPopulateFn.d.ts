import { type Payload, type PayloadRequest, type TypedLocale } from 'payload';
import type { HTMLPopulateFn } from '../lexicalToHtml/async/types.js';
export declare const getPayloadPopulateFn: (args: {
    currentDepth: number;
    depth: number;
    draft?: boolean;
    locale?: TypedLocale;
    overrideAccess?: boolean;
    showHiddenFields?: boolean;
} & ({
    /**
     * This payload property will only be used if req is undefined. If localization is enabled, you must pass `req` instead.
     */
    payload: Payload;
    /**
     * When the converter is called, req CAN be passed in depending on where it's run.
     * If this is undefined and config is passed through, lexical will create a new req object for you.
     */
    req?: never;
} | {
    /**
     * This payload property will only be used if req is undefined. If localization is enabled, you must pass `req` instead.
     */
    payload?: never;
    /**
     * When the converter is called, req CAN be passed in depending on where it's run.
     * If this is undefined and config is passed through, lexical will create a new req object for you.
     */
    req: PayloadRequest;
})) => Promise<HTMLPopulateFn>;
//# sourceMappingURL=payloadPopulateFn.d.ts.map