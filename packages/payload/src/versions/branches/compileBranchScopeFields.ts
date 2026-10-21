import type { Block, Field } from '../../fields/config/types.js'

import { fieldAffectsData, fieldIsVirtual, tabHasName } from '../../fields/config/types.js'

export type BranchScopeField = {
  name: string
} & (
  | { blocks: Map<string, BranchScopeField[]>; type: 'blocks' }
  | { fields: BranchScopeField[]; type: 'array' | 'group' }
  | { isLocalized: boolean; type: 'value' }
)

/** Localized containers are atomic: their descendants already belong to that locale. */
export const compileBranchScopeFields = ({
  blocks = [],
  fields,
}: {
  blocks?: Block[]
  fields: Field[]
}): BranchScopeField[] => {
  const blockDefinitions = new Map(blocks.map((block) => [block.slug, block]))
  const blockPlans = new Map<Block, BranchScopeField[]>()

  const compileFields = ({
    fields: input,
    isRoot = false,
  }: {
    fields: Field[]
    isRoot?: boolean
  }): BranchScopeField[] => {
    const result: BranchScopeField[] = []

    for (const field of input) {
      if (fieldIsVirtual(field) || field.type === 'join' || field.type === 'ui') {
        continue
      }

      if (field.type === 'tabs') {
        for (const tab of field.tabs) {
          if (tabHasName(tab)) {
            result.push(
              tab.localized
                ? { name: tab.name, type: 'value', isLocalized: true }
                : { name: tab.name, type: 'group', fields: compileFields({ fields: tab.fields }) },
            )
          } else {
            result.push(...compileFields({ fields: tab.fields, isRoot }))
          }
        }

        continue
      }

      if (!fieldAffectsData(field)) {
        if ('fields' in field) {
          result.push(...compileFields({ fields: field.fields, isRoot }))
        }

        continue
      }

      if (isRoot && ['_status', 'createdAt', 'id', 'updatedAt'].includes(field.name)) {
        continue
      }

      if ('localized' in field && field.localized) {
        result.push({ name: field.name, type: 'value', isLocalized: true })
      } else if (field.type === 'array' || field.type === 'group') {
        result.push({
          name: field.name,
          type: field.type,
          fields: compileFields({ fields: field.fields }),
        })
      } else if (field.type === 'blocks') {
        const compiledBlocks = new Map<string, BranchScopeField[]>()

        for (const definition of field.blocks) {
          const block =
            typeof definition === 'string' ? blockDefinitions.get(definition) : definition

          if (!block) {
            const slug = typeof definition === 'string' ? definition : definition.slug

            throw new Error(`Missing block definition "${slug}" in branch scope plan.`)
          }

          let plan = blockPlans.get(block)

          if (!plan) {
            plan = []
            blockPlans.set(block, plan)
            plan.push(...compileFields({ fields: block.fields }))
          }

          compiledBlocks.set(block.slug, plan)
        }

        result.push({ name: field.name, type: 'blocks', blocks: compiledBlocks })
      } else {
        result.push({ name: field.name, type: 'value', isLocalized: false })
      }
    }

    return result
  }

  return compileFields({ fields, isRoot: true })
}
