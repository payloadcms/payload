import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'
import type { RichTextField, ValidateOptions } from 'payload'

import type { NodeValidation } from '../field/features/types.js'

export async function validateNodes({
  nodeValidations,
  nodes,
  validation: validationFromProps,
}: {
  nodeValidations: Map<string, Array<NodeValidation>>
  nodes: SerializedLexicalNode[]
  validation: {
    options: ValidateOptions<unknown, unknown, RichTextField>
    value: SerializedEditorState
  }
}): Promise<string | true> {
  for (const node of nodes) {
    // Validate node
    if (
      nodeValidations &&
      typeof nodeValidations?.has === 'function' &&
      nodeValidations?.has(node.type)
    ) {
      const validations = nodeValidations.get(node.type)
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
        nodeValidations,
        nodes: node.children as SerializedLexicalNode[],
        validation: validationFromProps,
      })
      if (childrenValidationResult !== true) {
        return childrenValidationResult
      }
    }
  }

  return true
}
