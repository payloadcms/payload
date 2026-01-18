import type { SerializedLexicalNode } from 'lexical';
import type { DefaultNodeTypes, TypedEditorState } from '../nodeTypes.js';
/**
 * Helper to build lexical editor state JSON from text and/or nodes.
 *
 * @param nodes - The nodes to include in the editor state. If you pass the `text` argument, this will append your nodes after the first paragraph node.
 * @param text - The text content to include in the editor state. This will create a paragraph node with a text node for you and set that as the first node.
 * @returns The constructed editor state JSON.
 *
 * @example
 *
 * just passing text:
 *
 * ```ts
 * const editorState = buildEditorState<DefaultNodeTypes>({ text: 'Hello world' }) // result typed as DefaultTypedEditorState
 * ```
 *
 * @example
 *
 * passing nodes:
 *
 * ```ts
 * const editorState = // result typed as TypedEditorState<DefaultNodeTypes | SerializedBlockNode> (or TypedEditorState<SerializedBlockNode>)
 * buildEditorState<DefaultNodeTypes | SerializedBlockNode>({ // or just buildEditorState<SerializedBlockNode> if you *only* want to allow block nodes
 *   nodes: [
 *     {
 *       type: 'block',
 *        fields: {
 *          id: 'id',
 *          blockName: 'Cool block',
 *          blockType: 'myBlock',
 *        },
 *        format: 'left',
 *        version: 1,
 *      }
 *   ],
 * })
 * ```
 */
export declare function buildEditorState<T extends SerializedLexicalNode>({ nodes, text, }: {
    nodes?: TypedEditorState<T>['root']['children'];
    text?: string;
}): TypedEditorState<T>;
/**
 *
 * Alias for `buildEditorState<DefaultNodeTypes>`
 *
 * @experimental this API may change or be removed in a minor release
 * @internal
 */
export declare const buildDefaultEditorState: typeof buildEditorState<DefaultNodeTypes>;
//# sourceMappingURL=buildEditorState.d.ts.map