import type { PayloadRequest } from '../types/index.js'
import type { InstructionTarget } from './shared.js'

import { instructionsCollectionSlug } from './shared.js'

/** Reads the same configured and saved instructions for MCP and CLI consumers. */
export const getLLMInstructions = async ({
  slug,
  type,
  overrideAccess = false,
  req,
}: {
  overrideAccess?: boolean
  req: PayloadRequest
} & Pick<InstructionTarget, 'slug' | 'type'>): Promise<string> => {
  const target =
    type === 'collection'
      ? req.payload.collections[slug]?.config
      : req.payload.config.globals.find((global) => global.slug === slug)

  if (!target) {
    return ''
  }

  const collection = req.payload.collections[instructionsCollectionSlug]
  const configuredInstructions = target.llmInstructions ?? ''

  if (
    target.admin.hidden === true ||
    (type === 'collection' && slug === instructionsCollectionSlug) ||
    req.payload.config.llmInstructions === false ||
    !collection ||
    (!overrideAccess && !req.user)
  ) {
    return configuredInstructions
  }

  let additionalInstructions = ''

  try {
    const { docs } = await req.payload.find({
      collection: instructionsCollectionSlug,
      depth: 0,
      disableErrors: true,
      limit: 1,
      overrideAccess,
      req,
      user: req.user,
      where: { [type === 'collection' ? 'collectionSlug' : 'globalSlug']: { equals: slug } },
    })
    const value = docs[0]?.additionalInstructions

    if (typeof value === 'string') {
      additionalInstructions = value
    } else if (value) {
      const field = collection.config.flattenedFields.find(
        (field) => field.name === 'additionalInstructions',
      )

      if (field?.type === 'richText' && typeof field.editor !== 'function') {
        additionalInstructions = field.editor?.converters?.toMarkdown?.({ data: value }) ?? ''
      }
    }
  } catch (err) {
    req.payload.logger.error({
      err,
      msg: `Failed to read LLM instructions for ${type} "${slug}".`,
    })

    return configuredInstructions
  }

  return [configuredInstructions, additionalInstructions].filter(Boolean).join('\n\n')
}
