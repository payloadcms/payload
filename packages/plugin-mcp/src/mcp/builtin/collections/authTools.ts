import type { CollectionTool, JsonSchemaObject, MCPToolResponse } from '../../../types.js'
import type { CollectionBuiltinAuthToolKey } from '../../constants.js'

import { getLogger } from '../../../utils/getLogger.js'
import { normalizeInput } from '../../normalizeInput.js'
import { toolSchemas } from '../schemas.js'

/**
 * Auth tools surfaced under `collections.<auth-collection>.tools`. Opt-in: they
 * default off (an LLM with `login` access can probe passwords; not something
 * to expose by default). Enable in plugin config via `tools: { login: true }`
 * (or `{ description: '...' }`).
 *
 * `auth` (check current token) doesn't actually depend on the collection at
 * runtime — `payload.auth({ headers })` is global — but it's grouped under the
 * users collection so all auth-shaped tools live in one place.
 */

export const buildAuthTool = ({
  name,
  collectionSlug,
  description,
}: {
  collectionSlug: string
  description?: string
  name: CollectionBuiltinAuthToolKey
}): CollectionTool => {
  const meta = AUTH_TOOL_META[name]
  return {
    description: description || meta.description,
    handler: makeHandler(name, collectionSlug),
    input: meta.inputSchema,
  }
}

const AUTH_TOOL_META: Record<
  CollectionBuiltinAuthToolKey,
  { description: string; inputSchema: JsonSchemaObject }
> = {
  auth: {
    description: toolSchemas.auth.description,
    inputSchema: normalizeInput(toolSchemas.auth.parameters),
  },
  forgotPassword: {
    description: toolSchemas.forgotPassword.description,
    inputSchema: normalizeInput(toolSchemas.forgotPassword.parameters),
  },
  login: {
    description: toolSchemas.login.description,
    inputSchema: normalizeInput(toolSchemas.login.parameters),
  },
  resetPassword: {
    description: toolSchemas.resetPassword.description,
    inputSchema: normalizeInput(toolSchemas.resetPassword.parameters),
  },
  unlock: {
    description: toolSchemas.unlock.description,
    inputSchema: normalizeInput(toolSchemas.unlock.parameters),
  },
  verify: {
    description: toolSchemas.verify.description,
    inputSchema: normalizeInput(toolSchemas.verify.parameters),
  },
}

const makeHandler =
  (name: CollectionBuiltinAuthToolKey, collectionSlug: string): CollectionTool['handler'] =>
  async ({ input, req }): Promise<MCPToolResponse> => {
    const payload = req.payload
    const logger = getLogger({ payload })

    try {
      switch (name) {
        case 'auth': {
          const headersInput = input.headers as string | undefined
          let authHeaders = new Headers()
          if (headersInput) {
            try {
              authHeaders = new Headers(JSON.parse(headersInput) as Record<string, string>)
            } catch {
              logger.warn(`Invalid headers JSON for auth: ${headersInput}, using empty headers`)
            }
          }
          const result = await payload.auth({ headers: authHeaders })
          return {
            content: [
              {
                type: 'text',
                text: `# Authentication Status\n\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
              },
            ],
          }
        }

        case 'forgotPassword': {
          const result = await payload.forgotPassword({
            collection: collectionSlug,
            data: { email: input.email as string },
            disableEmail: (input.disableEmail as boolean | undefined) ?? false,
          })
          return {
            content: [
              {
                type: 'text',
                text: `# Forgot Password Email Sent\n\n**Collection:** ${collectionSlug}\n**Email:** ${String(input.email)}\n\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
              },
            ],
          }
        }

        case 'login': {
          const result = await payload.login({
            collection: collectionSlug,
            data: {
              email: input.email as string,
              password: input.password as string,
            },
            depth: (input.depth as number | undefined) ?? 0,
            showHiddenFields: (input.showHiddenFields as boolean | undefined) ?? false,
          })
          return {
            content: [
              {
                type: 'text',
                text: `# Login Successful\n\n**User:** ${String(input.email)}\n**Collection:** ${collectionSlug}\n\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
              },
            ],
          }
        }

        case 'resetPassword': {
          const result = await payload.resetPassword({
            collection: collectionSlug,
            data: {
              password: input.password as string,
              token: input.token as string,
            },
            overrideAccess: true,
          })
          return {
            content: [
              {
                type: 'text',
                text: `# Password Reset Successful\n\n**Collection:** ${collectionSlug}\n\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
              },
            ],
          }
        }

        case 'unlock': {
          const result = await payload.unlock({
            collection: collectionSlug,
            data: { email: input.email as string },
            overrideAccess: true,
          })
          return {
            content: [
              {
                type: 'text',
                text: `# Account Unlocked\n\n**Collection:** ${collectionSlug}\n**Email:** ${String(input.email)}\n**Result:** ${result ? 'Success' : 'Failed'}`,
              },
            ],
          }
        }

        case 'verify': {
          const result = await payload.verifyEmail({
            collection: collectionSlug,
            token: input.token as string,
          })
          return {
            content: [
              {
                type: 'text',
                text: `# Email Verification Successful\n\n**Collection:** ${collectionSlug}\n**Result:** ${result ? 'Success' : 'Failed'}`,
              },
            ],
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Error in auth tool "${name}" on ${collectionSlug}: ${errorMessage}`)
      return {
        content: [{ type: 'text', text: `❌ **Error in ${name}**: ${errorMessage}` }],
      }
    }
  }
