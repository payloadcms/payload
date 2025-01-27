import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'
import type { SanitizedConfig } from 'payload/config'
import type { RichTextField, ValidateOptions } from 'payload/types'

import type { NodeValidation } from '../field/features/types'

export async function validateNodes({
  nodeValidations,
  nodes,
  payloadConfig,
  validation: validationFromProps,
}: {
  nodeValidations: Map<string, Array<NodeValidation>>
  nodes: SerializedLexicalNode[]
  payloadConfig: SanitizedConfig
  validation: {
    options: ValidateOptions<SerializedEditorState, unknown, RichTextField, SerializedEditorState>
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
          payloadConfig,
          validation: validationFromProps,
        })
        if (validationResult !== true) {
          return validationResult
        }
      }
    }

    // Validate node's children
    if ('children' in node && node?.children) {
      const childrenValidationResult = await validateNodes({
        nodeValidations,
        nodes: node.children as SerializedLexicalNode[],
        payloadConfig,
        validation: validationFromProps,
      })
      if (childrenValidationResult !== true) {
        return childrenValidationResult
      }
    }
  }

  return true
}
