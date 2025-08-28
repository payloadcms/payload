import { z } from 'zod'

export const toolSchemas = {
  findResources: {
    description: 'Finds documents in a Payload collection using Find or FindByID',
    parameters: z.object({
      id: z
        .string()
        .optional()
        .describe(
          'Optional: specific document ID to retrieve. If not provided, returns all documents',
        ),
      collection: z
        .string()
        .min(1, 'Collection name is required')
        .describe('The name of the collection to read from (e.g. "media", "users")'),
      limit: z
        .number()
        .int()
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit cannot exceed 100')
        .optional()
        .default(10)
        .describe('Maximum number of documents to return (default: 10, max: 100)'),
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
    description: 'Creates a document in a Payload collection',
    parameters: z.object({
      collection: z.string().describe('The collection to create the document in'),
      data: z.string().describe('JSON string containing the data for the new document'),
      draft: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to create the document as a draft'),
    }),
  },

  updateResource: {
    description: 'Updates documents in a Payload collection by ID or where clause',
    parameters: z.object({
      id: z.string().optional().describe('Optional: specific document ID to update'),
      collection: z.string().describe('The collection to update the document in'),
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
      filePath: z.string().optional().describe('Optional: absolute file path for file uploads'),
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
    description: 'Deletes documents in a Payload collection by ID or where clause',
    parameters: z.object({
      id: z.string().optional().describe('Optional: specific document ID to delete'),
      collection: z.string().describe('The collection to delete the document from'),
      depth: z
        .number()
        .int()
        .min(0)
        .max(10)
        .optional()
        .default(0)
        .describe('Depth of population for relationships in response'),
      overrideAccess: z
        .boolean()
        .optional()
        .default(true)
        .describe('Whether to override access controls'),
      where: z
        .string()
        .optional()
        .describe('Optional: JSON string for where clause to delete multiple documents'),
    }),
  },

  createCollection: {
    description: 'Creates a new Payload collection with specified fields and configuration',
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
    description: 'Finds and lists Payload collections with optional content and document counts',
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
      'Updates an existing Payload collection with new fields, modifications, or configuration changes',
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
    description: 'Deletes a Payload collection and optionally updates the configuration',
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
    description: 'Reads and displays the current Payload configuration file',
    parameters: z.object({
      includeMetadata: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to include file metadata (size, modified date, etc.)'),
    }),
  },

  updateConfig: {
    description: 'Updates the Payload configuration file with various modifications',
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
    description: 'Checks authentication status for the current user',
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
    description: 'Authenticates a user with email and password',
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
    description: 'Verifies a user email with a verification token',
    parameters: z.object({
      collection: z.string().describe('The collection containing the user (e.g., "users")'),
      token: z.string().describe('The verification token sent to the user email'),
    }),
  },

  resetPassword: {
    description: 'Resets a user password with a reset token',
    parameters: z.object({
      collection: z.string().describe('The collection containing the user (e.g., "users")'),
      password: z.string().describe('The new password for the user'),
      token: z.string().describe('The password reset token sent to the user email'),
    }),
  },

  forgotPassword: {
    description: 'Sends a password reset email to a user',
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
    description: 'Unlocks a user account that has been locked due to failed login attempts',
    parameters: z.object({
      collection: z.string().describe('The collection containing the user (e.g., "users")'),
      email: z.string().email().describe('The user email address'),
    }),
  },

  createJob: {
    description: 'Creates a new Payload job (task or workflow) with specified configuration',
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
    description: 'Updates an existing Payload job with new configuration, schema, or handler code',
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
    description: 'Runs a Payload job with specified input data and queue options',
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

  // Figma
  figmaGetFile: {
    description:
      'Retrieves a Figma file by file key using GET /v1/files/{file_key}. Optional version or branchId query parameters are supported.',
    parameters: z.object({
      branchId: z
        .string()
        .optional()
        .describe('Optional branch ID to retrieve a specific branch of the file.'),
      fileKey: z
        .string()
        .min(1, 'fileKey is required')
        .describe('The Figma file key (from the file URL).'),
      includeRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe('When true, include a truncated raw JSON block after the summary.'),
      logRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          'When true and verbose logs are enabled, logs a truncated raw JSON to the server logs.',
        ),
      maxChars: z
        .number()
        .int()
        .min(1000)
        .max(800000)
        .optional()
        .default(200000)
        .describe('Maximum number of characters to include when returning raw JSON.'),
      summary: z
        .boolean()
        .optional()
        .default(true)
        .describe(
          'Return a summarized view of the file (recommended to avoid very large responses).',
        ),
      version: z
        .string()
        .optional()
        .describe('Optional version ID to retrieve a specific version of the file.'),
    }),
  },

  figmaGetFileNodes: {
    description:
      'Retrieves specific nodes from a Figma file using GET /v1/files/{file_key}/nodes with a list of node IDs.',
    parameters: z.object({
      fileKey: z
        .string()
        .min(1, 'fileKey is required')
        .describe('The Figma file key (from the file URL).'),
      ids: z
        .union([z.string(), z.array(z.string())])
        .describe(
          'Node IDs to retrieve. Accepts a comma-separated string or an array of node IDs (e.g., ["12:34", "56:78"]).',
        ),
      includeRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe('When true, include a truncated raw JSON block in the response.'),
      logRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          'When true and verbose logs are enabled, logs truncated raw JSON for the nodes to the server logs.',
        ),
      maxChars: z
        .number()
        .int()
        .min(1000)
        .max(800000)
        .optional()
        .default(200000)
        .describe('Maximum number of characters to include when returning raw JSON.'),
    }),
  },

  figmaGetImages: {
    description:
      'Retrieves image URLs for specific nodes in a Figma file using GET /v1/images/{file_key}.',
    parameters: z.object({
      fileKey: z
        .string()
        .min(1, 'fileKey is required')
        .describe('The Figma file key (from the file URL).'),
      format: z.enum(['jpg', 'png', 'svg', 'pdf']).optional().describe('Output image format.'),
      ids: z
        .union([z.string(), z.array(z.string())])
        .describe(
          'Node IDs to render. Accepts a comma-separated string or an array of node IDs (e.g., ["12:34", "56:78"]).',
        ),
      scale: z
        .number()
        .min(0.01)
        .max(4)
        .optional()
        .describe('Scale factor for the image output (0.01–4). Default is 1.'),
      svgIncludeId: z
        .boolean()
        .optional()
        .describe('For SVG output, include the node id as an attribute on every element.'),
      svgSimplifyStroke: z
        .boolean()
        .optional()
        .describe('For SVG output, convert strokes to paths where possible.'),
      useAbsoluteBounds: z
        .boolean()
        .optional()
        .describe('Use full node bounds for rendering, ignoring strokes and effects.'),
      version: z
        .string()
        .optional()
        .describe('Optional version ID to render images from a specific version of the file.'),
    }),
  },

  figmaGetImageFills: {
    description:
      'Retrieves image URLs for image fills referenced in a Figma file using GET /v1/images/{file_key}/fills.',
    parameters: z.object({
      fileKey: z
        .string()
        .min(1, 'fileKey is required')
        .describe('The Figma file key (from the file URL).'),
      ids: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .describe(
          'Optional: a comma-separated string or an array of imageRef IDs to filter. If omitted, returns URLs for all image fills in the file.',
        ),
      includeRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe('When true, include a truncated raw JSON block in the response.'),
      logRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          'When true and verbose logs are enabled, logs truncated raw JSON for the response to the server logs.',
        ),
      maxChars: z
        .number()
        .int()
        .min(1000)
        .max(800000)
        .optional()
        .default(200000)
        .describe('Maximum number of characters to include when returning raw JSON.'),
    }),
  },

  figmaGetFileMetadata: {
    description:
      'Retrieves file metadata (components, component sets, styles) using GET /v1/files/{file_key}/metadata.',
    parameters: z.object({
      fileKey: z
        .string()
        .min(1, 'fileKey is required')
        .describe('The Figma file key (from the file URL).'),
      includeRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe('When true, include a truncated raw JSON block in the response.'),
      logRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          'When true and verbose logs are enabled, logs truncated raw JSON for the response to the server logs.',
        ),
      maxChars: z
        .number()
        .int()
        .min(1000)
        .max(800000)
        .optional()
        .default(200000)
        .describe('Maximum number of characters to include when returning raw JSON.'),
    }),
  },

  figmaGetFileStyles: {
    description:
      'Retrieves style metadata defined in a Figma file using GET /v1/files/{file_key}/styles.',
    parameters: z.object({
      fileKey: z
        .string()
        .min(1, 'fileKey is required')
        .describe('The Figma file key (from the file URL).'),
      includeRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe('When true, include a truncated raw JSON block in the response.'),
      logRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          'When true and verbose logs are enabled, logs truncated raw JSON for the response to the server logs.',
        ),
      maxChars: z
        .number()
        .int()
        .min(1000)
        .max(800000)
        .optional()
        .default(200000)
        .describe('Maximum number of characters to include when returning raw JSON.'),
    }),
  },

  figmaGetComments: {
    description: 'Retrieves comments for a Figma file using GET /v1/files/{file_key}/comments.',
    parameters: z.object({
      fileKey: z
        .string()
        .min(1, 'fileKey is required')
        .describe('The Figma file key (from the file URL).'),
      includeRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe('When true, include a truncated raw JSON block in the response.'),
      logRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          'When true and verbose logs are enabled, logs truncated raw JSON for the response to the server logs.',
        ),
      maxChars: z
        .number()
        .int()
        .min(1000)
        .max(800000)
        .optional()
        .default(200000)
        .describe('Maximum number of characters to include when returning raw JSON.'),
      since: z
        .string()
        .optional()
        .describe('Optional ISO date-time; returns comments created after this timestamp.'),
    }),
  },

  figmaGetUsers: {
    description: 'Retrieves user profiles using GET /v1/users with a list of user IDs.',
    parameters: z.object({
      ids: z
        .union([z.string(), z.array(z.string())])
        .describe(
          'User IDs to retrieve. Accepts a comma-separated string or an array of user IDs.',
        ),
      includeRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe('When true, include a truncated raw JSON block in the response.'),
      logRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          'When true and verbose logs are enabled, logs truncated raw JSON for the response to the server logs.',
        ),
      maxChars: z
        .number()
        .int()
        .min(1000)
        .max(800000)
        .optional()
        .default(200000)
        .describe('Maximum number of characters to include when returning raw JSON.'),
    }),
  },

  figmaGetFileVersions: {
    description:
      'Retrieves version history for a Figma file using GET /v1/files/{file_key}/versions.',
    parameters: z.object({
      fileKey: z
        .string()
        .min(1, 'fileKey is required')
        .describe('The Figma file key (from the file URL).'),
      includeRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe('When true, include a truncated raw JSON block in the response.'),
      logRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          'When true and verbose logs are enabled, logs truncated raw JSON for the response to the server logs.',
        ),
      maxChars: z
        .number()
        .int()
        .min(1000)
        .max(800000)
        .optional()
        .default(200000)
        .describe('Maximum number of characters to include when returning raw JSON.'),
      pageSize: z
        .number()
        .int()
        .min(1)
        .max(200)
        .optional()
        .describe('Optional page size for results when supported by the API.'),
    }),
  },

  figmaGetProjects: {
    description: 'Retrieves projects for a team using GET /v1/teams/{team_id}/projects.',
    parameters: z.object({
      includeRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe('When true, include a truncated raw JSON block in the response.'),
      logRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          'When true and verbose logs are enabled, logs truncated raw JSON for the response to the server logs.',
        ),
      maxChars: z
        .number()
        .int()
        .min(1000)
        .max(800000)
        .optional()
        .default(200000)
        .describe('Maximum number of characters to include when returning raw JSON.'),
      teamId: z.string().min(1, 'teamId is required').describe('The Figma team ID.'),
    }),
  },

  figmaGetProjectFiles: {
    description: 'Retrieves files for a project using GET /v1/projects/{project_id}/files.',
    parameters: z.object({
      includeRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe('When true, include a truncated raw JSON block in the response.'),
      logRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          'When true and verbose logs are enabled, logs truncated raw JSON for the response to the server logs.',
        ),
      maxChars: z
        .number()
        .int()
        .min(1000)
        .max(800000)
        .optional()
        .default(200000)
        .describe('Maximum number of characters to include when returning raw JSON.'),
      projectId: z.string().min(1, 'projectId is required').describe('The Figma project ID.'),
    }),
  },

  figmaGetTeamComponents: {
    description:
      'Retrieves published components in a team using GET /v1/teams/{team_id}/components.',
    parameters: z.object({
      includeRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe('When true, include a truncated raw JSON block in the response.'),
      logRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          'When true and verbose logs are enabled, logs truncated raw JSON for the response to the server logs.',
        ),
      maxChars: z
        .number()
        .int()
        .min(1000)
        .max(800000)
        .optional()
        .default(200000)
        .describe('Maximum number of characters to include when returning raw JSON.'),
      pageSize: z
        .number()
        .int()
        .min(1)
        .max(200)
        .optional()
        .describe('Optional page size for results when supported by the API.'),
      teamId: z.string().min(1, 'teamId is required').describe('The Figma team ID.'),
    }),
  },

  figmaGetFileComponents: {
    description:
      'Retrieves components defined in a file using GET /v1/files/{file_key}/components.',
    parameters: z.object({
      fileKey: z
        .string()
        .min(1, 'fileKey is required')
        .describe('The Figma file key (from the file URL).'),
      includeRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe('When true, include a truncated raw JSON block in the response.'),
      logRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          'When true and verbose logs are enabled, logs truncated raw JSON for the response to the server logs.',
        ),
      maxChars: z
        .number()
        .int()
        .min(1000)
        .max(800000)
        .optional()
        .default(200000)
        .describe('Maximum number of characters to include when returning raw JSON.'),
    }),
  },

  figmaGetFileComponentSets: {
    description:
      'Retrieves component sets defined in a file using GET /v1/files/{file_key}/component_sets.',
    parameters: z.object({
      fileKey: z
        .string()
        .min(1, 'fileKey is required')
        .describe('The Figma file key (from the file URL).'),
      includeRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe('When true, include a truncated raw JSON block in the response.'),
      logRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          'When true and verbose logs are enabled, logs truncated raw JSON for the response to the server logs.',
        ),
      maxChars: z
        .number()
        .int()
        .min(1000)
        .max(800000)
        .optional()
        .default(200000)
        .describe('Maximum number of characters to include when returning raw JSON.'),
    }),
  },

  figmaGetTeamComponentSets: {
    description:
      'Retrieves published component sets in a team using GET /v1/teams/{team_id}/component_sets.',
    parameters: z.object({
      includeRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe('When true, include a truncated raw JSON block in the response.'),
      logRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          'When true and verbose logs are enabled, logs truncated raw JSON for the response to the server logs.',
        ),
      maxChars: z
        .number()
        .int()
        .min(1000)
        .max(800000)
        .optional()
        .default(200000)
        .describe('Maximum number of characters to include when returning raw JSON.'),
      pageSize: z
        .number()
        .int()
        .min(1)
        .max(200)
        .optional()
        .describe('Optional page size for results when supported by the API.'),
      teamId: z.string().min(1, 'teamId is required').describe('The Figma team ID.'),
    }),
  },

  figmaGetTeamStyles: {
    description: 'Retrieves published styles in a team using GET /v1/teams/{team_id}/styles.',
    parameters: z.object({
      includeRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe('When true, include a truncated raw JSON block in the response.'),
      logRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          'When true and verbose logs are enabled, logs truncated raw JSON for the response to the server logs.',
        ),
      maxChars: z
        .number()
        .int()
        .min(1000)
        .max(800000)
        .optional()
        .default(200000)
        .describe('Maximum number of characters to include when returning raw JSON.'),
      pageSize: z
        .number()
        .int()
        .min(1)
        .max(200)
        .optional()
        .describe('Optional page size for results when supported by the API.'),
      teamId: z.string().min(1, 'teamId is required').describe('The Figma team ID.'),
    }),
  },

  figmaGetTeamActivityLogs: {
    description: 'Retrieves activity logs for a team using GET /v1/teams/{team_id}/activity_logs.',
    parameters: z.object({
      from: z.string().optional().describe('Optional ISO timestamp for start of range.'),
      includeRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe('When true, include a truncated raw JSON block in the response.'),
      logRaw: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          'When true and verbose logs are enabled, logs truncated raw JSON for the response to the server logs.',
        ),
      maxChars: z
        .number()
        .int()
        .min(1000)
        .max(800000)
        .optional()
        .default(200000)
        .describe('Maximum number of characters to include when returning raw JSON.'),
      pageSize: z
        .number()
        .int()
        .min(1)
        .max(200)
        .optional()
        .describe('Optional page size for results when supported by the API.'),
      teamId: z.string().min(1, 'teamId is required').describe('The Figma team ID.'),
      to: z.string().optional().describe('Optional ISO timestamp for end of range.'),
    }),
  },
}
