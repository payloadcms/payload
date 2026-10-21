import type { BranchScopeField } from './compileBranchScopeFields.js'

export const hasLocalizedBranchFields = ({
  fields,
  visited = new Set<readonly BranchScopeField[]>(),
}: {
  fields: readonly BranchScopeField[]
  visited?: Set<readonly BranchScopeField[]>
}): boolean => {
  if (visited.has(fields)) {
    return false
  }

  visited.add(fields)

  return fields.some((field) => {
    if (field.type === 'value') {
      return field.isLocalized
    }

    if (field.type === 'blocks') {
      return [...field.blocks.values()].some((fields) =>
        hasLocalizedBranchFields({ fields, visited }),
      )
    }

    return hasLocalizedBranchFields({ fields: field.fields, visited })
  })
}

export const hasSharedBranchStructure = ({
  fields,
}: {
  fields: readonly BranchScopeField[]
}): boolean => {
  return fields.some((field) => {
    if (field.type === 'value') {
      return false
    }

    if (field.type === 'blocks') {
      return [...field.blocks.values()].some((fields) => hasLocalizedBranchFields({ fields }))
    }

    return hasLocalizedBranchFields({ fields: field.fields })
  })
}
