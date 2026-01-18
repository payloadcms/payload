import type { Config, SanitizedConfig } from '../config/types.js';
import type { Field, TabAsField } from '../fields/config/types.js';
export type TraverseFieldsCallback = (args: {
    /**
     * The current field
     */
    field: Field | TabAsField;
    /**
     * Function that when called will skip the current field and continue to the next
     */
    next?: () => void;
    parentIsLocalized: boolean;
    parentPath: string;
    /**
     * The parent reference object
     */
    parentRef?: Record<string, unknown> | unknown;
    /**
     * The current reference object
     */
    ref?: Record<string, unknown> | unknown;
}) => boolean | void;
type TraverseFieldsArgs = {
    callback: TraverseFieldsCallback;
    callbackStack?: (() => ReturnType<TraverseFieldsCallback>)[];
    config?: Config | SanitizedConfig;
    fields: (Field | TabAsField)[];
    fillEmpty?: boolean;
    isTopLevel?: boolean;
    /**
     * @default false
     *
     * if this is `true`, the callback functions of the leaf fields will be called before the parent fields.
     * The return value of the callback function will be ignored.
     */
    leavesFirst?: boolean;
    parentIsLocalized?: boolean;
    parentPath?: string;
    parentRef?: Record<string, unknown> | unknown;
    ref?: Record<string, unknown> | unknown;
};
/**
 * Iterate a recurse an array of fields, calling a callback for each field
 *
 * @param fields
 * @param callback callback called for each field, discontinue looping if callback returns truthy
 * @param fillEmpty fill empty properties to use this without data
 * @param ref the data or any artifacts assigned in the callback during field recursion
 * @param parentRef the data or any artifacts assigned in the callback during field recursion one level up
 */
export declare const traverseFields: ({ callback, callbackStack: _callbackStack, config, fields, fillEmpty, isTopLevel, leavesFirst, parentIsLocalized, parentPath, parentRef, ref, }: TraverseFieldsArgs) => void;
export {};
//# sourceMappingURL=traverseFields.d.ts.map