import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PayloadRequest } from 'payload'

import { writeFileSync } from 'fs'
import { join } from 'path'

import { validateCollectionFile } from '../../helpers/fileValidation.js'
import { toolSchemas } from '../schemas.js'

export const createCollection = async (
  req: PayloadRequest,
  verboseLogs: boolean,
  collectionsDirPath: string,
  configFilePath: string,
  collectionName: string,
  collectionDescription: string | undefined,
  fields: any[],
  hasUpload: boolean | undefined,
) => {
  const payload = req.payload
  if (verboseLogs) {
    payload.logger.info(
      `[payload-mcp] Creating collection: ${collectionName} with ${fields.length} fields`,
    )
  }

  const capitalizedName = collectionName.charAt(0).toUpperCase() + collectionName.slice(1)
  const slug = collectionName
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '')

  if (verboseLogs) {
    payload.logger.info(`[payload-mcp] Generated slug: ${slug} for collection: ${collectionName}`)
  }

  // Generate TypeScript field definitions more systematically
  const generateFieldDefinition = (field: any) => {
    const fieldConfig = []
    fieldConfig.push(`    {`)
    fieldConfig.push(`      name: '${field.name}',`)
    fieldConfig.push(`      type: '${field.type}',`)

    if (field.required) {
      fieldConfig.push(`      required: true,`)
    }

    if (field.description) {
      fieldConfig.push(`      admin: {`)
      fieldConfig.push(`        description: '${field.description}',`)
      fieldConfig.push(`      },`)
    }

    if (field.options && field.type === 'select') {
      fieldConfig.push(`      options: [`)
      field.options.forEach((option: { label: string; value: string }) => {
        fieldConfig.push(`        { label: '${option.label}', value: '${option.value}' },`)
      })
      fieldConfig.push(`      ],`)
    }

    fieldConfig.push(`    },`)
    return fieldConfig.join('\n')
  }

  const fieldDefinitions = fields.map(generateFieldDefinition).join('\n')

  // Generate collection file content
  const collectionContent = `import type { CollectionConfig } from 'payload'

export const ${capitalizedName}: CollectionConfig = {
  slug: '${slug}',${
    collectionDescription
      ? `
  admin: {
    description: '${collectionDescription}',
  },`
      : ''
  }${
    hasUpload
      ? `
  upload: true,`
      : ''
  }
  fields: [
${fieldDefinitions}
  ],
}
`

  try {
    // Validate the collection name and path
    const fileName = `${capitalizedName}.ts`
    const filePath = join(collectionsDirPath, fileName)

    // Security check: ensure we're working with the collections directory
    if (!filePath.startsWith(collectionsDirPath)) {
      payload.logger.error(`[payload-mcp] Invalid collection path attempted: ${filePath}`)
      return {
        content: [
          {
            type: 'text' as const,
            text: '❌ **Error**: Invalid collection path',
          },
        ],
      }
    }

    // Check if file already exists
    try {
      const fs = await import('fs')
      if (fs.existsSync(filePath)) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `❌ **Error**: Collection file already exists: ${fileName}`,
            },
          ],
        }
      }
    } catch (_ignore) {
      // File doesn't exist, which is what we want
    }

    // Write the collection file
    writeFileSync(filePath, collectionContent, 'utf8')
    if (verboseLogs) {
      payload.logger.info(`[payload-mcp] Successfully created collection file: ${filePath}`)
    }

    // Validate the generated file
    const validationResult = await validateCollectionFile(fileName)
    if (validationResult.error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `❌ **Error**: Generated collection has validation issues:\n\n${validationResult.error}`,
          },
        ],
      }
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ **Collection created successfully!**
**File**: \`${fileName}\`
**Collection Config:**
\`\`\`typescript
${collectionContent}
\`\`\``,
        },
      ],
    }
  } catch (error) {
    const errorMessage = (error as Error).message
    payload.logger.error(`[payload-mcp] Error creating collection: ${errorMessage}`)

    return {
      content: [
        {
          type: 'text' as const,
          text: `❌ **Error creating collection**: ${errorMessage}`,
        },
      ],
    }
  }
}

export const createCollectionTool = (
  server: McpServer,
  req: PayloadRequest,
  verboseLogs: boolean,
  collectionsDirPath: string,
  configFilePath: string,
) => {
  const tool = async (
    collectionName: string,
    collectionDescription?: string,
    fields: any[] = [],
    hasUpload?: boolean,
  ) => {
    const payload = req.payload

    if (verboseLogs) {
      payload.logger.info(
        `[payload-mcp] Creating collection: ${collectionName}, fields: ${fields.length}, upload: ${hasUpload}`,
      )
    }

    try {
      const result = await createCollection(
        req,
        verboseLogs,
        collectionsDirPath,
        configFilePath,
        collectionName,
        collectionDescription,
        fields,
        hasUpload,
      )

      if (verboseLogs) {
        payload.logger.info(`[payload-mcp] Collection creation completed for: ${collectionName}`)
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      payload.logger.error(
        `[payload-mcp] Error creating collection ${collectionName}: ${errorMessage}`,
      )

      return {
        content: [
          {
            type: 'text' as const,
            text: `Error creating collection "${collectionName}": ${errorMessage}`,
          },
        ],
      }
    }
  }

  server.registerTool(
    'createCollection',
    {
      description: toolSchemas.createCollection.description,
      inputSchema: toolSchemas.createCollection.parameters.shape,
    },
    async ({ collectionDescription, collectionName, fields, hasUpload }) => {
      return await tool(collectionName, collectionDescription, fields, hasUpload)
    },
  )
}
