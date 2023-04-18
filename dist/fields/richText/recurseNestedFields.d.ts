import { Field } from '../config/types';
import { PayloadRequest } from '../../express/types';
type NestedRichTextFieldsArgs = {
    promises: Promise<void>[];
    data: unknown;
    fields: Field[];
    req: PayloadRequest;
    overrideAccess: boolean;
    depth: number;
    currentDepth?: number;
    showHiddenFields: boolean;
};
export declare const recurseNestedFields: ({ promises, data, fields, req, overrideAccess, depth, currentDepth, showHiddenFields, }: NestedRichTextFieldsArgs) => void;
export {};
