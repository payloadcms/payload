import type { ClientBlock, ClientField } from 'payload'

import { fieldAffectsData, fieldHasSubFields } from 'payload/shared'

import type { ClipboardPasteActionValidateArgs } from './types.js'

export function isClipboardDataValid({ data, path, ...args }: ClipboardPasteActionValidateArgs) {
  if (typeof data === 'undefined' || !path || !args.type) {
    return false
  }

  if (args.type === 'blocks') {
    return isClipboardBlocksValid({
      blocksFromClipboard: args.blocks,
      blocksFromConfig: args.schemaBlocks,
    })
  } else {
    return isClipboardFieldsValid({
      fieldsFromClipboard: args.fields,
      fieldsFromConfig: args.schemaFields,
    })
  }
}

export function isClipboardFieldsValid({
  fieldsFromClipboard,
  fieldsFromConfig,
}: {
  fieldsFromClipboard: ClientField[]
  fieldsFromConfig?: ClientField[]
}) {
  if (!fieldsFromConfig || fieldsFromClipboard.length !== fieldsFromConfig?.length) {
    return false
  }

  return fieldsFromClipboard.every((clipboardField, i) => {
    const configField = fieldsFromConfig[i]

    if (clipboardField.type !== configField.type) {
      return false
    }

    const affectsData = fieldAffectsData(clipboardField) && fieldAffectsData(configField)
    if (affectsData && clipboardField.name !== configField.name) {
      return false
    }

    const hasNestedFieldsConfig = fieldHasSubFields(configField)
    const hasNestedFieldsClipboard = fieldHasSubFields(clipboardField)
    if (hasNestedFieldsClipboard !== hasNestedFieldsConfig) {
      return false
    }

    if (hasNestedFieldsClipboard && hasNestedFieldsConfig) {
      return isClipboardFieldsValid({
        fieldsFromClipboard: clipboardField.fields,
        fieldsFromConfig: configField.fields,
      })
    }

    return true
  })
}

export function isClipboardBlocksValid({
  blocksFromClipboard,
  blocksFromConfig,
}: {
  blocksFromClipboard: ClientBlock[]
  blocksFromConfig?: ClientBlock[]
}) {
  const configBlockMap = new Map(blocksFromConfig?.map((block) => [block.slug, block]))

  if (!configBlockMap.size) {
    return false
  }

  const checkedSlugs = new Set<string>()

  for (const currBlock of blocksFromClipboard) {
    const currSlug = currBlock.slug

    if (!checkedSlugs.has(currSlug)) {
      const configBlock = configBlockMap.get(currSlug)
      if (!configBlock) {
        return false
      }

      if (
        !isClipboardFieldsValid({
          fieldsFromClipboard: currBlock.fields,
          fieldsFromConfig: configBlock.fields,
        })
      ) {
        return false
      }

      checkedSlugs.add(currSlug)
    }
  }
  return true
}

export function arePathsEquivalent(pathA: string, pathB: string) {
  const regex = /\.\d+/g
  const replacement = '.*'
  return pathA.replace(regex, replacement) === pathB.replace(regex, replacement)
}
