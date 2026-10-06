import type { PayloadRequest } from '../types/index.js'

/** Reads configured Markdown instructions for MCP and CLI consumers. */
export const getLLMInstructions = ({
  slug,
  type,
  req,
}: {
  req: PayloadRequest
  slug: string
  type: 'collection' | 'global'
}): string => {
  const target =
    type === 'collection'
      ? req.payload.collections[slug]?.config
      : req.payload.config.globals.find((global) => global.slug === slug)

  return target?.llmInstructions ?? ''
}
