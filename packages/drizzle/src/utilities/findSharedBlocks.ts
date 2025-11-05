import type { Block, Field, FlattenedField, Payload } from 'payload'

/**
 * Helper function to find all shared blocks across collections and globals.
 * A block is considered "shared" if the same JS reference appears in multiple collections/globals.
 *
 * @param payload - The Payload instance
 * @returns A Set of block references that are shared across multiple collections/globals
 */
export const findSharedBlocks = (payload: Payload): Set<Block> => {
  const blockReferencesMap = new Map<Block, Set<string>>() // Map<blockReference, Set<collectionSlug>>

  /**
   * Recursively traverse fields to find block usage
   * @param fields - Array of field configurations
   * @param parentSlug - The slug of the parent collection/global
   */
  const traverseFieldsForBlocks = (fields: FlattenedField[], parentSlug: string): void => {
    fields.forEach((field) => {
      if (field.type === 'blocks') {
        const blockRefs = field.blockReferences ?? field.blocks
        if (blockRefs) {
          blockRefs.forEach((blockRef) => {
            const block = typeof blockRef === 'string' ? payload.blocks[blockRef] : blockRef

            if (!blockReferencesMap.has(block.originalRef)) {
              blockReferencesMap.set(block.originalRef, new Set<string>())
            }
            const blockSet = blockReferencesMap.get(block.originalRef)
            if (blockSet) {
              blockSet.add(parentSlug)
            }
          })
        }
      }

      // Recursively check nested fields
      if ('flattenedFields' in field) {
        traverseFieldsForBlocks(field.flattenedFields, parentSlug)
      }
    })
  }

  // Check all collections
  payload.config.collections.forEach((collection) => {
    traverseFieldsForBlocks(collection.flattenedFields, collection.slug)
  })

  // Check all globals
  payload.config.globals.forEach((global) => {
    traverseFieldsForBlocks(global.flattenedFields, global.slug)
  })

  // Return only blocks that are used in multiple collections/globals
  const sharedBlocks = new Set<Block>()
  blockReferencesMap.forEach((collections, blockRef) => {
    if (collections.size > 1) {
      sharedBlocks.add(blockRef)
    }
  })

  return sharedBlocks
}
