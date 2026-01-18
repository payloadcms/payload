/**
 * By default, Lexical throws an error if the selection ends in deleted nodes.
 * This is very aggressive considering there are reasons why this can happen
 * outside of Payload's control (custom features or conflicting features, for example).
 * In the case of selections on nonexistent nodes, this plugin moves the selection to
 * the end of the editor and displays a warning instead of an error.
 */
export declare function NormalizeSelectionPlugin(): null;
//# sourceMappingURL=index.d.ts.map