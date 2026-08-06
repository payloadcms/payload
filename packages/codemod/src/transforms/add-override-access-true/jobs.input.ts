declare const payload: {
  jobs: {
    queue(options: { input: unknown; task: string }): Promise<unknown>
  }
}

await payload.jobs.queue({ input: {}, task: 'sync' })
