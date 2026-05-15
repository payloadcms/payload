import type { SelectType } from 'payload'

import type { GlobalTool, MCPResponseOverride, MCPToolResponse } from '../../../types.js'

import { normalizeInput } from '../../normalizeInput.js'
import { getLogger } from '../../../utils/getLogger.js'
import { localAPIDefaults } from '../../../utils/localAPIDefaults.js'
import { toolSchemas } from '../schemas.js'

export const buildFindGlobalTool = ({
  description,
  globalSlug,
  overrideResponse,
}: {
  description?: string
  globalSlug: string
  overrideResponse?: MCPResponseOverride
}): GlobalTool => ({
  description: `${toolSchemas.findGlobal.description.trim()}${description ? `\n\n${description}` : ''}`,
  handler: async ({ input, authorizedMCP, req }) => {
    const payload = req.payload
    const logger = getLogger({ payload })

    const depth = (input.depth as number | undefined) ?? 0
    const locale = input.locale as string | undefined
    const fallbackLocale = input.fallbackLocale as string | undefined
    const select = input.select as string | undefined

    const applyOverride = (response: MCPToolResponse, doc: Record<string, unknown>) =>
      overrideResponse?.(response, doc, req) || response

    logger.info(
      `Reading global: ${globalSlug}, depth: ${depth}${locale ? `, locale: ${locale}` : ''}`,
    )

    try {
      const findOptions: Parameters<typeof payload.findGlobal>[0] = {
        slug: globalSlug,
        depth,
        ...localAPIDefaults(authorizedMCP),
      }

      let selectClause: SelectType | undefined
      if (select) {
        try {
          selectClause = JSON.parse(select) as SelectType
        } catch {
          logger.warn(`Invalid select clause JSON for global: ${select}`)
          return applyOverride(
            { content: [{ type: 'text', text: 'Error: Invalid JSON in select clause' }] },
            {},
          )
        }
      }

      if (locale) {
        findOptions.locale = locale
      }
      if (fallbackLocale) {
        findOptions.fallbackLocale = fallbackLocale
      }
      if (selectClause) {
        findOptions.select = selectClause
      }

      const result = await payload.findGlobal(findOptions)

      return applyOverride(
        {
          content: [
            {
              type: 'text',
              text: `Global "${globalSlug}":\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
            },
          ],
        },
        result as Record<string, unknown>,
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Error reading global ${globalSlug}: ${errorMessage}`)
      return applyOverride(
        {
          content: [
            { type: 'text', text: `❌ **Error reading global "${globalSlug}":** ${errorMessage}` },
          ],
        },
        {},
      )
    }
  },
  input: normalizeInput(toolSchemas.findGlobal.parameters),
  overrideResponse,
})
