import { describe, expect, it } from 'vitest'

import { $getRoot, createEditor } from 'lexical'

import type { UploadData } from '../../server/schema.js'

import { $createUploadNode, $isUploadNode, UploadNode } from '../nodes/UploadNode.js'
import { INSERT_UPLOAD_COMMAND } from '../plugin/index.js'
import { insertUpload } from './index.js'

describe('upload drawer insertUpload', () => {
  it('should insert an upload with empty fields instead of null', () => {
    const editor = createEditor({ nodes: [UploadNode] })
    let insertedFields: unknown

    editor.registerCommand(
      INSERT_UPLOAD_COMMAND,
      (payload) => {
        insertedFields = payload.fields
        return true
      },
      0,
    )

    insertUpload({ editor, relationTo: 'uploads', replaceNodeKey: null, value: '1' })

    expect(insertedFields).toEqual({})
  })

  it('should replace an upload with empty fields instead of null', () => {
    const editor = createEditor({ nodes: [UploadNode] })
    let nodeKey = ''

    editor.update(
      () => {
        const node = $createUploadNode({
          data: { fields: {}, relationTo: 'uploads', value: '1' } as UploadData,
        })
        $getRoot().append(node)
        nodeKey = node.getKey()
      },
      { discrete: true },
    )

    editor.update(
      () => insertUpload({ editor, relationTo: 'uploads', replaceNodeKey: nodeKey, value: '2' }),
      { discrete: true },
    )

    const data = editor.getEditorState().read(() => {
      const node = $getRoot().getFirstChild()
      return $isUploadNode(node) ? node.getData() : undefined
    })

    expect(data?.value).toBe('2')
    expect(data?.fields).toEqual({})
  })
})
