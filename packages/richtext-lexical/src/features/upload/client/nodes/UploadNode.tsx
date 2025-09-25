'use client'
import type { DOMConversionMap, LexicalNode } from 'lexical'
import type { JSX } from 'react'

import ObjectID from 'bson-objectid'
import { $applyNodeReplacement } from 'lexical'
import * as React from 'react'

import type {
  Internal_UploadData,
  SerializedUploadNode,
  UploadData,
} from '../../server/nodes/UploadNode.js'

import { $convertUploadElement } from '../../server/nodes/conversions.js'
import { UploadServerNode } from '../../server/nodes/UploadNode.js'
import { PendingUploadComponent } from '../component/pending/index.js'

const RawUploadComponent = React.lazy(() =>
  import('../../client/component/index.js').then((module) => ({ default: module.UploadComponent })),
)

export class UploadNode extends UploadServerNode {
  static override clone(node: UploadServerNode): UploadServerNode {
    return super.clone(node)
  }

  static override getType(): string {
    return super.getType()
  }

  static override importDOM(): DOMConversionMap<HTMLImageElement> {
    return {
      img: (node) => ({
        conversion: (domNode) => $convertUploadElement(domNode, $createUploadNode),
        priority: 0,
      }),
    }
  }

  static override importJSON(serializedNode: SerializedUploadNode): UploadNode {
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

    const node = $createUploadNode({ data: importedData })
    node.setFormat(serializedNode.format)

    return node
  }

  override decorate(): JSX.Element {
    if ((this.__data as Internal_UploadData).pending) {
      return <PendingUploadComponent />
    }
    return <RawUploadComponent data={this.__data} format={this.__format} nodeKey={this.getKey()} />
  }

  override exportJSON(): SerializedUploadNode {
    return super.exportJSON()
  }
}

export function $createUploadNode({
  data,
}: {
  data: Omit<UploadData, 'id'> & Partial<Pick<UploadData, 'id'>>
}): UploadNode {
  if (!data?.id) {
    data.id = new ObjectID.default().toHexString()
  }

  return $applyNodeReplacement(new UploadNode({ data: data as UploadData }))
}

export function $isUploadNode(node: LexicalNode | null | undefined): node is UploadNode {
  return node instanceof UploadNode
}
