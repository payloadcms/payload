import type { SerializedDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js'
import type {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalNode,
  NodeKey,
} from 'lexical'
import type {
  CollectionSlug,
  DataFromCollectionSlug,
  JsonObject,
  TypedUploadCollection,
  UploadCollectionSlug,
} from 'payload'
import type { JSX } from 'react'

import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js'
import { addClassNamesToElement } from '@lexical/utils'
import ObjectID from 'bson-objectid'
import { $applyNodeReplacement } from 'lexical'

import type { StronglyTypedLeafNode } from '../../../../nodeTypes.js'

import { $convertUploadElement } from './conversions.js'

export type UploadData<TUploadExtraFieldsData extends JsonObject = JsonObject> = {
  [TCollectionSlug in CollectionSlug]: {
    fields: TUploadExtraFieldsData
    /**
     * Every lexical node that has sub-fields needs to have a unique ID. This is the ID of this upload node, not the ID of the linked upload document
     */
    id: string
    relationTo: TCollectionSlug
    /**
     * Value can be just the document ID, or the full, populated document
     */
    value: DataFromCollectionSlug<TCollectionSlug> | number | string
  }
}[CollectionSlug]

/**
 * Internal use only - UploadData type that can contain a pending state
 * @internal
 */
export type Internal_UploadData<TUploadExtraFieldsData extends JsonObject = JsonObject> = {
  pending?: {
    /**
     * ID that corresponds to the bulk upload form ID
     */
    formID: string
    /**
     * src value of the image dom element
     */
    src: string
  }
} & UploadData<TUploadExtraFieldsData>

/**
 * UploadDataImproved is a more precise type, and will replace UploadData in Payload v4.
 * This type is for internal use only as it will be deprecated in the future.
 * @internal
 *
 * @todo Replace UploadData with UploadDataImproved in 4.0
 */
export type UploadDataImproved<TUploadExtraFieldsData extends JsonObject = JsonObject> = {
  [TCollectionSlug in UploadCollectionSlug]: {
    fields: TUploadExtraFieldsData
    /**
     * Every lexical node that has sub-fields needs to have a unique ID. This is the ID of this upload node, not the ID of the linked upload document
     */
    id: string
    relationTo: TCollectionSlug
    /**
     * Value can be just the document ID, or the full, populated document
     */
    value: number | string | TypedUploadCollection[TCollectionSlug]
  }
}[UploadCollectionSlug]

export type SerializedUploadNode = StronglyTypedLeafNode<SerializedDecoratorBlockNode, 'upload'> &
  UploadData

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
      ...this.getStaleData(),
      type: 'upload',
      version: 3,
    }
  }

  /**
   * Returns the node's in-memory data. The `fields` property may be stale —
   * the parent document form state at `{richTextPath}.{nodeId}.*` is the
   * source of truth. Stale data is synced back on document save via the
   * `beforeChange` hook.
   */
  getStaleData(): UploadData {
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
