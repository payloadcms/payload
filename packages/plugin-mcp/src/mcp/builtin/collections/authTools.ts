import { z } from 'zod'

import type { MCPToolResponse } from '../../../types.js'

import { defineCollectionTool } from '../../../defineTool.js'
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

const emailSchema = z.string().email().describe('The user email address')

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

export const authCollectionTool = defineCollectionTool({
  description: 'Checks authentication status for the current user.',
  input: z.object({
    headers: z
      .string()
      .describe(
        'Optional JSON string containing custom headers to send with the authentication request',
      )
      .optional(),
  }),
}).handler(async ({ collectionSlug, input, req }) => {
  const logger = getLogger({ payload: req.payload })
  try {
    let authHeaders = new Headers()
    if (input.headers) {
      try {
        authHeaders = new Headers(JSON.parse(input.headers) as Record<string, string>)
      } catch {
        logger.warn(`Invalid headers JSON for auth: ${input.headers}, using empty headers`)
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
})

export const forgotPasswordCollectionTool = defineCollectionTool({
  description: 'Sends a password reset email to a user.',
  input: z.object({
    disableEmail: z
      .boolean()
      .describe('Whether to disable sending the email (for testing)')
      .optional()
      .default(false),
    email: emailSchema,
  }),
}).handler(async ({ collectionSlug, input, req }) => {
  const logger = getLogger({ payload: req.payload })
  try {
    const result = await req.payload.forgotPassword({
      collection: collectionSlug,
      data: { email: input.email },
      disableEmail: input.disableEmail,
    })
    return {
      content: [
        {
          type: 'text',
          text: `# Forgot Password Email Sent\n\n**Collection:** ${collectionSlug}\n**Email:** ${input.email}\n\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: { result },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error in forgotPassword tool on ${collectionSlug}: ${errorMessage}`)
    return wrapError('forgotPassword')({ collectionSlug, message: errorMessage })
  }
})

export const loginCollectionTool = defineCollectionTool({
  description: 'Authenticates a user with email and password.',
  input: z.object({
    depth: z
      .number()
      .int()
      .min(0)
      .max(10)
      .describe('Depth of population for relationships')
      .optional()
      .default(0),
    email: emailSchema,
    password: z.string().describe('The user password'),
    showHiddenFields: z
      .boolean()
      .describe('Whether to show hidden fields in the response')
      .optional()
      .default(false),
  }),
}).handler(async ({ collectionSlug, input, req }) => {
  const logger = getLogger({ payload: req.payload })
  try {
    const result = await req.payload.login({
      collection: collectionSlug,
      data: { email: input.email, password: input.password },
      depth: input.depth,
      showHiddenFields: input.showHiddenFields,
    })
    return {
      content: [
        {
          type: 'text',
          text: `# Login Successful\n\n**User:** ${input.email}\n**Collection:** ${collectionSlug}\n\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result as unknown as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error in login tool on ${collectionSlug}: ${errorMessage}`)
    return wrapError('login')({ collectionSlug, message: errorMessage })
  }
})

export const resetPasswordCollectionTool = defineCollectionTool({
  description: 'Resets a user password with a reset token.',
  input: z.object({
    password: z.string().describe('The new password for the user'),
    token: z.string().describe('The password reset token sent to the user email'),
  }),
}).handler(async ({ collectionSlug, input, req }) => {
  const logger = getLogger({ payload: req.payload })
  try {
    const result = await req.payload.resetPassword({
      collection: collectionSlug,
      data: { password: input.password, token: input.token },
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
})

export const unlockCollectionTool = defineCollectionTool({
  description: 'Unlocks a user account that has been locked due to failed login attempts.',
  input: z.object({ email: emailSchema }),
}).handler(async ({ collectionSlug, input, req }) => {
  const logger = getLogger({ payload: req.payload })
  try {
    const result = await req.payload.unlock({
      collection: collectionSlug,
      data: { email: input.email },
      overrideAccess: true,
    })
    return {
      content: [
        {
          type: 'text',
          text: `# Account Unlocked\n\n**Collection:** ${collectionSlug}\n**Email:** ${input.email}\n**Result:** ${result ? 'Success' : 'Failed'}`,
        },
      ],
      doc: { result },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error in unlock tool on ${collectionSlug}: ${errorMessage}`)
    return wrapError('unlock')({ collectionSlug, message: errorMessage })
  }
})

export const verifyCollectionTool = defineCollectionTool({
  description: 'Verifies a user email with a verification token.',
  input: z.object({
    token: z.string().describe('The verification token sent to the user email'),
  }),
}).handler(async ({ collectionSlug, input, req }) => {
  const logger = getLogger({ payload: req.payload })
  try {
    const result = await req.payload.verifyEmail({
      collection: collectionSlug,
      token: input.token,
    })
    return {
      content: [
        {
          type: 'text',
          text: `# Email Verification Successful\n\n**Collection:** ${collectionSlug}\n**Result:** ${result ? 'Success' : 'Failed'}`,
        },
      ],
      doc: { result },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error in verify tool on ${collectionSlug}: ${errorMessage}`)
    return wrapError('verify')({ collectionSlug, message: errorMessage })
  }
})
