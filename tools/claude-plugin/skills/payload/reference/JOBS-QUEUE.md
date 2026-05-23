# Jobs Queue

Use when a Payload project needs to offload work out-of-band — background tasks, recurring schedules, multi-step workflows with retry logic, or deferred jobs that run at a future time. Also covers all four execution methods (bin script, `autoRun`, endpoint, Local API) and queue selection strategy.

## Quick Reference

| Task                                        | Solution                                                          | Section                                 |
| ------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------- |
| Define a background task                    | `tasks: [{ slug, handler, inputSchema, retries }]` in jobs config | [Defining Tasks](#defining-tasks)       |
| Queue a job manually                        | `payload.jobs.queue({ task, input })`                             | [Queueing Jobs](#queueing-jobs)         |
| Schedule a job to run in the future         | `waitUntil: new Date(...)` on `payload.jobs.queue`                | [Queueing Jobs](#queueing-jobs)         |
| Run multiple steps with independent retries | `workflows: [{ slug, handler }]` + `runTask` / `inlineTask`       | [Workflows](#workflows)                 |
| Schedule recurring work automatically       | `schedule: [{ cron, queue }]` on a task or workflow               | [Scheduled / Cron](#scheduled--cron)    |
| Execute jobs on a dedicated server          | `pnpm payload jobs:run --cron "* * * * *"` bin script             | [Execution Methods](#execution-methods) |
| Execute jobs on a serverless platform       | `GET /api/payload-jobs/run` triggered by Vercel Cron              | [Execution Methods](#execution-methods) |
| Run jobs within the Next.js process         | `autoRun: [{ cron, queue }]` in jobs config                       | [Execution Methods](#execution-methods) |
| Queue high-priority jobs separately         | `queue: 'critical'` on `payload.jobs.queue`                       | [Queue Selection](#queue-selection)     |
| Show jobs collection in admin panel         | `jobsCollectionOverrides` to set `admin.hidden: false`            | [Gotchas](#gotchas)                     |

## Defining Tasks

Tasks are the unit of work. Define them in `buildConfig({ jobs: { tasks: [...] } })`. Each task has a `slug` (unique across tasks and workflows), a `handler`, and optional schemas and retry policy.

```ts
// see test/queues/getConfig.ts
import type { TaskConfig } from 'payload'
import { buildConfig } from 'payload'

export default buildConfig({
  jobs: {
    tasks: [
      {
        slug: 'sendEmail',

        // Payload generates a TypeScript type from inputSchema
        inputSchema: [
          { name: 'to', type: 'email', required: true },
          { name: 'subject', type: 'text', required: true },
        ],

        // Handler return value must include an `output` key
        outputSchema: [{ name: 'messageId', type: 'text', required: true }],

        // Retry up to 2 times on failure (3 attempts total)
        retries: 2,

        handler: async ({ input, job, req }) => {
          const result = await sendEmail(input.to, input.subject)
          return {
            output: {
              messageId: result.id,
            },
          }
        },
      } as TaskConfig<'sendEmail'>,
    ],
  },
})
```

### Handler options

| Option         | Description                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| `slug`         | Unique identifier. Must be unique across tasks and workflows.                                                       |
| `handler`      | Inline function or absolute path string to a named export (`'/abs/path/file.ts#handlerName'`).                      |
| `inputSchema`  | Payload field definitions. Generates a TypeScript type for `input`.                                                 |
| `outputSchema` | Payload field definitions. Generates a TypeScript type for `output`. Handler must return `{ output: {} }`.          |
| `retries`      | Number of times to retry on failure. `0` = no retry. Inherits from workflow if undefined.                           |
| `onSuccess`    | Function called after the task succeeds.                                                                            |
| `onFail`       | Function called after the task exhausts all retries.                                                                |
| `schedule`     | Array of `{ cron, queue }` objects to auto-queue this task periodically.                                            |
| `concurrency`  | Key function to prevent parallel execution of jobs on the same resource. Requires `enableConcurrencyControl: true`. |

### File-based handlers

Pass an absolute path + named export instead of an inline function to keep large dependencies out of the Next.js bundle:

```ts
// see test/queues/tasks/ExternalTask.ts
import { fileURLToPath } from 'node:url'
import path from 'path'

const dirname = path.dirname(fileURLToPath(import.meta.url))

{
  slug: 'generatePDF',
  handler: path.resolve(dirname, 'src/tasks/generatePDF.ts') + '#generatePDFHandler',
}
```

The referenced file must export the handler by the named export after `#`. When using the `/api/payload-jobs/run` endpoint (Next.js process), prefer inline handlers — file-path handlers require a separate transpilation step.

### Task idempotency

Tasks may be retried. Make them safe to run multiple times with the same input: check if the work has already been done before doing it again.

## Queueing Jobs

Use `payload.jobs.queue` (or `req.payload.jobs.queue` inside hooks) to create a job instance.

```ts
// see test/queues/getConfig.ts — afterChange hook on posts collection
await req.payload.jobs.queue({
  task: 'sendEmail',
  input: {
    to: 'user@example.com',
    subject: 'Welcome',
  },

  // Optional: don't run until this date
  waitUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow

  // Optional: route to a named queue (default: 'default')
  queue: 'emails',

  // Optional: custom log entries for debugging
  log: [{ message: 'queued by signup handler', createdAt: new Date().toISOString() }],

  // Pass req when queueing from inside a hook so the queue call
  // participates in the current request's transaction context
  req,
})
```

Queue a workflow the same way, substituting `workflow:` for `task:`:

```ts
await payload.jobs.queue({
  workflow: 'onboardUser',
  input: { userId: doc.id },
  req,
})
```

### Where to queue

**Collection hooks (most common):** Queue in `afterChange` to react to document saves. Always use `req.payload.jobs.queue` and pass `req` so the queue call runs within the hook's request context.

**Custom endpoints:** `req.payload.jobs.queue(...)` — `req` is available from the endpoint argument.

**Server actions / standalone scripts:** `const payload = await getPayload({ config }); await payload.jobs.queue(...)` — no `req` needed when outside of a request context.

**Field hooks:** Same pattern as collection hooks — pass `req` from the hook argument.

### `waitUntil`

Set `waitUntil` to delay execution. The job is stored in the database immediately but the runner skips it until `waitUntil` has passed. Use `waitUntil` for one-time future jobs (scheduled post publishing, trial expiry emails). For recurring jobs, use `schedule` on the task instead.

## Workflows

Workflows chain multiple tasks. If a task fails, the workflow re-runs from the failing task — already-completed tasks return their cached output without re-executing.

```ts
// see test/queues/workflows/updatePost.ts
import type { WorkflowConfig } from 'payload'
import { buildConfig } from 'payload'

export default buildConfig({
  jobs: {
    tasks: [
      /* createPost, updatePost tasks defined here */
    ],
    workflows: [
      {
        slug: 'onboardUser',
        inputSchema: [{ name: 'userId', type: 'text', required: true }],
        handler: async ({ job, tasks, inlineTask }) => {
          // Each task call requires a stable ID string.
          // On a retry, Payload uses this ID to find the cached output
          // and skip re-execution of tasks that already succeeded.
          const profileResult = await tasks.createProfile('create-profile', {
            input: { userId: job.input.userId },
          })

          // Access prior task output via the return value or job.taskStatus
          const profileId = profileResult.output.profileId
          // or: job.taskStatus.createProfile['create-profile'].output.profileId

          await tasks.sendWelcomeEmail('send-welcome', {
            input: { userId: job.input.userId, profileId },
          })

          // inlineTask: one-off task not defined in the config.
          // Output is stored but untyped.
          await inlineTask('add-to-list', {
            task: async ({ req }) => {
              await addToMailingList(job.input.userId)
              return { output: {} }
            },
          })
        },
      } as WorkflowConfig<'onboardUser'>,
    ],
  },
})
```

### Workflow options

| Option        | Description                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `slug`        | Unique identifier.                                                                             |
| `handler`     | Async function receiving `{ job, tasks, inlineTask }`. Re-runs on retry from failure point.    |
| `retries`     | Workflow-level retry ceiling. Tasks that don't specify their own `retries` inherit this value. |
| `queue`       | Default queue name for this workflow (default: `'default'`).                                   |
| `concurrency` | Key function; requires `jobs.enableConcurrencyControl: true`.                                  |

### Accessing prior task outputs

Two equivalent patterns:

```ts
// Pattern 1: capture return value
const { output } = await tasks.myTask('step-1', { input })
const docId = output.documentId

// Pattern 2: read from job.taskStatus after calling the task
await tasks.myTask('step-1', { input })
const docId = job.taskStatus.myTask['step-1'].output.documentId
```

Both work; pattern 1 is more readable.

### Concurrency controls

Prevent parallel execution of jobs on the same resource:

```ts
// see test/queues/workflows/exclusiveConcurrency.ts
export default buildConfig({
  jobs: {
    enableConcurrencyControl: true, // required
    workflows: [
      {
        slug: 'syncDocument',
        concurrency: ({ input }) => `sync:${input.documentId}`,
        handler: async ({ job, inlineTask }) => {
          /* ... */
        },
      },
    ],
  },
})
```

`enableConcurrencyControl: true` adds a `concurrencyKey` field to the jobs collection schema — run a migration when enabling this in an existing project.

## Scheduled / Cron

Add `schedule` to a task or workflow to auto-queue it on a cron expression. Scheduling (queuing) and execution (running) are separate — you still need a runner configured with the same `queue` name.

```ts
// see test/queues/config.schedules.ts
import type { TaskConfig } from 'payload'

export const DailyCleanupTask: TaskConfig<'dailyCleanup'> = {
  slug: 'dailyCleanup',
  schedule: [
    {
      cron: '0 2 * * *', // every day at 2 AM
      queue: 'nightly',
    },
  ],
  handler: async ({ req }) => {
    await req.payload.delete({
      collection: 'temp-files',
      where: { createdAt: { less_than: new Date(Date.now() - 7 * 86400000).toISOString() } },
    })
    return { output: {} }
  },
}
```

Common cron patterns:

```ts
schedule: [{ cron: '*/5 * * * *', queue: 'default' }] // every 5 minutes
schedule: [{ cron: '0 * * * *', queue: 'hourly' }] // every hour
schedule: [{ cron: '0 0 * * *', queue: 'nightly' }] // daily midnight
schedule: [{ cron: '0 9 * * 1', queue: 'weekly' }] // every Monday 9 AM
```

### `beforeSchedule` hook

The default `beforeSchedule` skips scheduling a new job if an identical job is already queued. Override it to allow concurrent scheduling or set dynamic input:

```ts
import { countRunnableOrActiveJobsForQueue } from 'payload'

schedule: [
  {
    cron: '* * * * *',
    queue: 'reports',
    hooks: {
      beforeSchedule: async ({ queueable, req }) => {
        const count = await countRunnableOrActiveJobsForQueue({
          queue: queueable.scheduleConfig.queue,
          req,
          taskSlug: queueable.taskConfig?.slug,
          onlyScheduled: true,
        })
        return {
          shouldSchedule: count < 3, // allow up to 3 overlapping
          input: { date: new Date().toISOString() },
        }
      },
    },
  },
]
```

### Scheduling lifecycle

1. Cron triggers: Payload reads `payload-jobs-stats` global to find due schedules.
2. `beforeSchedule` hook: by default skips if an active/pending job for the same slug already exists.
3. Job enqueued with `waitUntil` set to the next scheduled time.
4. `afterSchedule` hook: updates `payload-jobs-stats`.

## Execution Methods

Scheduling and execution are independent. You must configure a runner that processes the same `queue` name used when jobs are queued.

### 1. Bin script (recommended for dedicated servers)

Runs in a separate process from Next.js — the simplest way to scale workers independently:

```sh
# Run default queue every 5 minutes
pnpm payload jobs:run --cron "*/5 * * * *"

# Run a named queue
pnpm payload jobs:run --cron "*/5 * * * *" --queue emails

# Run + handle schedules in one process (queue both scheduling and running)
pnpm payload jobs:run --cron "* * * * *" --queue nightly --handle-schedules

# Run all queues
pnpm payload jobs:run --all-queues
```

Deploy as a separate service in Docker Compose or Kubernetes alongside your Next.js container.

### 2. `autoRun` (alternative for dedicated servers)

Runs within the Next.js process. Simpler but shares CPU/memory with the API server.

```ts
// see test/queues/getConfig.ts
export default buildConfig({
  jobs: {
    autoRun: [
      {
        cron: '* * * * * *', // every second (extended syntax)
        queue: 'autorunSecond',
        limit: 100,
      },
      {
        cron: '*/5 * * * *',
        queue: 'default',
        limit: 50,
      },
    ],
    shouldAutoRun: async (payload) => {
      // Gate on an env var to prevent workers running on every Next.js instance
      return process.env.ENABLE_JOB_WORKERS === 'true'
    },
  },
})
```

`autoRun` also handles scheduling by default (`disableScheduling: false`). Set `disableScheduling: true` if you use the bin script for scheduling and `autoRun` only for running.

**Do not use `autoRun` on serverless platforms.** Serverless instances shut down between requests — `autoRun` cron schedules are lost on every cold start.

### 3. REST endpoint (serverless / Vercel Cron)

The `/api/payload-jobs/run` endpoint is automatically mounted:

```
GET /api/payload-jobs/run?queue=emails&limit=100
```

Secure it with a `CRON_SECRET` environment variable (Vercel injects this automatically):

```ts
// see docs/jobs-queue/queues.mdx — Vercel Cron Example
export default buildConfig({
  jobs: {
    access: {
      run: ({ req }) => {
        if (req.user) return true
        const secret = process.env.CRON_SECRET
        if (!secret) return false
        return req.headers.get('authorization') === `Bearer ${secret}`
      },
    },
  },
})
```

`vercel.json`:

```json
{
  "crons": [{ "path": "/api/payload-jobs/run?queue=emails", "schedule": "*/5 * * * *" }]
}
```

There is also a dedicated `/api/payload-jobs/handle-schedules` endpoint for triggering schedule handling separately from job execution.

### 4. Local API (programmatic / testing)

```ts
// Run all jobs from the default queue
await payload.jobs.run()

// Run a named queue with a limit
await payload.jobs.run({ queue: 'nightly', limit: 100 })

// Run all queues
await payload.jobs.run({ allQueues: true })

// Run a single job by ID (useful in tests)
await payload.jobs.runByID({ id: jobId })

// Handle schedules programmatically
await payload.jobs.handleSchedules()
```

### Execution method summary

| Method     | Platform                  | Pros                                     | Cons                        |
| ---------- | ------------------------- | ---------------------------------------- | --------------------------- |
| Bin script | Dedicated server (rec.)   | Separate process, easy to scale          | Requires always-on server   |
| `autoRun`  | Dedicated server (alt.)   | Simple, no extra process                 | Shares Next.js CPU/memory   |
| Endpoint   | Serverless (Vercel, etc.) | Works serverless, triggered by ext. cron | Needs external cron service |
| Local API  | Tests, custom scheduling  | Full control                             | No built-in scheduling      |

## Queue Selection

All jobs go to the `'default'` queue unless `queue` is specified. Use named queues to:

- **Control execution frequency:** run a `critical` queue every minute, `batch` queue nightly.
- **Isolate workload types:** keep email jobs from competing with image-processing jobs.
- **Scale workers independently:** each queue gets its own `autoRun` entry or bin script process.

```ts
// see docs/jobs-queue/queues.mdx — Priority-Based Queues
export default buildConfig({
  jobs: {
    autoRun: [
      { cron: '* * * * *', queue: 'critical', limit: 100 }, // every minute
      { cron: '*/5 * * * *', queue: 'default', limit: 50 }, // every 5 min
      { cron: '0 2 * * *', queue: 'batch', limit: 1000 }, // nightly
    ],
  },
})

// Route jobs to the right queue at queue time
await payload.jobs.queue({ task: 'sendPasswordReset', input, queue: 'critical' })
await payload.jobs.queue({ task: 'sendWelcomeEmail', input, queue: 'default' })
await payload.jobs.queue({ task: 'generateAnalytics', input, queue: 'batch' })
```

### Environment-based queue control

Use `shouldAutoRun` to prevent all Next.js instances from running workers:

```ts
shouldAutoRun: async (payload) => {
  return process.env.ENABLE_JOB_WORKERS === 'true'
}
```

Deploy only designated worker instances with `ENABLE_JOB_WORKERS=true`.

### `processingOrder`

By default jobs run FIFO. Override globally or per queue:

```ts
jobs: {
  processingOrder: {
    default: 'createdAt',    // FIFO
    queues: { lifo: '-createdAt' }, // LIFO for this queue
  },
}
```

## Gotchas

1. **Queueing inside an `afterChange` hook without `req` runs outside the transaction.** In a collection hook, always use `req.payload.jobs.queue({ ..., req })` — passing `req` ensures the queue call participates in the hook's transaction. If you use `payload.jobs.queue` (from the closure) you bypass the transaction, and the job may be queued even if the save is later rolled back.

2. **Jobs are out-of-band — don't expect immediate execution.** `payload.jobs.queue` writes to the database. Execution depends on the configured runner picking it up on its next poll interval. Never rely on job output in the same request that queued it.

3. **`autoRun` doesn't work on serverless platforms.** Serverless functions are ephemeral; cron schedules registered at process start don't survive across cold starts. Use the `/api/payload-jobs/run` endpoint triggered by Vercel Cron instead.

4. **Scheduling and running are separate steps.** Adding `schedule: [{ cron, queue }]` to a task only queues jobs — it does nothing unless a runner (bin script, `autoRun`, or endpoint) also processes that `queue`. Both must use the same `queue` name, or jobs will accumulate without running.

5. **Don't use both the `handle-schedules` bin script and `autoRun` for the same queue.** `autoRun` calls `handleSchedules` by default. Running both causes duplicate job entries. Choose one approach: all-in-one bin script (`--handle-schedules` flag), `autoRun` config, or separate endpoint calls.

6. **`enableConcurrencyControl: true` requires a migration.** It adds a `concurrencyKey` index to the `payload-jobs` collection schema. If you enable this in an existing project, run `pnpm payload migrate:create` before deploying.

7. **HMR resets `autoRun` cron schedules in development.** After saving a file that triggers hot module reload, the cron schedule restarts. This is expected — restart the dev server after editing job config. Not an issue in production.

8. **The `payload-jobs` collection is hidden by default.** Use `jobsCollectionOverrides` to expose it for debugging:

   ```ts
   // see test/queues/getConfig.ts
   jobsCollectionOverrides: ({ defaultJobsCollection }) => ({
     ...defaultJobsCollection,
     admin: { ...defaultJobsCollection.admin, hidden: false },
   })
   ```

9. **Task handlers should be idempotent.** Retries re-run the same handler with the same input. If your handler creates records, check whether the record already exists before creating it again. Workflows protect against re-running completed tasks, but individual task handlers have no automatic idempotency guard.

## Related

- [HOOKS.md](HOOKS.md) — offloading expensive hook work to jobs; `afterChange` hook patterns; keeping hooks non-blocking
- [ADAPTERS.md](ADAPTERS.md) — transactions in hooks; why `req` matters for transaction membership
- [PRODUCTION.md](PRODUCTION.md) — deploying job workers (`autoRun` vs bin script), `shouldAutoRun` env-gating, Vercel Cron setup
