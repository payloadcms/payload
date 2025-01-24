'use client'
import type {
  DOMConversionMap,
  DOMConversionOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
} from 'lexical'
import type { JSX } from 'react'

import * as React from 'react'

import type {
  RelationshipData,
  SerializedRelationshipNode,
} from '../../server/nodes/RelationshipNode.js'

import { RelationshipServerNode } from '../../server/nodes/RelationshipNode.js'

const RelationshipComponent = React.lazy(() =>
  import('../components/RelationshipComponent.js').then((module) => ({
    default: module.RelationshipComponent,
  })),
)

function $relationshipElementToNode(domNode: HTMLDivElement): DOMConversionOutput | null {
  const id = domNode.getAttribute('data-lexical-relationship-id')
  const relationTo = domNode.getAttribute('data-lexical-relationship-relationTo')

  if (id != null && relationTo != null) {
    const node = $createRelationshipNode({
      relationTo,
      value: id,
    })
    return { node }
  }
  return null
}

export class RelationshipNode extends RelationshipServerNode {
  static override clone(node: RelationshipServerNode): RelationshipServerNode {
    return super.clone(node)
  }

  static override getType(): string {
    return super.getType()
  }

  static override importDOM(): DOMConversionMap<HTMLDivElement> | null {
    return {
      div: (domNode: HTMLDivElement) => {
        if (
          !domNode.hasAttribute('data-lexical-relationship-relationTo') ||
          !domNode.hasAttribute('data-lexical-relationship-id')
        ) {
          return null
        }
        return {
          conversion: $relationshipElementToNode,
          priority: 2,
        }
      },
    }
  }

  static override importJSON(serializedNode: SerializedRelationshipNode): RelationshipNode {
    if (serializedNode.version === 1 && (serializedNode?.value as unknown as { id: string })?.id) {
      serializedNode.value = (serializedNode.value as unknown as { id: string }).id
    }

    const importedData: RelationshipData = {
      relationTo: serializedNode.relationTo,
      value: serializedNode.value,
    }
    const node = $createRelationshipNode(importedData)
    node.setFormat(serializedNode.format)
    return node
  }

  override decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    return (
      <RelationshipComponent
        className={config.theme.relationship ?? 'LexicalEditorTheme__relationship'}
        data={this.__data}
        format={this.__format}
        nodeKey={this.getKey()}
      />
    )
  }

  override exportJSON(): SerializedRelationshipNode {
    return super.exportJSON()
  }
}

export function $createRelationshipNode(data: RelationshipData): RelationshipNode {
  return new RelationshipNode({
    data,
  })
}

export function $isRelationshipNode(
  node: LexicalNode | null | RelationshipNode | undefined,
): node is RelationshipNode {
  return node instanceof RelationshipNode
}
