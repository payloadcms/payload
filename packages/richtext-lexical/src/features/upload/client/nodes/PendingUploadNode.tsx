'use client'
import type { DOMConversionMap, LexicalNode } from 'lexical'
import type { JSX } from 'react'

import { $applyNodeReplacement } from 'lexical'
import * as React from 'react'

import type {
  PendingUploadData,
  SerializedPendingUploadNode,
} from '../../server/nodes/PendingUploadNode.js'

import { $convertPendingUploadElement } from '../../server/nodes/conversions.js'
import { PendingUploadServerNode } from '../../server/nodes/PendingUploadNode.js'

const PendingUploadComponent = React.lazy(() =>
  import('../../client/pendingComponent/index.js').then((module) => ({
    default: module.PendingUploadComponent,
  })),
)

export class PendingUploadNode extends PendingUploadServerNode {
  static override clone(node: PendingUploadServerNode): PendingUploadServerNode {
    return super.clone(node)
  }

  static override getType(): string {
    return super.getType()
  }

  static override importDOM(): DOMConversionMap<HTMLImageElement> {
    return {
      img: () => ({
        conversion: (domNode) => $convertPendingUploadElement(domNode, $createPendingUploadNode),
        priority: 0,
      }),
    }
  }

  static override importJSON(serializedNode: SerializedPendingUploadNode): PendingUploadNode {
    const importedData: PendingUploadData = {
      formID: serializedNode.formID,
      src: serializedNode.src,
    }

    const node = $createPendingUploadNode({ data: importedData })
    node.setFormat(serializedNode.format)

    return node
  }

  override decorate(): JSX.Element {
    return <PendingUploadComponent data={this.__data} nodeKey={this.getKey()} />
  }

  override exportJSON(): SerializedPendingUploadNode {
    return super.exportJSON()
  }
}

export function $createPendingUploadNode({ data }: { data: PendingUploadData }): PendingUploadNode {
  return $applyNodeReplacement(new PendingUploadNode({ data }))
}

export function $isPendingUploadNode(
  node: LexicalNode | null | undefined,
): node is PendingUploadNode {
  return node instanceof PendingUploadNode
}
