import type { Field, SanitizedConfig } from 'payload';
import type { Editor } from 'slate';
export declare const unwrapLink: (editor: Editor) => void;
export declare const wrapLink: (editor: Editor) => void;
/**
 * This function is run to enrich the basefields which every link has with potential, custom user-added fields.
 */
export declare function transformExtraFields(customFieldSchema: ((args: {
    config: SanitizedConfig;
    defaultFields: Field[];
}) => Field[]) | Field[], config: SanitizedConfig): Field[];
//# sourceMappingURL=utilities.d.ts.map