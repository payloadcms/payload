import { z } from 'zod'

export const toolSchemas = {
  findGlobal: {
    description: 'Find a Payload global singleton configuration.',
    parameters: z.object({
      depth: z
        .number()
        .int()
        .min(0)
        .max(10)
        .optional()
        .default(0)
        .describe('Depth of population for relationships'),
      fallbackLocale: z
        .string()
        .optional()
        .describe('Optional: fallback locale code to use when requested locale is not available'),
      locale: z
        .string()
        .optional()
        .describe(
          'Optional: locale code to retrieve data in (e.g., "en", "es"). Use "all" to retrieve all locales for localized fields',
        ),
      select: z
        .string()
        .optional()
        .describe(
          "Optional: define exactly which fields you'd like to return in the response (JSON), e.g., '{\"title\": true}'",
        ),
    }),
  },

  findDocuments: {
    description: 'Find documents in a collection by ID or where clause using Find or FindByID.',
    parameters: z.object({
      id: z
        .union([z.string(), z.number()])
        .optional()
        .describe(
          'Optional: specific document ID to retrieve. If not provided, returns all documents',
        ),
      depth: z
        .number()
        .int()
        .min(0)
        .max(10)
        .optional()
        .default(0)
        .describe('How many levels deep to populate relationships (default: 0)'),
      draft: z
        .boolean()
        .optional()
        .describe(
          'Optional: Whether the document should be queried from the versions table/collection or not.',
        ),
      fallbackLocale: z
        .string()
        .optional()
        .describe('Optional: fallback locale code to use when requested locale is not available'),
      limit: z
        .number()
        .int()
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit cannot exceed 100')
        .optional()
        .default(10)
        .describe('Maximum number of documents to return (default: 10, max: 100)'),
      locale: z
        .string()
        .optional()
        .describe(
          'Optional: locale code to retrieve data in (e.g., "en", "es"). Use "all" to retrieve all locales for localized fields',
        ),
      page: z
        .number()
        .int()
        .min(1, 'Page must be at least 1')
        .optional()
        .default(1)
        .describe('Page number for pagination (default: 1)'),
      select: z
        .string()
        .optional()
        .describe(
          "Optional: define exactly which fields you'd like to return in the response (JSON), e.g., '{\"title\": true}'",
        ),
      sort: z
        .string()
        .optional()
        .describe('Field to sort by (e.g., "createdAt", "-updatedAt" for descending)'),
      where: z
        .string()
        .optional()
        .describe(
          'Optional JSON string for where clause filtering (e.g., \'{"title": {"contains": "test"}}\')',
        ),
    }),
  },

  createDocument: {
    description: 'Create a document in a collection.',
    parameters: z.object({
      data: z.string().describe('JSON string containing the data for the new document'),
      depth: z
        .number()
        .int()
        .min(0)
        .max(10)
        .optional()
        .default(0)
        .describe('How many levels deep to populate relationships in response (default: 0)'),
      draft: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to create the document as a draft'),
      fallbackLocale: z
        .string()
        .optional()
        .describe('Optional: fallback locale code to use when requested locale is not available'),
      locale: z
        .string()
        .optional()
        .describe(
          'Optional: locale code to create the document in (e.g., "en", "es"). Defaults to the default locale',
        ),
      select: z
        .string()
        .optional()
        .describe(
          "Optional: define exactly which fields you'd like to return in the response (JSON), e.g., '{\"title\": true}'",
        ),
    }),
  },

  updateDocument: {
    description: 'Update documents in a collection by ID or where clause.',
    parameters: z.object({
      id: z
        .union([z.string(), z.number()])
        .optional()
        .describe('Optional: specific document ID to update'),
      data: z.string().describe('JSON string containing the data to update'),
      depth: z
        .number()
        .int()
        .min(0)
        .max(10)
        .optional()
        .default(0)
        .describe('Depth of population for relationships'),
      draft: z.boolean().optional().default(false).describe('Whether to update as a draft'),
      fallbackLocale: z
        .string()
        .optional()
        .describe('Optional: fallback locale code to use when requested locale is not available'),
      filePath: z.string().optional().describe('Optional: absolute file path for file uploads'),
      locale: z
        .string()
        .optional()
        .describe(
          'Optional: locale code to update the document in (e.g., "en", "es"). Defaults to the default locale',
        ),
      overrideLock: z
        .boolean()
        .optional()
        .default(true)
        .describe('Whether to override document locks'),
      overwriteExistingFiles: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to overwrite existing files'),
      select: z
        .string()
        .optional()
        .describe(
          "Optional: define exactly which fields you'd like to return in the response (JSON), e.g., '{\"title\": true}'",
        ),
      where: z
        .string()
        .optional()
        .describe('Optional: JSON string for where clause to update multiple documents'),
    }),
  },

  deleteDocument: {
    description: 'Delete documents in a collection by ID or where clause.',
    parameters: z.object({
      id: z
        .union([z.string(), z.number()])
        .optional()
        .describe('Optional: specific document ID to delete'),
      depth: z
        .number()
        .int()
        .min(0)
        .max(10)
        .optional()
        .default(0)
        .describe('Depth of population for relationships in response'),
      fallbackLocale: z
        .string()
        .optional()
        .describe('Optional: fallback locale code to use when requested locale is not available'),
      locale: z
        .string()
        .optional()
        .describe(
          'Optional: locale code for the operation (e.g., "en", "es"). Defaults to the default locale',
        ),
      where: z
        .string()
        .optional()
        .describe('Optional: JSON string for where clause to delete multiple documents'),
    }),
  },

  updateGlobal: {
    description: 'Update a Payload global singleton configuration.',
    parameters: z.object({
      data: z.string().describe('JSON string containing the data to update'),
      depth: z
        .number()
        .int()
        .min(0)
        .max(10)
        .optional()
        .default(0)
        .describe('Depth of population for relationships'),
      draft: z.boolean().optional().default(false).describe('Whether to update as a draft'),
      fallbackLocale: z
        .string()
        .optional()
        .describe('Optional: fallback locale code to use when requested locale is not available'),
      locale: z
        .string()
        .optional()
        .describe(
          'Optional: locale code to update data in (e.g., "en", "es"). Use "all" to update all locales for localized fields',
        ),
      select: z
        .string()
        .optional()
        .describe(
          "Optional: define exactly which fields you'd like to return in the response (JSON), e.g., '{\"siteName\": true}'",
        ),
    }),
  },

  auth: {
    description: 'Checks authentication status for the current user.',
    parameters: z.object({
      headers: z
        .string()
        .optional()
        .describe(
          'Optional JSON string containing custom headers to send with the authentication request',
        ),
    }),
  },

  login: {
    description: 'Authenticates a user with email and password.',
    parameters: z.object({
      collection: z.string().describe('The collection containing the user (e.g., "users")'),
      depth: z
        .number()
        .int()
        .min(0)
        .max(10)
        .optional()
        .default(0)
        .describe('Depth of population for relationships'),
      email: z.email().describe('The user email address'),
      overrideAccess: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to override access controls'),
      password: z.string().describe('The user password'),
      showHiddenFields: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to show hidden fields in the response'),
    }),
  },

  verify: {
    description: 'Verifies a user email with a verification token.',
    parameters: z.object({
      collection: z.string().describe('The collection containing the user (e.g., "users")'),
      token: z.string().describe('The verification token sent to the user email'),
    }),
  },

  resetPassword: {
    description: 'Resets a user password with a reset token.',
    parameters: z.object({
      collection: z.string().describe('The collection containing the user (e.g., "users")'),
      password: z.string().describe('The new password for the user'),
      token: z.string().describe('The password reset token sent to the user email'),
    }),
  },

  forgotPassword: {
    description: 'Sends a password reset email to a user.',
    parameters: z.object({
      collection: z.string().describe('The collection containing the user (e.g., "users")'),
      disableEmail: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to disable sending the email (for testing)'),
      email: z.email().describe('The user email address'),
    }),
  },

  unlock: {
    description: 'Unlocks a user account that has been locked due to failed login attempts.',
    parameters: z.object({
      collection: z.string().describe('The collection containing the user (e.g., "users")'),
      email: z.email().describe('The user email address'),
    }),
  },
}
