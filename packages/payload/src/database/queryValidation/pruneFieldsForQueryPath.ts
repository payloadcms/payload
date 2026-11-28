import type { Block, Field } from '../../fields/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

import { tabHasName } from '../../fields/config/types.js'

/**
 * Keeps only the fields named in a query path, plus the containers that hold them, so read
 * permissions can be built for the queried fields instead of the whole entity.
 * Each block becomes one pruned copy with the same slug, reused for every reference to it,
 * so permissions keep the keys `hasReadAccessToQueryPath` looks up and recursive block
 * references keep the identity `getEntityPermissions` uses to detect them.
 */
export const pruneFieldsForQueryPath = ({
  fields,
  names,
  prunedBlocks = new Map(),
  req,
}: {
  fields: Field[]
  names: Set<string>
  prunedBlocks?: Map<Block, Block>
  req: PayloadRequest
}): Field[] => {
  const pruned: Field[] = []

  for (const field of fields) {
    if (field.type === 'tabs') {
      const tabs = []

      for (const tab of field.tabs) {
        if (!tabHasName(tab) || names.has(tab.name)) {
          tabs.push({
            ...tab,
            fields: pruneFieldsForQueryPath({ fields: tab.fields, names, prunedBlocks, req }),
          })
        }
      }

      pruned.push({ ...field, tabs })
    } else if ('name' in field && field.name) {
      if (!names.has(field.name)) {
        continue
      }

      const copy = { ...field } as Field

      if ('fields' in field && field.fields && 'fields' in copy) {
        copy.fields = pruneFieldsForQueryPath({ fields: field.fields, names, prunedBlocks, req })
      }

      if (field.type === 'blocks' && copy.type === 'blocks') {
        copy.blocks = (field.blockReferences ?? field.blocks ?? []).flatMap((reference) => {
          const block = typeof reference === 'string' ? req.payload.blocks[reference] : reference

          return block ? [pruneBlock({ block, names, prunedBlocks, req })] : []
        })
        delete copy.blockReferences
      }

      pruned.push(copy)
    } else if ('fields' in field && field.fields) {
      pruned.push({
        ...field,
        fields: pruneFieldsForQueryPath({ fields: field.fields, names, prunedBlocks, req }),
      } as Field)
    }
  }

  return pruned
}

const pruneBlock = ({
  block,
  names,
  prunedBlocks,
  req,
}: {
  block: Block
  names: Set<string>
  prunedBlocks: Map<Block, Block>
  req: PayloadRequest
}): Block => {
  let prunedBlock = prunedBlocks.get(block)

  if (!prunedBlock) {
    prunedBlock = { ...block, fields: [] }
    // Registered before recursing so a block that references itself gets this same copy.
    prunedBlocks.set(block, prunedBlock)
    prunedBlock.fields = pruneFieldsForQueryPath({ fields: block.fields, names, prunedBlocks, req })
  }

  return prunedBlock
}
