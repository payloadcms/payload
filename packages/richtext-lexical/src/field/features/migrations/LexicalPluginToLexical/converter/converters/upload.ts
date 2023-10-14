import type { SerializedUploadNode } from '../../../../../..'
import type { LexicalPluginNodeConverter } from '../types'

export const UploadConverter: LexicalPluginNodeConverter = {
  converter({ lexicalPluginNode }) {
    let fields = {}
    if ((lexicalPluginNode as any)?.caption?.editorState) {
      fields = {
        caption: (lexicalPluginNode as any)?.caption,
      }
    }
    return {
      fields,
      format: (lexicalPluginNode as any)?.format || '',
      relationTo: (lexicalPluginNode as any)?.rawImagePayload?.relationTo,
      type: 'upload',
      value: {
        id: (lexicalPluginNode as any)?.rawImagePayload?.value?.id || '',
      },
      version: 1,
    } as const as SerializedUploadNode
  },
  nodeTypes: ['upload'],
}
