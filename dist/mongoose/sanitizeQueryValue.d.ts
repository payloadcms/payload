import { Field, TabAsField } from '../fields/config/types';
import { ParamParser } from './buildQuery';
type SanitizeQueryValueArgs = {
    ctx: ParamParser;
    field: Field | TabAsField;
    path: string;
    operator: string;
    val: any;
    hasCustomID: boolean;
};
export declare const sanitizeQueryValue: ({ ctx, field, path, operator, val, hasCustomID }: SanitizeQueryValueArgs) => unknown;
export {};
