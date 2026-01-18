import type { CodeFieldClientProps } from 'payload';
import React from 'react';
export type AdditionalCodeComponentProps = {
    /**
     * @default first key of the `languages` prop
     */
    defaultLanguage?: string;
    /**
     * @default all languages supported by Monaco Editor
     */
    languages?: Record<string, string>;
    /**
     * Override the name of the block.
     *
     * @default 'Code'
     */
    slug?: string;
    /**
     * Configure typescript settings for the editor
     */
    typescript?: {
        /**
         * By default, the editor will not perform semantic validation. This means that
         * while syntax errors will be highlighted, other issues like missing imports or incorrect
         * types will not be.
         *
         * @default false
         */
        enableSemanticValidation?: boolean;
        /**
         * Additional types to fetch and include in the editor for autocompletion.
         *
         * For example, to include types for payload, you would set this to
         *
         * [{ url: 'https://unpkg.com/payload@latest/dist/index.d.ts', filePath: 'file:///node_modules/payload/index.d.ts' }]
         */
        fetchTypes?: Array<{
            filePath: string;
            url: string;
        }>;
        /**
         * @default undefined
         */
        paths?: Record<string, string[]>;
        /**
         * @default "ESNext"
         */
        target?: string;
        /**
         * @default ['node_modules/@types']
         */
        typeRoots?: string[];
    };
};
export declare const CodeComponent: React.FC<AdditionalCodeComponentProps & CodeFieldClientProps>;
//# sourceMappingURL=Code.d.ts.map