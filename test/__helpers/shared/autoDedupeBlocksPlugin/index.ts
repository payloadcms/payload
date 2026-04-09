import { dequal } from 'dequal/lite'
import { type Block, type BlockSlug, type Config, traverseFields } from 'payload'

export const autoDedupeBlocksPlugin =
  (args?: { debug?: boolean; disabled?: boolean; silent?: boolean }) =>
  (config: Config): Config => {
    if (!args) {
      args = {}
    }
    const { disabled = false, debug = false, silent = false } = args

    if (disabled) {
      return config
    }

    traverseFields({
      config,
      leavesFirst: true,
      parentIsLocalized: false,
      isTopLevel: true,
      fields: [
        ...(config.collections?.length
          ? config.collections.map((collection) => collection.fields).flat()
          : []),
        ...(config.globals?.length ? config.globals.map((global) => global.fields).flat() : []),
      ],
      callback: ({ field }) => {
        if (field.type === 'blocks') {
          if (field?.blocks?.length) {
            field.blockReferences = new Array(field.blocks.length)
            for (let i = 0; i < field.blocks.length; i++) {
              const block = field.blocks[i]
              if (!block) {
                continue
              }
              deduplicateBlock({ block, config, silent })
              field.blockReferences[i] = block.slug as BlockSlug
            }
            field.blocks = []
          }

          if (debug && !silent) {
            console.log('migrated field', field)
          }
        }
      },
    })
    return config
  }

export const deduplicateBlock = ({
  block: dedupedBlock,
  config,
  silent,
}: {
  block: Block
  config: Config
  silent?: boolean
}) => {
  /**
   * Will be true if a block with the same slug is found.
   */
  let alreadyDeduplicated = false

  if (config?.blocks?.length) {
    for (const existingBlock of config.blocks) {
      if (existingBlock.slug === dedupedBlock.slug) {
        alreadyDeduplicated = true

        // Check if the fields are the same
        const jsonExistingBlock = JSON.stringify(existingBlock, null, 2)
        const jsonBlockToDeduplicate = JSON.stringify(dedupedBlock, null, 2)
        // dequal check of blocks with functions removed (through JSON.stringify+JSON.parse). We cannot check the strings,
        // as the order of keys in the object is not guaranteed, yet it doesn't matter for the block fields.
        if (!dequal(JSON.parse(jsonExistingBlock), JSON.parse(jsonBlockToDeduplicate))) {
          console.error('Block with the same slug but different fields found', {
            slug: dedupedBlock.slug,
            existingBlock: jsonExistingBlock,
            dedupedBlock: jsonBlockToDeduplicate,
          })
          throw new Error('Block with the same slug but different fields found')
        }
        if (
          // Object reference check for just the block fields - it's more likely that top-level block keys have been spread
          !Object.is(existingBlock.fields, dedupedBlock.fields) &&
          !silent
        ) {
          // only throw warning:
          console.warn(
            'Block with the same slug but different fields found. JSON is different, but object references are equal. Please manually verify that things like functions passed to the blocks behave the same way.',
            {
              slug: dedupedBlock.slug,
              existingBlock: JSON.stringify(existingBlock, null, 2),
              dedupedBlock: JSON.stringify(dedupedBlock, null, 2),
            },
          )
        }
        break
      }
    }
  }
  if (!alreadyDeduplicated) {
    if (!config.blocks) {
      config.blocks = []
    }
    config.blocks.push(dedupedBlock)
  }
}
