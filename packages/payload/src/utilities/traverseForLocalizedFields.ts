import type { Block, Field } from '../fields/config/types.js'

/**
 * Whether any field in the tree is localized, including fields nested in arrays, groups, rows,
 * collapsibles, tabs and blocks.
 *
 * A `blocks` field may hold either an inline block or a slug referencing `config.blocks`. Pass
 * `blocks` (the root block registry) so referenced blocks can be resolved - without it, a block
 * reference is skipped and its localized fields go unnoticed.
 */
export const traverseForLocalizedFields = ({
  blocks,
  fields,
}: {
  blocks?: Block[]
  fields: Field[]
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
        if (field.fields && traverseForLocalizedFields({ blocks, fields: field.fields })) {
          return true
        }
        break

      case 'blocks':
        if (field.blocks) {
          for (const blockOrSlug of field.blocks) {
            const block =
              typeof blockOrSlug === 'string'
                ? blocks?.find((each) => each.slug === blockOrSlug)
                : blockOrSlug

            if (block?.fields && traverseForLocalizedFields({ blocks, fields: block.fields })) {
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
              traverseForLocalizedFields({ blocks, fields: tab.fields })
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
