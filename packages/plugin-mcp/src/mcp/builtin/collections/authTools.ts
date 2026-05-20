import type { CollectionTool, JsonSchemaType, MCPToolResponse } from '../../../types.js'

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

const authInput: JsonSchemaType = {
  type: 'object',
  properties: {
    headers: {
      type: 'string',
      description:
        'Optional JSON string containing custom headers to send with the authentication request',
    },
  },
}

const forgotPasswordInput: JsonSchemaType = {
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
}

const loginInput: JsonSchemaType = {
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
}

const resetPasswordInput: JsonSchemaType = {
  type: 'object',
  properties: {
    password: { type: 'string', description: 'The new password for the user' },
    token: { type: 'string', description: 'The password reset token sent to the user email' },
  },
  required: ['password', 'token'],
}

const unlockInput: JsonSchemaType = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      description: 'The user email address',
      format: 'email',
    },
  },
  required: ['email'],
}

const verifyInput: JsonSchemaType = {
  type: 'object',
  properties: {
    token: { type: 'string', description: 'The verification token sent to the user email' },
  },
  required: ['token'],
}

const wrapError =
  (name: string) =>
  ({ collectionSlug, message }: { collectionSlug: string; message: string }): MCPToolResponse => {
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error in ${name}** on ${collectionSlug}: ${message}`,
        },
      ],
    }
  }

export const authCollectionTool: CollectionTool = {
  description: 'Checks authentication status for the current user.',
  handler: async ({ collectionSlug, input, req }) => {
    const logger = getLogger({ payload: req.payload })
    try {
      const headersInput = input.headers as string | undefined
      let authHeaders = new Headers()
      if (headersInput) {
        try {
          authHeaders = new Headers(JSON.parse(headersInput) as Record<string, string>)
        } catch {
          logger.warn(`Invalid headers JSON for auth: ${headersInput}, using empty headers`)
        }
      }
      const result = await req.payload.auth({ headers: authHeaders })
      return {
        content: [
          {
            type: 'text',
            text: `# Authentication Status\n\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
          },
        ],
        doc: result as unknown as Record<string, unknown>,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Error in auth tool on ${collectionSlug}: ${errorMessage}`)
      return wrapError('auth')({ collectionSlug, message: errorMessage })
    }
  },
  input: authInput,
}

export const forgotPasswordCollectionTool: CollectionTool = {
  description: 'Sends a password reset email to a user.',
  handler: async ({ collectionSlug, input, req }) => {
    const logger = getLogger({ payload: req.payload })
    try {
      const result = await req.payload.forgotPassword({
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
        doc: { result } as Record<string, unknown>,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Error in forgotPassword tool on ${collectionSlug}: ${errorMessage}`)
      return wrapError('forgotPassword')({ collectionSlug, message: errorMessage })
    }
  },
  input: forgotPasswordInput,
}

export const loginCollectionTool: CollectionTool = {
  description: 'Authenticates a user with email and password.',
  handler: async ({ collectionSlug, input, req }) => {
    const logger = getLogger({ payload: req.payload })
    try {
      const result = await req.payload.login({
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
        doc: result as unknown as Record<string, unknown>,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Error in login tool on ${collectionSlug}: ${errorMessage}`)
      return wrapError('login')({ collectionSlug, message: errorMessage })
    }
  },
  input: loginInput,
}

export const resetPasswordCollectionTool: CollectionTool = {
  description: 'Resets a user password with a reset token.',
  handler: async ({ collectionSlug, input, req }) => {
    const logger = getLogger({ payload: req.payload })
    try {
      const result = await req.payload.resetPassword({
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
        doc: result as unknown as Record<string, unknown>,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Error in resetPassword tool on ${collectionSlug}: ${errorMessage}`)
      return wrapError('resetPassword')({ collectionSlug, message: errorMessage })
    }
  },
  input: resetPasswordInput,
}

export const unlockCollectionTool: CollectionTool = {
  description: 'Unlocks a user account that has been locked due to failed login attempts.',
  handler: async ({ collectionSlug, input, req }) => {
    const logger = getLogger({ payload: req.payload })
    try {
      const result = await req.payload.unlock({
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
        doc: { result } as Record<string, unknown>,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Error in unlock tool on ${collectionSlug}: ${errorMessage}`)
      return wrapError('unlock')({ collectionSlug, message: errorMessage })
    }
  },
  input: unlockInput,
}

export const verifyCollectionTool: CollectionTool = {
  description: 'Verifies a user email with a verification token.',
  handler: async ({ collectionSlug, input, req }) => {
    const logger = getLogger({ payload: req.payload })
    try {
      const result = await req.payload.verifyEmail({
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
        doc: { result } as Record<string, unknown>,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Error in verify tool on ${collectionSlug}: ${errorMessage}`)
      return wrapError('verify')({ collectionSlug, message: errorMessage })
    }
  },
  input: verifyInput,
}
