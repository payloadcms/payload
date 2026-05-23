import type { CodegenEvalCase } from '../../types.js'

export const jobsCodegenDataset: CodegenEvalCase[] = [
  // ──────────────────────────────────────────────────────────
  // Positive cases — valid config modifications
  // ──────────────────────────────────────────────────────────
  {
    assertions: [{ slug: 'send-email', kind: 'jobsTask' }],
    category: 'jobs',
    expected:
      'A task with slug "send-email" (or "sendEmail") added to jobs.tasks, with inputSchema containing a field named "to" of type "email" and a field named "subject" of type "text", and a handler function',
    fixturePath: 'jobs/codegen/add-simple-task',
    input:
      'Add a send-email task to the jobs config with an inputSchema that accepts a `to` email address and a `subject` text field.',
  },
  {
    assertions: [{ slug: 'process-upload', kind: 'jobsTask' }],
    category: 'jobs',
    expected:
      'A task with slug "process-upload" (or similar) added to jobs.tasks with retries: 3 and inputSchema containing a required "fileId" text field, plus a handler function',
    fixturePath: 'jobs/codegen/add-task-with-retries',
    input:
      'Add a task called "process-upload" to the jobs config with 3 retries and an inputSchema that requires a `fileId` text field.',
  },
  {
    category: 'jobs',
    expected:
      'A task added to jobs.tasks with a schedule property containing a cron expression for 2 AM daily (e.g. "0 2 * * *") and a queue name, plus a handler that queries and deletes old temp-files; an autoRun entry (or note about needing a runner) using the same queue name',
    fixturePath: 'jobs/codegen/add-scheduled-task',
    input:
      'Add a daily cleanup task to the jobs config that runs at 2 AM every night. It should remove records from the temp-files collection that are older than 7 days.',
    // Prompt does not specify an exact task slug so a jobsTask assertion would be unreliable —
    // scorer carries the load for the task and schedule content.
    assertions: [],
  },
  {
    assertions: [{ slug: 'publish-post', kind: 'jobsWorkflow' }],
    category: 'jobs',
    expected:
      'A workflow added to jobs.workflows with slug "publish-post", inputSchema containing a postId field, and a handler that calls tasks.validatePost (or the equivalent task slug) followed by tasks.notifySubscribers using stable task ID strings',
    fixturePath: 'jobs/codegen/add-workflow',
    input:
      'Add a workflow called "publish-post" that runs two tasks in sequence: first "validate-post", then "notify-subscribers". The workflow should accept a postId input.',
  },
  {
    assertions: [{ kind: 'configOption', path: 'jobs.autoRun' }],
    category: 'jobs',
    expected:
      'An autoRun array added to the jobs config with at least one entry containing a cron expression for every minute ("* * * * *" or similar) and queue: "default" (or no queue specified, defaulting to default)',
    fixturePath: 'jobs/codegen/enable-autorun',
    input:
      'Enable autoRun for the jobs queue so the server automatically picks up and runs queued jobs every minute from the default queue.',
  },
  {
    assertions: [{ slug: 'users', hook: 'afterChange', kind: 'collectionHook' }],
    category: 'jobs',
    expected:
      'An afterChange hook added to the users collection that calls req.payload.jobs.queue (or payload.jobs.queue) with the send-welcome-email task and passes req to the queue call',
    fixturePath: 'jobs/codegen/queue-job-from-afterchange',
    input:
      'Queue a send-welcome-email job in the afterChange hook on the users collection so that when a new user is created, a welcome email job is added to the queue.',
  },
  // ──────────────────────────────────────────────────────────
  // Correction case — broken fixture that the LLM must fix
  // ──────────────────────────────────────────────────────────
  {
    category: 'jobs',
    expected:
      'The handler string changed from a relative path to an absolute path computed via path.resolve(dirname, ...) where dirname is derived from fileURLToPath(import.meta.url), and the path includes a named export reference (e.g. "#handlerName")',
    fixturePath: 'jobs/codegen/fix-relative-handler-path',
    input:
      'This config has a task with a broken handler path — it uses a relative path like "./tasks/myHandler" instead of an absolute path. Fix it so the handler uses `path.resolve` with `import.meta.url` to build an absolute path.',
    // The task slug "generate-pdf" already exists in the starter fixture, so a jobsTask
    // assertion would be trivially satisfied. The fix is to the handler path string —
    // scorer carries the load.
    assertions: [],
  },
]
