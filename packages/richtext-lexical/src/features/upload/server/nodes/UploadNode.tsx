import type { SerializedDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js'
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  ElementFormatType,
  LexicalNode,
  NodeKey,
  Spread,
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
import ObjectID from 'bson-objectid'
import { $applyNodeReplacement } from 'lexical'
import * as React from 'react'

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

export function isGoogleDocCheckboxImg(img: HTMLImageElement): boolean {
  return (
    img.parentElement != null &&
    img.parentElement.tagName === 'LI' &&
    img.previousSibling === null &&
    img.getAttribute('aria-roledescription') === 'checkbox'
  )
}

function $convertUploadServerElement(domNode: HTMLImageElement): DOMConversionOutput | null {
  if (
    domNode.hasAttribute('data-lexical-upload-relation-to') &&
    domNode.hasAttribute('data-lexical-upload-id')
  ) {
    const id = domNode.getAttribute('data-lexical-upload-id')
    const relationTo = domNode.getAttribute('data-lexical-upload-relation-to')

    if (id != null && relationTo != null) {
      const node = $createUploadServerNode({
        data: {
          fields: {},
          relationTo,
          value: id,
        },
      })
      return { node }
    }
  }
  const img = domNode
  if (img.src.startsWith('file:///') || isGoogleDocCheckboxImg(img)) {
    return null
  }
  // TODO: Auto-upload functionality here!
  //}
  return null
}

export type SerializedUploadNode = {
  children?: never // required so that our typed editor state doesn't automatically add children
  type: 'upload'
} & Spread<UploadData, SerializedDecoratorBlockNode>

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
        conversion: $convertUploadServerElement,
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

    const importedData: UploadData = {
      id: serializedNode.id,
      fields: serializedNode.fields,
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

  override decorate(): JSX.Element {
    // @ts-expect-error
    return <RawUploadComponent data={this.__data} format={this.__format} nodeKey={this.getKey()} />
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('img')
    element.setAttribute('data-lexical-upload-id', String(this.__data?.value))
    element.setAttribute('data-lexical-upload-relation-to', this.__data?.relationTo)

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
