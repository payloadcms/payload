import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PayloadRequest } from 'payload'

import { toolSchemas } from '../schemas.js'

// Reusable function for running jobs
export const runJob = async (
  req: PayloadRequest,
  verboseLogs: boolean,
  jobSlug: string,
  input: Record<string, unknown>,
  queue?: string,
  priority?: number,
  delay?: number,
) => {
  const payload = req.payload

  if (verboseLogs) {
    payload.logger.info(`[payload-mcp] Running job: ${jobSlug}`)
  }

  try {
    // Actually run the job using Payload's job queue
    const jobQueueOptions: Record<string, unknown> = {
      input,
      task: jobSlug,
    }

    if (queue && queue !== 'default') {
      jobQueueOptions.queue = queue
      if (verboseLogs) {
        payload.logger.info(`[payload-mcp] Using custom queue: ${queue}`)
      }
    }

    if (priority && priority > 0) {
      jobQueueOptions.priority = priority
      if (verboseLogs) {
        payload.logger.info(`[payload-mcp] Setting job priority: ${priority}`)
      }
    }

    if (delay && delay > 0) {
      jobQueueOptions.waitUntil = new Date(Date.now() + delay)
      if (verboseLogs) {
        payload.logger.info(`[payload-mcp] Setting job delay: ${delay}ms`)
      }
    }

    if (verboseLogs) {
      payload.logger.info(
        `[payload-mcp] Queuing job with options: ${JSON.stringify(jobQueueOptions)}`,
      )
    }

    const job = await payload.jobs.queue(
      jobQueueOptions as Parameters<typeof payload.jobs.queue>[0],
    )

    const jobId = (job as { id?: string })?.id || 'unknown'

    if (verboseLogs) {
      payload.logger.info(`[payload-mcp] Job created successfully: ${jobId}`)
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `# Job Queued Successfully: ${jobSlug}

## Job Details
- **Job ID**: ${jobId}
- **Job Slug**: ${jobSlug}
- **Queue**: ${queue || 'default'}
- **Priority**: ${priority || 'default'}
- **Delay**: ${delay ? `${delay}ms` : 'none'}
- **Status**: Queued and Running

## Input Data
\`\`\`json
${JSON.stringify(input)}
\`\`\`

## Job Status
The job has been successfully queued and will be processed according to the queue settings.

## Monitoring the Job
You can monitor the job status using:

\`\`\`typescript
// Check job status
const jobStatus = await payload.jobs.status('${jobId}')
console.log('Job status:', jobStatus)

// Wait for completion
const result = await payload.jobs.wait('${jobId}')
console.log('Job result:', result)
\`\`\`

✅ Job successfully queued with ID: ${jobId}`,
        },
      ],
    }
  } catch (error) {
    const errorMsg = (error as Error).message
    payload.logger.error(`[payload-mcp] Error running job "${jobSlug}": ${errorMsg}`)

    return {
      content: [
        {
          type: 'text' as const,
          text: `❌ Error running job "${jobSlug}": ${errorMsg}

## Common Issues:
1. **Job not found**: The job "${jobSlug}" may not be registered in your Payload configuration
2. **Invalid input format**: Ensure the input matches the job's input schema
3. **Queue not configured**: The queue "${queue || 'default'}" may not be properly set up
4. **Permission issues**: Ensure proper access rights for job execution
5. **Job handler error**: The job implementation may have errors

## Input Data Provided:
\`\`\`json
${JSON.stringify(input)}
\`\`\`

## Next Steps:
1. **Verify job exists**: Check that the job "${jobSlug}" is properly registered
2. **Check input format**: Ensure the input data matches the expected schema
3. **Review job configuration**: Verify the job is properly configured in your Payload setup
4. **Check permissions**: Ensure you have the necessary permissions to run jobs
5. **Review error logs**: Check the server logs for more detailed error information

## Troubleshooting:
- **Job not found**: Verify the job slug and check your jobs configuration
- **Schema mismatch**: Ensure input data matches the job's input schema
- **Queue issues**: Check that the specified queue is properly configured
- **Permission errors**: Verify user permissions for job execution`,
        },
      ],
    }
  }
}

export const runJobTool = (server: McpServer, req: PayloadRequest, verboseLogs: boolean) => {
  server.registerTool(
    'runJob',
    {
      description: 'Runs a Payload job with specified input data and queue options',
      inputSchema: toolSchemas.runJob.parameters.shape,
    },
    async ({ delay, input, jobSlug, priority, queue }) => {
      if (verboseLogs) {
        req.payload.logger.info(`[payload-mcp] Run Job Tool called with: ${jobSlug}`)
      }
      return runJob(
        req,
        verboseLogs,
        jobSlug,
        input as Record<string, unknown>,
        queue,
        priority,
        delay,
      )
    },
  )
}
