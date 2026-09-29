export const instructionsCollectionSlug = 'payload-llm-instructions'

export type InstructionTarget = {
  slug: string
  systemInstructions?: string
  type: 'collection' | 'global'
}

export type InstructionTargetFields = {
  collectionSlug?: null | string
  globalSlug?: null | string
}
