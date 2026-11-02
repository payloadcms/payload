export const instructionsCollectionSlug = 'payload-llm-instructions'

export type InstructionTarget = {
  slug: string
  systemInstructions?: string
  type: 'collection' | 'global'
}

export type InstructionTargetFields = {
  entitySlug?: null | string
  entityType?: InstructionTarget['type'] | null
}
