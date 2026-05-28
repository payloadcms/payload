import type {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalNode,
  NodeKey,
} from 'lexical'
import type { JSX } from 'react'

import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js'
import { addClassNamesToElement } from '@lexical/utils'
import ObjectID from 'bson-objectid'
import { $applyNodeReplacement } from 'lexical'

import type { Internal_UploadData, SerializedUploadNode, UploadData } from '../schema.js'

import { $convertUploadElement } from './conversions.js'

// Re-export the runtime data types from the colocated schema module so
// existing imports of this path keep working. Canonical definitions live in
// `../schema.ts` next to the JSON Schema builder + inlined TS source string.
export type {
  Internal_UploadData,
  SerializedUploadNode,
  UploadData,
  UploadDataImproved,
} from '../schema.js'

export class UploadServerNode extends DecoratorBlockNode {
  __data: UploadData

  constructor({
    data,
    format,
    key,
  }: {
    data: UploadData
    format?: ElementFormatType
    key?: NodeKey
  }) {
    super(format, key)
    this.__data = data
  }

  static override clone(node: UploadServerNode): UploadServerNode {
    return new this({
      data: node.__data,
      format: node.__format,
      key: node.__key,
    })
  }

  static override getType(): string {
    return 'upload'
  }

  static override importDOM(): DOMConversionMap<HTMLImageElement> {
    return {
      img: (node) => ({
        conversion: (domNode) => $convertUploadElement(domNode, $createUploadServerNode),
        priority: 0,
      }),
    }
  }

  static override importJSON(serializedNode: SerializedUploadNode): UploadServerNode {
    if (serializedNode.version === 1 && (serializedNode?.value as unknown as { id: string })?.id) {
      serializedNode.value = (serializedNode.value as unknown as { id: string }).id
    }
    if (serializedNode.version === 2 && !serializedNode?.id) {
      serializedNode.id = new ObjectID.default().toHexString()
      serializedNode.version = 3
    }

    const importedData: Internal_UploadData = {
      id: serializedNode.id,
      fields: serializedNode.fields,
      pending: (serializedNode as Internal_UploadData).pending,
      relationTo: serializedNode.relationTo,
      value: serializedNode.value,
    }

    const node = $createUploadServerNode({ data: importedData })
    node.setFormat(serializedNode.format)

    return node
  }

  static isInline(): false {
    return false
  }

  override createDOM(config?: EditorConfig): HTMLElement {
    const element = document.createElement('div')
    addClassNamesToElement(element, config?.theme?.upload)
    return element
  }

  override decorate(): JSX.Element {
    return null as unknown as JSX.Element
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('img')
    const data = this.__data as Internal_UploadData
    if (data.pending) {
      element.setAttribute('data-lexical-pending-upload-form-id', String(data?.pending?.formID))
      element.setAttribute('src', data?.pending?.src || '')
    } else {
      element.setAttribute('data-lexical-upload-id', String(data?.value))
      element.setAttribute('data-lexical-upload-relation-to', data?.relationTo)
    }

    return { element }
  }

  override exportJSON(): SerializedUploadNode {
    return {
      ...super.exportJSON(),
      ...this.getData(),
      type: 'upload',
      version: 3,
    }
  }

  getData(): UploadData {
    return this.getLatest().__data
  }

  setData(data: UploadData): void {
    const writable = this.getWritable()
    writable.__data = data
  }

  override updateDOM(): false {
    return false
  }
}

export function $createUploadServerNode({
  data,
}: {
  data: Omit<UploadData, 'id'> & Partial<Pick<UploadData, 'id'>>
}): UploadServerNode {
  if (!data?.id) {
    data.id = new ObjectID.default().toHexString()
  }
  return $applyNodeReplacement(new UploadServerNode({ data: data as UploadData }))
}

export function $isUploadServerNode(
  node: LexicalNode | null | undefined,
): node is UploadServerNode {
  return node instanceof UploadServerNode
}
