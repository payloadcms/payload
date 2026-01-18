/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { ElementNode, Klass, LexicalNode, TextFormatType, TextNode } from 'lexical';
export type Transformer = ElementTransformer | MultilineElementTransformer | TextFormatTransformer | TextMatchTransformer;
export type ElementTransformer = {
    dependencies: Array<Klass<LexicalNode>>;
    /**
     * `export` is called when the `$convertToMarkdownString` is called to convert the editor state into markdown.
     *
     * @return return null to cancel the export, even though the regex matched. Lexical will then search for the next transformer.
     */
    export: (node: LexicalNode, traverseChildren: (node: ElementNode) => string) => null | string;
    regExp: RegExp;
    /**
     * `replace` is called when markdown is imported or typed in the editor
     *
     * @return return false to cancel the transform, even though the regex matched. Lexical will then search for the next transformer.
     */
    replace: (parentNode: ElementNode, children: Array<LexicalNode>, match: Array<string>, 
    /**
     * Whether the match is from an import operation (e.g. through `$convertFromMarkdownString`) or not (e.g. through typing in the editor).
     */
    isImport: boolean) => boolean | void;
    type: 'element';
};
export type MultilineElementTransformer = {
    dependencies: Array<Klass<LexicalNode>>;
    /**
     * `export` is called when the `$convertToMarkdownString` is called to convert the editor state into markdown.
     *
     * @return return null to cancel the export, even though the regex matched. Lexical will then search for the next transformer.
     */
    export?: (node: LexicalNode, traverseChildren: (node: ElementNode) => string) => null | string;
    /**
     * Use this function to manually handle the import process, once the `regExpStart` has matched successfully.
     * Without providing this function, the default behavior is to match until `regExpEnd` is found, or until the end of the document if `regExpEnd.optional` is true.
     *
     * @returns a tuple or null. The first element of the returned tuple is a boolean indicating if a multiline element was imported. The second element is the index of the last line that was processed. If null is returned, the next multilineElementTransformer will be tried. If undefined is returned, the default behavior will be used.
     */
    handleImportAfterStartMatch?: (args: {
        lines: Array<string>;
        rootNode: ElementNode;
        startLineIndex: number;
        startMatch: RegExpMatchArray;
        transformer: MultilineElementTransformer;
    }) => [boolean, number] | null | undefined;
    /**
     * This regex determines when to stop matching. Anything in between regExpStart and regExpEnd will be matched
     */
    regExpEnd?: {
        /**
         * Whether the end match is optional. If true, the end match is not required to match for the transformer to be triggered.
         * The entire text from regexpStart to the end of the document will then be matched.
         */
        optional?: true;
        regExp: RegExp;
    } | RegExp;
    /**
     * This regex determines when to start matching
     */
    regExpStart: RegExp;
    /**
     * `replace` is called only when markdown is imported in the editor, not when it's typed
     *
     * @return return false to cancel the transform, even though the regex matched. Lexical will then search for the next transformer.
     */
    replace: (rootNode: ElementNode, 
    /**
     * During markdown shortcut transforms, children nodes may be provided to the transformer. If this is the case, no `linesInBetween` will be provided and
     * the children nodes should be used instead of the `linesInBetween` to create the new node.
     */
    children: Array<LexicalNode> | null, startMatch: Array<string>, endMatch: Array<string> | null, 
    /**
     * linesInBetween includes the text between the start & end matches, split up by lines, not including the matches themselves.
     * This is null when the transformer is triggered through markdown shortcuts (by typing in the editor)
     */
    linesInBetween: Array<string> | null, 
    /**
     * Whether the match is from an import operation (e.g. through `$convertFromMarkdownString`) or not (e.g. through typing in the editor).
     */
    isImport: boolean) => boolean | void;
    type: 'multiline-element';
};
export type TextFormatTransformer = Readonly<{
    format: ReadonlyArray<TextFormatType>;
    intraword?: boolean;
    tag: string;
    type: 'text-format';
}>;
export type TextMatchTransformer = Readonly<{
    dependencies: Array<Klass<LexicalNode>>;
    /**
     * Determines how a node should be exported to markdown
     */
    export?: (node: LexicalNode, exportChildren: (node: ElementNode) => string, exportFormat: (node: TextNode, textContent: string) => string) => null | string;
    /**
     * For import operations, this function can be used to determine the end index of the match, after `importRegExp` has matched.
     * Without this function, the end index will be determined by the length of the match from `importRegExp`. Manually determining the end index can be useful if
     * the match from `importRegExp` is not the entire text content of the node. That way, `importRegExp` can be used to match only the start of the node, and `getEndIndex`
     * can be used to match the end of the node.
     *
     * @returns The end index of the match, or false if the match was unsuccessful and a different transformer should be tried.
     */
    getEndIndex?: (node: TextNode, match: RegExpMatchArray) => false | number;
    /**
     * This regex determines what text is matched during markdown imports
     */
    importRegExp?: RegExp;
    /**
     * This regex determines what text is matched for markdown shortcuts while typing in the editor
     */
    regExp: RegExp;
    /**
     * Determines how the matched markdown text should be transformed into a node during the markdown import process
     *
     * @returns nothing, or a TextNode that may be a child of the new node that is created.
     * If a TextNode is returned, text format matching will be applied to it (e.g. bold, italic, etc.)
     */
    replace?: (node: TextNode, match: RegExpMatchArray) => TextNode | void;
    /**
     * Single character that allows the transformer to trigger when typed in the editor. This does not affect markdown imports outside of the markdown shortcut plugin.
     * If the trigger is matched, the `regExp` will be used to match the text in the second step.
     */
    trigger?: string;
    type: 'text-match';
}>;
export declare const HEADING: ElementTransformer;
export declare const QUOTE: ElementTransformer;
export declare const UNORDERED_LIST: ElementTransformer;
export declare const CHECK_LIST: ElementTransformer;
export declare const ORDERED_LIST: ElementTransformer;
export declare const INLINE_CODE: TextFormatTransformer;
export declare const HIGHLIGHT: TextFormatTransformer;
export declare const BOLD_ITALIC_STAR: TextFormatTransformer;
export declare const BOLD_ITALIC_UNDERSCORE: TextFormatTransformer;
export declare const BOLD_STAR: TextFormatTransformer;
export declare const BOLD_UNDERSCORE: TextFormatTransformer;
export declare const STRIKETHROUGH: TextFormatTransformer;
export declare const ITALIC_STAR: TextFormatTransformer;
export declare const ITALIC_UNDERSCORE: TextFormatTransformer;
export declare function normalizeMarkdown(input: string, shouldMergeAdjacentLines: boolean): string;
//# sourceMappingURL=MarkdownTransformers.d.ts.map