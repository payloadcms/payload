import type { ClientBlock, ClientField, Field } from 'payload'

type TraverseForLocalizedFieldsOptions = {
  blocksMap?: Record<string, ClientBlock>
}

export const traverseForLocalizedFields = (
  fields: ClientField[] | Field[],
  { blocksMap }: TraverseForLocalizedFieldsOptions = {},
): boolean => {
  return traverseFields({
    blocksMap,
    fields,
    visitedBlockSlugs: new Set(),
  })
}

const traverseFields = ({
  blocksMap,
  fields,
  visitedBlockSlugs,
}: {
  blocksMap?: Record<string, ClientBlock>
  fields: ClientField[] | Field[]
  visitedBlockSlugs: Set<string>
}): boolean => {
  for (const field of fields) {
    if ('localized' in field && field.localized) {
      return true
    }

    switch (field.type) {
      case 'array':
      case 'collapsible':
      case 'group':
      case 'row':
        if (
          field.fields &&
          traverseFields({
            blocksMap,
            fields: field.fields,
            visitedBlockSlugs,
          })
        ) {
          return true
        }
        break

      case 'blocks':
        if (field.blocks) {
          for (const blockOrSlug of field.blocks) {
            if (typeof blockOrSlug === 'string' && visitedBlockSlugs.has(blockOrSlug)) {
              continue
            }

            const block = typeof blockOrSlug === 'string' ? blocksMap?.[blockOrSlug] : blockOrSlug

            if (typeof blockOrSlug === 'string') {
              visitedBlockSlugs.add(blockOrSlug)
            }

            if (
              block?.fields &&
              traverseFields({
                blocksMap,
                fields: block.fields,
                visitedBlockSlugs,
              })
            ) {
              return true
            }
          }
        }
        break

      case 'tabs':
        if (field.tabs) {
          for (const tab of field.tabs) {
            if ('localized' in tab && tab.localized) {
              return true
            }
            if (
              'fields' in tab &&
              tab.fields &&
              traverseFields({
                blocksMap,
                fields: tab.fields,
                visitedBlockSlugs,
              })
            ) {
              return true
            }
          }
        }
        break
    }
  }

  return false
}
