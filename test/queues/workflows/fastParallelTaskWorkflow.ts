import type { WorkflowConfig } from 'payload'

export const fastParallelTaskWorkflow: WorkflowConfig<'fastParallelTask'> = {
  slug: 'fastParallelTask',
  inputSchema: [
    {
      name: 'amount',
      type: 'number',
      required: true,
    },
  ],
  handler: async ({ job, inlineTask }) => {
    const taskFunctions = []
    for (let i = 0; i < job.input.amount; i++) {
      const idx = i + 1
      taskFunctions.push(async () => {
        return await inlineTask(`fast parallel task ${idx}`, {
          input: {
            test: idx,
          },
          task: () => {
            return {
              output: {
                taskID: idx.toString(),
              },
            }
          },
        })
      })
    }

    await Promise.all(taskFunctions.map((f) => f()))
  },
}
