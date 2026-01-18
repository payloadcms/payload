import React from 'react';
import type { FieldType, Options } from './types.js';
export type { FieldType, Options };
/**
 * Context to allow providing useField value for fields directly, if managed outside the Form
 *
 * @experimental
 */
export declare const FieldContext: React.Context<FieldType<unknown>>;
/**
 * Get and set the value of a form field.
 *
 * @see https://payloadcms.com/docs/admin/react-hooks#usefield
 */
export declare const useField: <TValue>(options?: Options) => FieldType<TValue>;
//# sourceMappingURL=index.d.ts.map