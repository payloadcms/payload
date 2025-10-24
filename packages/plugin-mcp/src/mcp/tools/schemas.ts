import { z } from 'zod'

export const toolSchemas = {
  findResources: {
    description: 'Find documents in a Payload collection using Find or FindByID.',
    parameters: z.object({
      id: z
        .string()
        .optional()
        .describe(
          'Optional: specific document ID to retrieve. If not provided, returns all documents',
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

  createResource: {
    description: 'Create a document in a Payload collection.',
    parameters: z.object({
      data: z.string().describe('JSON string containing the data for the new document'),
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
    }),
  },

  updateResource: {
    description: 'Update documents in a Payload collection by ID or where clause.',
    parameters: z.object({
      id: z.string().optional().describe('Optional: specific document ID to update'),
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
      where: z
        .string()
        .optional()
        .describe('Optional: JSON string for where clause to update multiple documents'),
    }),
  },

  deleteResource: {
    description: 'Delete documents in a Payload collection by ID or where clause.',
    parameters: z.object({
      id: z.string().optional().describe('Optional: specific document ID to delete'),
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

  // Experimental Below This Line
  createCollection: {
    description: 'Creates a new Payload collection with specified fields and configuration.',
    parameters: z.object({
      collectionDescription: z
        .string()
        .optional()
        .describe('Optional description for the collection'),
      collectionName: z.string().describe('The name of the collection to create'),
      fields: z.array(z.any()).describe('Array of field definitions for the collection'),
      hasUpload: z
        .boolean()
        .optional()
        .describe('Whether the collection should have upload capabilities'),
    }),
  },

  findCollections: {
    description: 'Finds and lists Payload collections with optional content and document counts.',
    parameters: z.object({
      collectionName: z
        .string()
        .optional()
        .describe('Optional: specific collection name to retrieve'),
      includeContent: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to include collection file content'),
      includeCount: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to include document counts for each collection'),
    }),
  },

  updateCollection: {
    description:
      'Updates an existing Payload collection with new fields, modifications, or configuration changes.',
    parameters: z.object({
      collectionName: z.string().describe('The name of the collection to update'),
      configUpdates: z.any().optional().describe('Configuration updates (for update_config type)'),
      fieldModifications: z
        .array(z.any())
        .optional()
        .describe('Field modifications (for modify_field type)'),
      fieldNamesToRemove: z
        .array(z.string())
        .optional()
        .describe('Field names to remove (for remove_field type)'),
      newContent: z
        .string()
        .optional()
        .describe('New content to replace entire collection (for replace_content type)'),
      newFields: z.array(z.any()).optional().describe('New fields to add (for add_field type)'),
      updateType: z
        .enum(['add_field', 'remove_field', 'modify_field', 'update_config', 'replace_content'])
        .describe('Type of update to perform'),
    }),
  },

  deleteCollection: {
    description: 'Deletes a Payload collection and optionally updates the configuration.',
    parameters: z.object({
      collectionName: z.string().describe('The name of the collection to delete'),
      confirmDeletion: z.boolean().describe('Confirmation flag to prevent accidental deletion'),
      updateConfig: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to update payload.config.ts to remove collection reference'),
    }),
  },

  findConfig: {
    description: 'Reads and displays the current Payload configuration file.',
    parameters: z.object({
      includeMetadata: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to include file metadata (size, modified date, etc.)'),
    }),
  },

  updateConfig: {
    description: 'Updates the Payload configuration file with various modifications.',
    parameters: z.object({
      adminConfig: z
        .any()
        .optional()
        .describe('Admin configuration updates (for update_admin type)'),
      collectionName: z
        .string()
        .optional()
        .describe('Collection name (required for add_collection and remove_collection)'),
      databaseConfig: z
        .any()
        .optional()
        .describe('Database configuration updates (for update_database type)'),
      generalConfig: z.any().optional().describe('General configuration updates'),
      newContent: z
        .string()
        .optional()
        .describe('New configuration content (for replace_content type)'),
      pluginUpdates: z
        .any()
        .optional()
        .describe('Plugin configuration updates (for update_plugins type)'),
      updateType: z
        .enum([
          'add_collection',
          'remove_collection',
          'update_admin',
          'update_database',
          'update_plugins',
          'replace_content',
        ])
        .describe('Type of configuration update to perform'),
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
      email: z.string().email().describe('The user email address'),
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
      email: z.string().email().describe('The user email address'),
    }),
  },

  unlock: {
    description: 'Unlocks a user account that has been locked due to failed login attempts.',
    parameters: z.object({
      collection: z.string().describe('The collection containing the user (e.g., "users")'),
      email: z.string().email().describe('The user email address'),
    }),
  },

  createJob: {
    description: 'Creates a new Payload job (task or workflow) with specified configuration.',
    parameters: z.object({
      description: z.string().describe('Description of what the job does'),
      inputSchema: z.record(z.any()).optional().default({}).describe('Input schema for the job'),
      jobData: z
        .record(z.any())
        .optional()
        .default({})
        .describe('Additional job configuration data'),
      jobName: z
        .string()
        .min(1, 'Job name cannot be empty')
        .regex(/^[a-z][\w-]*$/i, 'Job name must be alphanumeric and can contain underscores/dashes')
        .describe('The name of the job to create'),
      jobSlug: z
        .string()
        .min(1, 'Job slug cannot be empty')
        .regex(/^[a-z][a-z0-9-]*$/, 'Job slug must be kebab-case')
        .describe('The slug for the job (kebab-case format)'),
      jobType: z
        .enum(['task', 'workflow'])
        .describe('Whether to create a task (individual unit) or workflow (orchestrates tasks)'),
      outputSchema: z.record(z.any()).optional().default({}).describe('Output schema for the job'),
    }),
  },

  updateJob: {
    description: 'Updates an existing Payload job with new configuration, schema, or handler code.',
    parameters: z.object({
      configUpdate: z.record(z.any()).optional().describe('New configuration for the job'),
      handlerCode: z
        .string()
        .optional()
        .describe('New handler code to replace the existing handler'),
      inputSchema: z.record(z.any()).optional().describe('New input schema for the job'),
      jobSlug: z.string().describe('The slug of the job to update'),
      outputSchema: z.record(z.any()).optional().describe('New output schema for the job'),
      taskSequence: z.array(z.any()).optional().describe('New task sequence for workflows'),
      updateType: z
        .enum(['modify_schema', 'update_tasks', 'change_config', 'replace_handler'])
        .describe('Type of update to perform on the job'),
    }),
  },

  runJob: {
    description: 'Runs a Payload job with specified input data and queue options.',
    parameters: z.object({
      delay: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe('Delay in milliseconds before job execution'),
      input: z.record(z.any()).describe('Input data for the job execution'),
      jobSlug: z.string().describe('The slug of the job to run'),
      priority: z
        .number()
        .int()
        .min(1)
        .max(10)
        .optional()
        .describe('Job priority (1-10, higher is more important)'),
      queue: z
        .string()
        .optional()
        .describe('Queue name to use for job execution (default: "default")'),
    }),
  },
}
