import type { SerializedLexicalNode } from 'lexical'

import type {
  DefaultNodeTypes,
  DefaultTypedEditorState,
  TypedEditorState,
} from '../types/nodeTypes.js'

/**
 * The node union to build with. Accepts either a node union directly (e.g. `DefaultNodeTypes`) or a
 * generated `richText` field type (e.g. `Post['richText']`), whose nodes are extracted automatically.
 */
type BuildNodes<T> =
  NonNullable<T> extends TypedEditorState<infer TNode extends SerializedLexicalNode>
    ? TNode
    : Extract<NonNullable<T>, SerializedLexicalNode>

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
 *
 * @example
 *
 * passing a generated `richText` field type — the result is exactly that field's type:
 *
 * ```ts
 * post.richText = buildEditorState<Post['richText']>({ text: 'Hello world' })
 * ```
 */
export function buildEditorState<
  T extends null | SerializedLexicalNode | TypedEditorState<SerializedLexicalNode> | undefined =
    DefaultNodeTypes,
>({
  nodes,
  text,
}: {
  nodes?: TypedEditorState<BuildNodes<T>>['root']['children']
  text?: string
}): TypedEditorState<BuildNodes<T>> {
  const editorJSON: DefaultTypedEditorState = {
    root: {
      type: 'root',
      children: [],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }

  if (text) {
    editorJSON.root.children.push({
      type: 'paragraph',
      children: [
        {
          type: 'text',
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text,
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      textFormat: 0,
      textStyle: '',
      version: 1,
    })
  }

  if (nodes?.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editorJSON.root.children.push(...(nodes as any))
  }

  if (editorJSON.root.children.length === 0) {
    // An error will be thrown if the root node has no children
    editorJSON.root.children.push({
      type: 'paragraph',
      children: [],
      direction: 'ltr',
      format: '',
      indent: 0,
      textFormat: 0,
      textStyle: '',
      version: 1,
    })
  }

  return editorJSON as TypedEditorState<BuildNodes<T>>
}

/**
 *
 * Alias for `buildEditorState<DefaultNodeTypes>`
 *
 * @experimental this API may change or be removed in a minor release
 * @internal
 */
export const buildDefaultEditorState: typeof buildEditorState<DefaultNodeTypes> =
  buildEditorState<DefaultNodeTypes>
