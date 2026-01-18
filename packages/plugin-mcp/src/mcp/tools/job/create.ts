import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PayloadRequest } from 'payload'

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

import { validatePayloadFile } from '../../helpers/fileValidation.js'
import { toolSchemas } from '../schemas.js'

const createOrUpdateJobFile = (
  req: PayloadRequest,
  verboseLogs: boolean,
  jobsDir: string,
  jobName: string,
  jobType: 'task' | 'workflow',
  jobSlug: string,
  camelCaseJobSlug: string,
) => {
  const payload = req.payload
  const jobFilePath = join(jobsDir, `${jobName}.ts`)
  const importName = `${camelCaseJobSlug}${jobType === 'task' ? 'Task' : 'Workflow'}`
  const importPath = `./${jobType === 'task' ? 'tasks' : 'workflows'}/${camelCaseJobSlug}`

  if (verboseLogs) {
    payload.logger.info(`[payload-mcp] Processing job file: ${jobFilePath}`)
  }

  if (existsSync(jobFilePath)) {
    if (verboseLogs) {
      payload.logger.info(`[payload-mcp] Updating existing job file: ${jobFilePath}`)
    }

    // Update existing job file
    let content = readFileSync(jobFilePath, 'utf8')

    // Add import if not already present
    const importStatement = `import { ${importName} } from '${importPath}'`
    if (!content.includes(importStatement)) {
      if (verboseLogs) {
        payload.logger.info(`[payload-mcp] Adding import: ${importStatement}`)
      }

      // Find the last import statement and add after it
      const importRegex = /import\s+(?:\S.*)?from\s+['"].*['"];?\s*\n/g
      let lastImportMatch
      let match
      while ((match = importRegex.exec(content)) !== null) {
        lastImportMatch = match
      }

      if (lastImportMatch) {
        const insertIndex = lastImportMatch.index + lastImportMatch[0].length
        content =
          content.slice(0, insertIndex) + importStatement + '\n' + content.slice(insertIndex)
      } else {
        // No imports found, add at the beginning
        content = importStatement + '\n\n' + content
      }
    }

    // Add to the appropriate array
    const arrayName = jobType === 'task' ? 'tasks' : 'workflows'
    const arrayRegex = new RegExp(`(${arrayName}:\\s*\\[)([^\\]]*)(\\])`, 's')
    const arrayMatch = content.match(arrayRegex)

    if (arrayMatch && arrayMatch[2]) {
      const existingItems = arrayMatch[2].trim()
      const newItem = existingItems ? `${existingItems},\n    ${importName}` : `\n    ${importName}`
      content = content.replace(arrayRegex, `$1${newItem}\n  $3`)

      if (verboseLogs) {
        payload.logger.info(`[payload-mcp] Added ${importName} to ${arrayName} array`)
      }
    } else {
      // Array doesn't exist, add it
      const jobsConfigRegex = /(export\s+const\s.*JobsConfig\s*=\s*\{)([^}]*)(\})/s
      const jobsConfigMatch = content.match(jobsConfigRegex)

      if (jobsConfigMatch && jobsConfigMatch[2]) {
        const existingConfig = jobsConfigMatch[2].trim()
        const newConfig = existingConfig
          ? `${existingConfig},\n  ${arrayName}: [\n    ${importName}\n  ]`
          : `\n  ${arrayName}: [\n    ${importName}\n  ]`
        content = content.replace(jobsConfigRegex, `$1${newConfig}\n$3`)

        if (verboseLogs) {
          payload.logger.info(`[payload-mcp] Created new ${arrayName} array with ${importName}`)
        }
      }
    }

    writeFileSync(jobFilePath, content)
    if (verboseLogs) {
      payload.logger.info(`[payload-mcp] Successfully updated job file: ${jobFilePath}`)
    }
  } else {
    if (verboseLogs) {
      payload.logger.info(`[payload-mcp] Creating new job file: ${jobFilePath}`)
    }

    // Create new job file
    const camelCaseJobName = toCamelCase(jobName)
    const jobFileContent = `import type { JobsConfig } from 'payload'
import { ${importName} } from '${importPath}'

export const ${camelCaseJobName}JobsConfig: JobsConfig = {
  ${jobType === 'task' ? 'tasks' : 'workflows'}: [
    ${importName}
  ]
}
`
    writeFileSync(jobFilePath, jobFileContent)
    if (verboseLogs) {
      payload.logger.info(`[payload-mcp] Successfully created new job file: ${jobFilePath}`)
    }
  }
}

// Reusable function for creating jobs
export const createJob = async (
  req: PayloadRequest,
  verboseLogs: boolean,
  jobsDir: string,
  jobName: string,
  jobType: 'task' | 'workflow',
  jobSlug: string,
  description: string,
  inputSchema: any,
  outputSchema: any,
  jobData: Record<string, any>,
) => {
  const payload = req.payload

  if (verboseLogs) {
    payload.logger.info(`[payload-mcp] Creating ${jobType}: ${jobName}`)
  }

  try {
    // Ensure jobs directory exists
    if (!existsSync(jobsDir)) {
      if (verboseLogs) {
        payload.logger.info(`[payload-mcp] Creating jobs directory: ${jobsDir}`)
      }
      mkdirSync(jobsDir, { recursive: true })
    }

    // Ensure subdirectories exist
    const tasksDir = join(jobsDir, 'tasks')
    const workflowsDir = join(jobsDir, 'workflows')

    if (!existsSync(tasksDir)) {
      mkdirSync(tasksDir, { recursive: true })
    }
    if (!existsSync(workflowsDir)) {
      mkdirSync(workflowsDir, { recursive: true })
    }

    const camelCaseJobSlug = toCamelCase(jobSlug)
    const targetDir = jobType === 'task' ? tasksDir : workflowsDir
    const fileName = `${camelCaseJobSlug}.ts`
    const filePath = join(targetDir, fileName)

    if (verboseLogs) {
      payload.logger.info(`[payload-mcp] Target file path: ${filePath}`)
    }

    // Security check: ensure we're working with the jobs directory
    if (!filePath.startsWith(jobsDir)) {
      payload.logger.error(`[payload-mcp] Invalid job path attempted: ${filePath}`)
      return {
        content: [
          {
            type: 'text' as const,
            text: '❌ **Error**: Invalid job path',
          },
        ],
      }
    }

    // Check if file already exists
    if (existsSync(filePath)) {
      if (verboseLogs) {
        payload.logger.info(`[payload-mcp] Job file already exists: ${fileName}`)
      }
      return {
        content: [
          {
            type: 'text' as const,
            text: `❌ **Error**: Job file already exists: ${fileName}`,
          },
        ],
      }
    }

    // Generate job content based on type
    let jobContent: string
    if (jobType === 'task') {
      jobContent = generateTaskContent(
        jobName,
        jobSlug,
        description,
        inputSchema,
        outputSchema,
        jobData,
      )
    } else {
      jobContent = generateWorkflowContent(
        jobName,
        jobSlug,
        description,
        inputSchema,
        outputSchema,
        jobData,
      )
    }

    // Write the job file
    writeFileSync(filePath, jobContent, 'utf8')
    if (verboseLogs) {
      payload.logger.info(`[payload-mcp] Successfully created job file: ${filePath}`)
    }

    // Update the main job file
    createOrUpdateJobFile(req, verboseLogs, jobsDir, jobName, jobType, jobSlug, camelCaseJobSlug)

    // Validate the generated file
    const validationResult = await validatePayloadFile(fileName, jobType)
    if (validationResult.error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `❌ **Error**: Generated job has validation issues:\n\n${validationResult.error}`,
          },
        ],
      }
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ **Job created successfully!**

**File**: \`${fileName}\`
**Type**: \`${jobType}\`
**Slug**: \`${jobSlug}\`
**Description**: ${description}

**Generated Job Code:**
\`\`\`typescript
${jobContent}
\`\`\``,
        },
      ],
    }
  } catch (error) {
    const errorMessage = (error as Error).message
    payload.logger.error(`[payload-mcp] Error creating job: ${errorMessage}`)

    return {
      content: [
        {
          type: 'text' as const,
          text: `❌ **Error creating job**: ${errorMessage}`,
        },
      ],
    }
  }
}

// Helper function to generate task content
function generateTaskContent(
  jobName: string,
  jobSlug: string,
  description: string,
  inputSchema: any,
  outputSchema: any,
  jobData: Record<string, any>,
): string {
  const camelCaseJobSlug = toCamelCase(jobSlug)

  return `import type { Task } from 'payload'

export const ${camelCaseJobSlug}Task: Task = {
  slug: '${jobSlug}',
  description: '${description}',
  inputSchema: ${JSON.stringify(inputSchema, null, 2)},
  outputSchema: ${JSON.stringify(outputSchema, null, 2)},
  handler: async (input, context) => {
    // TODO: Implement your task logic here
    // Access input data: input.fieldName
    // Access context: context.payload, context.req, etc.

    // Example implementation:
    const result = {
      message: 'Task executed successfully',
      input,
      timestamp: new Date().toISOString(),
    }

    return result
  },
}
`
}

// Helper function to generate workflow content
function generateWorkflowContent(
  jobName: string,
  jobSlug: string,
  description: string,
  inputSchema: any,
  outputSchema: any,
  jobData: Record<string, any>,
): string {
  const camelCaseJobSlug = toCamelCase(jobSlug)

  return `import type { Workflow } from 'payload'

export const ${camelCaseJobSlug}Workflow: Workflow = {
  slug: '${jobSlug}',
  description: '${description}',
  inputSchema: ${JSON.stringify(inputSchema, null, 2)},
  outputSchema: ${JSON.stringify(outputSchema, null, 2)},
  steps: [
    // TODO: Define your workflow steps here
    // Each step should be a function that returns a result
    // Example:
    // {
    //   name: 'step1',
    //   handler: async (input, context) => {
    //     // Step logic here
    //     return { result: 'step1 completed' }
    //   }
    // }
  ],
}
`
}

// Helper function to convert to camel case
function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, chr) => (chr ? chr.toUpperCase() : ''))
    .replace(/^(.)/, (_, chr) => chr.toLowerCase())
}

export const createJobTool = (
  server: McpServer,
  req: PayloadRequest,
  verboseLogs: boolean,
  jobsDir: string,
) => {
  const tool = async (
    jobName: string,
    jobType: 'task' | 'workflow',
    jobSlug: string,
    description: string,
    inputSchema: any = {},
    outputSchema: any = {},
    jobData: Record<string, any> = {},
  ) => {
    if (verboseLogs) {
      req.payload.logger.info(
        `[payload-mcp] Create Job Tool called with: ${jobName}, ${jobType}, ${jobSlug}`,
      )
    }

    try {
      const result = await createJob(
        req,
        verboseLogs,
        jobsDir,
        jobName,
        jobType,
        jobSlug,
        description,
        inputSchema,
        outputSchema,
        jobData,
      )

      if (verboseLogs) {
        req.payload.logger.info(`[payload-mcp] Create Job Tool completed successfully`)
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      req.payload.logger.error(`[payload-mcp] Error in Create Job Tool: ${errorMessage}`)

      return {
        content: [
          {
            type: 'text' as const,
            text: `❌ **Error in Create Job Tool**: ${errorMessage}`,
          },
        ],
      }
    }
  }

  server.tool(
    'createJob',
    'Creates a new Payload job (task or workflow) with specified configuration',
    toolSchemas.createJob.parameters.shape,
    async (args) => {
      return tool(
        args.jobName,
        args.jobType,
        args.jobSlug,
        args.description,
        args.inputSchema,
        args.outputSchema,
        args.jobData,
      )
    },
  )
}
