import type { SerializedLexicalNode } from 'lexical'

import type { DefaultTypedEditorState, TypedEditorState } from '../nodeTypes.js'

export function buildEditorState(args: {
  nodes?: DefaultTypedEditorState['root']['children']
  text?: string
}): DefaultTypedEditorState

export function buildEditorState<T extends SerializedLexicalNode>(args: {
  // If you pass children typed for a specific schema T, the return is TypedEditorState<T>
  nodes?: TypedEditorState<T>['root']['children']
  text?: string
}): TypedEditorState<T>

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
 * const editorState = buildEditorState({ text: 'Hello world' }) // result typed as DefaultTypedEditorState
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
export function buildEditorState<T extends SerializedLexicalNode>({
  nodes,
  text,
}: {
  nodes?: DefaultTypedEditorState['root']['children'] | TypedEditorState<T>['root']['children']
  text?: string
}): DefaultTypedEditorState | TypedEditorState<T> {
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
    editorJSON.root.children.push(...(nodes as any))
  }

  return editorJSON
}
