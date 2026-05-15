import type { CollectionTool, JsonSchemaObject, MCPToolResponse } from '../../../types.js'
import type { CollectionBuiltinAuthToolKey } from '../../constants.js'

import { getLogger } from '../../../utils/getLogger.js'

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
    description: 'Checks authentication status for the current user.',
    inputSchema: {
      type: 'object',
      properties: {
        headers: {
          type: 'string',
          description:
            'Optional JSON string containing custom headers to send with the authentication request',
        },
      },
    },
  },
  forgotPassword: {
    description: 'Sends a password reset email to a user.',
    inputSchema: {
      type: 'object',
      properties: {
        disableEmail: {
          type: 'boolean',
          default: false,
          description: 'Whether to disable sending the email (for testing)',
        },
        email: {
          type: 'string',
          description: 'The user email address',
          format: 'email',
        },
      },
      required: ['email'],
    },
  },
  login: {
    description: 'Authenticates a user with email and password.',
    inputSchema: {
      type: 'object',
      properties: {
        depth: {
          type: 'integer',
          default: 0,
          description: 'Depth of population for relationships',
          maximum: 10,
          minimum: 0,
        },
        email: {
          type: 'string',
          description: 'The user email address',
          format: 'email',
        },
        password: { type: 'string', description: 'The user password' },
        showHiddenFields: {
          type: 'boolean',
          default: false,
          description: 'Whether to show hidden fields in the response',
        },
      },
      required: ['email', 'password'],
    },
  },
  resetPassword: {
    description: 'Resets a user password with a reset token.',
    inputSchema: {
      type: 'object',
      properties: {
        password: { type: 'string', description: 'The new password for the user' },
        token: { type: 'string', description: 'The password reset token sent to the user email' },
      },
      required: ['password', 'token'],
    },
  },
  unlock: {
    description: 'Unlocks a user account that has been locked due to failed login attempts.',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'The user email address',
          format: 'email',
        },
      },
      required: ['email'],
    },
  },
  verify: {
    description: 'Verifies a user email with a verification token.',
    inputSchema: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'The verification token sent to the user email' },
      },
      required: ['token'],
    },
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
