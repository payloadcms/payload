import type { Field } from 'payload';
import type { HTMLConvertersAsync, HTMLConvertersFunctionAsync } from '../types.js';
type Args = {
    converters?: HTMLConvertersAsync | HTMLConvertersFunctionAsync;
    /**
     * Whether the lexicalHTML field should be hidden in the admin panel
     *
     * @default true
     */
    hidden?: boolean;
    htmlFieldName: string;
    /**
     * A string which matches the lexical field name you want to convert to HTML.
     *
     * This has to be a sibling field of this lexicalHTML field - otherwise, it won't be able to find the lexical field.
     **/
    lexicalFieldName: string;
    /**
     * Whether the HTML should be stored in the database
     *
     * @default false
     */
    storeInDB?: boolean;
};
/**
 *
 * Field that converts a sibling lexical field to HTML
 *
 * @todo will be renamed to lexicalHTML in 4.0, replacing the deprecated `lexicalHTML` converter
 */
export declare const lexicalHTMLField: (args: Args) => Field;
export {};
//# sourceMappingURL=index.d.ts.map