import type { Field } from 'payload';
import type { MongooseAdapter } from '../index.js';
type Args = {
    $addToSet?: Record<string, {
        $each: any[];
    } | any>;
    $inc?: Record<string, number>;
    $pull?: Record<string, {
        $in: any[];
    } | any>;
    $push?: Record<string, {
        $each: any[];
    } | any>;
    /** instance of the adapter */
    adapter: MongooseAdapter;
    /** data to transform, can be an array of documents or a single document */
    data: Record<string, unknown> | Record<string, unknown>[];
    /** fields accossiated with the data */
    fields: Field[];
    /** slug of the global, pass only when the operation is `write` */
    globalSlug?: string;
    /**
     * Type of the operation
     * read - sanitizes ObjectIDs, Date to strings.
     * write - sanitizes string relationships to ObjectIDs.
     */
    operation: 'read' | 'write';
    parentIsLocalized?: boolean;
    /**
     * Throw errors on invalid relationships
     * @default true
     */
    validateRelationships?: boolean;
};
/**
 * A function that transforms Payload <-> MongoDB data.
 * @internal - this function may be removed or receive breaking changes in minor releases.
 */
export declare const transform: ({ $addToSet, $inc, $pull, $push, adapter, data, fields, globalSlug, operation, parentIsLocalized, validateRelationships, }: Args) => null | undefined;
export {};
//# sourceMappingURL=transform.d.ts.map