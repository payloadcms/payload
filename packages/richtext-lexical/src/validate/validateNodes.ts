import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'
import type { RichTextField, ValidateOptions } from 'payload'

import type { NodeValidation } from '../features/typesServer.js'

export async function validateNodes({
  nodes,
  nodeValidations,
  validation: validationFromProps,
}: {
  nodes: SerializedLexicalNode[]
  nodeValidations: Map<string, Array<NodeValidation>>
  validation: {
    options: ValidateOptions<unknown, unknown, RichTextField, SerializedEditorState>
    value: SerializedEditorState
  }
}): Promise<string | true> {
  for (const node of nodes) {
    // Validate node
    const validations = nodeValidations.get(node.type)
    if (validations) {
      for (const validation of validations) {
        const validationResult = await validation({
          node,
          nodeValidations,
          validation: validationFromProps,
        })
        if (validationResult !== true) {
          return `${node.type} node failed to validate: ${validationResult}`
        }
      }
    }

    // Validate node's children
    if ('children' in node && node?.children) {
      const childrenValidationResult = await validateNodes({
        nodes: node.children as SerializedLexicalNode[],
        nodeValidations,
        validation: validationFromProps,
      })
      if (childrenValidationResult !== true) {
        return childrenValidationResult
      }
    }
  }

  return true
}
