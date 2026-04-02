import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PayloadRequest } from 'payload'

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

import type { JobConfigUpdate, SchemaField, TaskSequenceItem } from '../../../types.js'

import { toCamelCase } from '../../../utils/camelCase.js'
import { validatePayloadFile } from '../../helpers/fileValidation.js'
import { toolSchemas } from '../schemas.js'

// Reusable function for updating jobs
export const updateJob = async (
  req: PayloadRequest,
  verboseLogs: boolean,
  jobsDir: string,
  jobSlug: string,
  updateType: string,
  inputSchema?: SchemaField[],
  outputSchema?: SchemaField[],
  taskSequence?: TaskSequenceItem[],
  configUpdate?: JobConfigUpdate,
  handlerCode?: string,
) => {
  const payload = req.payload

  if (verboseLogs) {
    payload.logger.info(`[payload-mcp] Updating job: ${jobSlug} (${updateType})`)
  }

  try {
    const camelCaseJobSlug = toCamelCase(jobSlug)

    // Find the job file - check both tasks and workflows
    let filePath: null | string = null
    let jobType: 'task' | 'workflow' | null = null

    const taskPath = join(jobsDir, 'tasks', `${camelCaseJobSlug}.ts`)
    const workflowPath = join(jobsDir, 'workflows', `${camelCaseJobSlug}.ts`)

    if (existsSync(taskPath)) {
      filePath = taskPath
      jobType = 'task'
      if (verboseLogs) {
        payload.logger.info(`[payload-mcp] Found task file: ${taskPath}`)
      }
    } else if (existsSync(workflowPath)) {
      filePath = workflowPath
      jobType = 'workflow'
      if (verboseLogs) {
        payload.logger.info(`[payload-mcp] Found workflow file: ${workflowPath}`)
      }
    } else {
      throw new Error(`No task or workflow file found for job slug: ${jobSlug}`)
    }

    // Read the current file content
    let content = readFileSync(filePath, 'utf8')
    const originalContent = content

    if (verboseLogs) {
      payload.logger.info(`[payload-mcp] Applying update type: ${updateType}`)
    }

    // Apply updates based on type
    switch (updateType) {
      case 'change_config':
        if (!configUpdate) {
          throw new Error('config must be provided for change_config')
        }

        content = updateConfig(content, jobSlug, configUpdate)
        if (verboseLogs) {
          payload.logger.info(`[payload-mcp] Configuration updated successfully`)
        }
        break

      case 'modify_schema':
        if (!inputSchema && !outputSchema) {
          throw new Error('Either inputSchema or outputSchema must be provided for modify_schema')
        }

        content = updateSchema(content, camelCaseJobSlug, inputSchema, outputSchema)
        if (verboseLogs) {
          payload.logger.info(`[payload-mcp] Schema updated successfully`)
        }
        break

      case 'replace_handler':
        if (!handlerCode) {
          throw new Error('handlerCode must be provided for replace_handler')
        }

        content = updateHandler(content, handlerCode, jobType)
        if (verboseLogs) {
          payload.logger.info(`[payload-mcp] Handler code replaced successfully`)
        }
        break

      case 'update_tasks':
        if (!taskSequence) {
          throw new Error('taskSequence must be provided for update_tasks')
        }

        if (jobType !== 'workflow') {
          throw new Error('update_tasks is only supported for workflow jobs')
        }

        content = updateWorkflowTasks(content, taskSequence)
        if (verboseLogs) {
          payload.logger.info(`[payload-mcp] Workflow tasks updated successfully`)
        }
        break
    }

    // Only write if content changed
    if (content !== originalContent) {
      if (verboseLogs) {
        payload.logger.info(`[payload-mcp] Writing updated content to file`)
      }

      // Write the updated content
      writeFileSync(filePath, content)

      // Validate the updated file
      const fileName = `${camelCaseJobSlug}.ts`
      const validationType = jobType === 'task' ? 'task' : 'workflow'

      try {
        const validationResult = await validatePayloadFile(fileName, validationType)

        if (!validationResult.success) {
          if (verboseLogs) {
            payload.logger.warn(`[payload-mcp] Validation warning: ${validationResult.error}`)
          }

          return {
            content: [
              {
                type: 'text' as const,
                text: `⚠️ **Warning**: Job updated but validation failed:\n\n${validationResult.error}\n\nPlease review the generated code for any syntax errors.`,
              },
            ],
          }
        }

        if (verboseLogs) {
          payload.logger.info(`[payload-mcp] File validation successful`)
        }
      } catch (validationError) {
        if (verboseLogs) {
          payload.logger.warn(`[payload-mcp] Validation error: ${validationError}`)
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: `⚠️ **Warning**: Job updated but validation could not be completed:\n\n${validationError}\n\nPlease review the generated code manually.`,
            },
          ],
        }
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: `✅ **Job updated successfully!**\n\n**Job**: \`${jobSlug}\`\n**Type**: \`${jobType}\`\n**Update**: \`${updateType}\`\n**File**: \`${fileName}\`\n\n**Next steps**:\n1. Restart your development server to load the updated job\n2. Test the updated functionality\n3. Verify the changes meet your requirements`,
          },
        ],
      }
    } else {
      if (verboseLogs) {
        payload.logger.info(`[payload-mcp] No changes detected, file not modified`)
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: `ℹ️ **No changes made**: The job file was not modified as no changes were detected.\n\n**Job**: \`${jobSlug}\`\n**Type**: \`${jobType}\`\n**Update**: \`${updateType}\``,
          },
        ],
      }
    }
  } catch (error) {
    const errorMessage = (error as Error).message
    payload.logger.error(`[payload-mcp] Error updating job: ${errorMessage}`)

    return {
      content: [
        {
          type: 'text' as const,
          text: `❌ **Error updating job**: ${errorMessage}`,
        },
      ],
    }
  }
}

// Helper functions for different update types
function updateSchema(
  content: string,
  _camelCaseJobSlug: string,
  _inputSchema?: SchemaField[],
  _outputSchema?: SchemaField[],
): string {
  // TODO: Implementation for schema updates
  return content
}

function updateWorkflowTasks(content: string, _taskSequence: TaskSequenceItem[]): string {
  // TODO: Implementation for updating workflow tasks
  return content
}

function updateConfig(content: string, _jobSlug: string, _configUpdate: JobConfigUpdate): string {
  // TODO: Implementation for updating job configuration
  return content
}

function updateHandler(
  content: string,
  _handlerCode: string,
  _jobType: 'task' | 'workflow',
): string {
  // TODO: Implementation for replacing handler code
  return content
}

export const updateJobTool = (
  server: McpServer,
  req: PayloadRequest,
  verboseLogs: boolean,
  jobsDir: string,
) => {
  server.registerTool(
    'updateJob',
    {
      description:
        'Updates an existing Payload job with new configuration, schema, or handler code',
      inputSchema: toolSchemas.updateJob.parameters.shape,
    },
    async ({
      configUpdate,
      handlerCode,
      inputSchema,
      jobSlug,
      outputSchema,
      taskSequence,
      updateType,
    }) => {
      if (verboseLogs) {
        req.payload.logger.info(
          `[payload-mcp] Update Job Tool called with: ${jobSlug}, ${updateType}`,
        )
      }
      return updateJob(
        req,
        verboseLogs,
        jobsDir,
        jobSlug,
        updateType,
        inputSchema as unknown as SchemaField[],
        outputSchema as unknown as SchemaField[],
        taskSequence,
        configUpdate,
        handlerCode,
      )
    },
  )
}
