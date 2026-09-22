import { createLocalReq, strictObject, z } from 'payload'

import type { MCPToolResponse } from '../../../types.js'

import { defaultAccess } from '../../../defaultAccess.js'
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

const emailSchema = z.email().check(z.describe('The user email address.'))

const wrapError =
  (name: string) =>
  ({ slug, message }: { message: string; slug: string }): MCPToolResponse => {
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error in ${name}** on ${slug}: ${message}`,
        },
      ],
    }
  }

export const authCollectionTool = defineCollectionTool({
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Check Auth Status',
  },
  description: 'Checks authentication status for the current user.',
  input: strictObject({
    headers: z
      .optional(z.record(z.string(), z.string()))
      .check(z.describe('Custom headers to send with the authentication request.')),
  }),
}).handler(async ({ slug, authorizedMCP, input, req }) => {
  const logger = getLogger({ payload: req.payload })
  try {
    let authHeaders = new Headers()
    if (input.headers) {
      authHeaders = new Headers(input.headers)
    }
    const authReq = await createLocalReq({ req: { headers: authHeaders } }, req.payload)
    const result = await req.payload.auth({ headers: authHeaders, req: authReq })

    if (result.user) {
      const authenticatedUser = result.user
      // Auth strategies read users with trusted Local API access. Re-read the user with the MCP
      // caller's access level before returning it to the client.
      const user = await req.payload.findByID({
        id: authenticatedUser.id,
        collection: authenticatedUser.collection,
        overrideAccess: authorizedMCP.overrideAccess,
        req: authReq,
      })
      result.user = {
        ...user,
        _sid: authenticatedUser._sid,
        _strategy: authenticatedUser._strategy,
        collection: authenticatedUser.collection,
      }
    }
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
    logger.error(`Error in auth tool on ${slug}: ${errorMessage}`)
    return wrapError('auth')({ slug, message: errorMessage })
  }
})

export const forgotPasswordCollectionTool = defineCollectionTool({
  annotations: {
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
    readOnlyHint: false,
    title: 'Forgot Password',
  },
  description: 'Sends a password reset email to a user.',
  input: strictObject({
    email: emailSchema,
  }),
}).handler(async ({ slug, input, req }) => {
  const logger = getLogger({ payload: req.payload })
  try {
    await req.payload.forgotPassword({
      collection: slug,
      data: { email: input.email },
      disableEmail: false,
      overrideAccess: false,
      req,
    })
    return {
      content: [
        {
          type: 'text',
          text: 'If an account matches that email, password reset instructions have been sent.',
        },
      ],
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error in forgotPassword tool on ${slug}: ${errorMessage}`)
    return wrapError('forgotPassword')({ slug, message: errorMessage })
  }
})

export const loginCollectionTool = defineCollectionTool({
  annotations: {
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
    readOnlyHint: false,
    title: 'User Login',
  },
  description: 'Authenticates a user with email and password.',
  input: strictObject({
    depth: z
      ._default(z.int().check(z.minimum(0), z.maximum(10)), 0)
      .check(z.describe('Depth of population for relationships.')),
    email: emailSchema,
    password: z.string().check(z.describe('The user password.')),
  }),
}).handler(async ({ slug, authorizedMCP, input, req }) => {
  const logger = getLogger({ payload: req.payload })
  try {
    const result = await req.payload.login({
      collection: slug,
      data: { email: input.email, password: input.password },
      depth: input.depth,
      overrideAccess: authorizedMCP.overrideAccess,
    })
    return {
      content: [
        {
          type: 'text',
          text: `# Login Successful\n\n**User:** ${input.email}\n**Collection:** ${slug}\n\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result as unknown as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error in login tool on ${slug}: ${errorMessage}`)
    return wrapError('login')({ slug, message: errorMessage })
  }
})

export const resetPasswordCollectionTool = defineCollectionTool({
  annotations: {
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
    readOnlyHint: false,
    title: 'Reset Password',
  },
  description: 'Resets a user password with a reset token.',
  input: strictObject({
    password: z.string().check(z.describe('The new password for the user.')),
    token: z.string().check(z.describe('The password reset token sent to the user email.')),
  }),
}).handler(async ({ slug, authorizedMCP, input, req }) => {
  const logger = getLogger({ payload: req.payload })
  try {
    const result = await req.payload.resetPassword({
      collection: slug,
      data: { password: input.password, token: input.token },
      overrideAccess: authorizedMCP.overrideAccess,
    })
    return {
      content: [
        {
          type: 'text',
          text: `# Password Reset Successful\n\n**Collection:** ${slug}\n\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result as unknown as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error in resetPassword tool on ${slug}: ${errorMessage}`)
    return wrapError('resetPassword')({ slug, message: errorMessage })
  }
})

export const unlockCollectionTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.collections?.[args.slug]?.unlock),
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: false,
    title: 'Unlock Account',
  },
  description: 'Unlocks a user account that has been locked due to failed login attempts.',
  input: strictObject({ email: emailSchema }),
}).handler(async ({ slug, authorizedMCP, input, req }) => {
  const logger = getLogger({ payload: req.payload })
  try {
    const result = await req.payload.unlock({
      collection: slug,
      data: { email: input.email },
      overrideAccess: authorizedMCP.overrideAccess,
      req,
    })
    return {
      content: [
        {
          type: 'text',
          text: `# Account Unlocked\n\n**Collection:** ${slug}\n**Email:** ${input.email}\n**Result:** ${result ? 'Success' : 'Failed'}`,
        },
      ],
      doc: { result } as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error in unlock tool on ${slug}: ${errorMessage}`)
    return wrapError('unlock')({ slug, message: errorMessage })
  }
})

export const verifyCollectionTool = defineCollectionTool({
  annotations: {
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
    readOnlyHint: false,
    title: 'Email Verification',
  },
  description: 'Verifies a user email with a verification token.',
  input: strictObject({
    token: z.string().check(z.describe('The verification token sent to the user email.')),
  }),
}).handler(async ({ slug, input, req }) => {
  const logger = getLogger({ payload: req.payload })
  try {
    const result = await req.payload.verifyEmail({
      collection: slug,
      token: input.token,
    })
    return {
      content: [
        {
          type: 'text',
          text: `# Email Verification Successful\n\n**Collection:** ${slug}\n**Result:** ${result ? 'Success' : 'Failed'}`,
        },
      ],
      doc: { result } as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error in verify tool on ${slug}: ${errorMessage}`)
    return wrapError('verify')({ slug, message: errorMessage })
  }
})
