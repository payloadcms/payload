import { getPayloadOperation, invokeOperation, type SelectType } from 'payload'
import { z } from 'zod'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineGlobalTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'

const updateGlobalOperation = getPayloadOperation('global', 'update')

const DEFAULT_DESCRIPTION = 'Update any Payload global by passing the global slug and data.'

export const updateGlobalTool = defineGlobalTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.globals?.[args.globalSlug]?.update),
  annotations: {
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
    readOnlyHint: false,
    title: 'Update Global',
  },
  description: DEFAULT_DESCRIPTION,
  input: z.looseObject({
    data: updateGlobalOperation.input.shape.data,
    depth: updateGlobalOperation.input.shape.depth,
    draft: updateGlobalOperation.input.shape.draft,
    fallbackLocale: updateGlobalOperation.input.shape.fallbackLocale,
    locale: updateGlobalOperation.input.shape.locale,
    populate: updateGlobalOperation.input.shape.populate,
    select: updateGlobalOperation.input.shape.select,
  }),
}).handler(async ({ authorizedMCP, globalSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })

  const { data, depth, draft, fallbackLocale, locale, select } = input

  logger.info(
    `Updating global: ${globalSlug}, draft: ${draft}${locale ? `, locale: ${locale}` : ''}`,
  )

  try {
    const updateOptions: Parameters<typeof payload.updateGlobal>[0] = {
      slug: globalSlug,
      data,
      depth,
      draft,
      overrideAccess: authorizedMCP.overrideAccess,
      req,
    }

    if (locale) {
      updateOptions.locale = locale
    }
    if (fallbackLocale) {
      updateOptions.fallbackLocale = fallbackLocale
    }
    if (select) {
      updateOptions.select = select as SelectType
    }

    const result = await invokeOperation(updateGlobalOperation, {
      context: payload,
      input: updateOptions as never,
    })

    return {
      content: [
        {
          type: 'text',
          text: `Global "${globalSlug}" updated successfully!\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error updating global ${globalSlug}: ${errorMessage}`)
    return {
      content: [{ type: 'text', text: `Error updating global "${globalSlug}": ${errorMessage}` }],
    }
  }
})
