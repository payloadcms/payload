import type { CodegenEvalCase } from '../../types.js'

/**
 * Jobs Queue eval cases.
 *
 * NOTE for downstream task implementers:
 * Only include assertions that the LLM must actively produce — never assertions
 * already satisfied by the starter fixture (those are false signal). When no
 * AST assertion kind applies, leave `assertions: []` and rely on the scorer.
 *
 * The assertion catalog covers collections, fields, hooks, and access — not
 * top-level config properties like `jobs.tasks`, `jobs.workflows`, or
 * `jobs.autoRun`. All jobs-config cases rely on the OpenAI scorer rather than
 * AST checks, with the exception of cases that also add a collection hook.
 */
export const jobsCodegenDataset: CodegenEvalCase[] = [
  // ──────────────────────────────────────────────────────────
  // Positive cases — valid config modifications
  // ──────────────────────────────────────────────────────────
  {
    input:
      'Add a send-email task to the jobs config with an inputSchema that accepts a `to` email address and a `subject` text field.',
    expected:
      'A task with slug "send-email" (or "sendEmail") added to jobs.tasks, with inputSchema containing a field named "to" of type "email" and a field named "subject" of type "text", and a handler function',
    category: 'jobs',
    fixturePath: 'jobs/codegen/add-simple-task',
    // No AST assertion kind covers jobs.tasks[] config — scorer carries the load.
    assertions: [],
  },
  {
    input:
      'Add a task called "process-upload" to the jobs config with 3 retries and an inputSchema that requires a `fileId` text field.',
    expected:
      'A task with slug "process-upload" (or similar) added to jobs.tasks with retries: 3 and inputSchema containing a required "fileId" text field, plus a handler function',
    category: 'jobs',
    fixturePath: 'jobs/codegen/add-task-with-retries',
    // No AST assertion kind covers jobs.tasks[] config — scorer carries the load.
    assertions: [],
  },
  {
    input:
      'Add a daily cleanup task to the jobs config that runs at 2 AM every night. It should remove records from the temp-files collection that are older than 7 days.',
    expected:
      'A task added to jobs.tasks with a schedule property containing a cron expression for 2 AM daily (e.g. "0 2 * * *") and a queue name, plus a handler that queries and deletes old temp-files; an autoRun entry (or note about needing a runner) using the same queue name',
    category: 'jobs',
    fixturePath: 'jobs/codegen/add-scheduled-task',
    // No AST assertion kind covers jobs.tasks[].schedule or jobs.autoRun — scorer carries the load.
    assertions: [],
  },
  {
    input:
      'Add a workflow called "publish-post" that runs two tasks in sequence: first "validate-post", then "notify-subscribers". The workflow should accept a postId input.',
    expected:
      'A workflow added to jobs.workflows with slug "publish-post", inputSchema containing a postId field, and a handler that calls tasks.validatePost (or the equivalent task slug) followed by tasks.notifySubscribers using stable task ID strings',
    category: 'jobs',
    fixturePath: 'jobs/codegen/add-workflow',
    // No AST assertion kind covers jobs.workflows[] config — scorer carries the load.
    assertions: [],
  },
  {
    input:
      'Enable autoRun for the jobs queue so the server automatically picks up and runs queued jobs every minute from the default queue.',
    expected:
      'An autoRun array added to the jobs config with at least one entry containing a cron expression for every minute ("* * * * *" or similar) and queue: "default" (or no queue specified, defaulting to default)',
    category: 'jobs',
    fixturePath: 'jobs/codegen/enable-autorun',
    // No AST assertion kind covers jobs.autoRun config — scorer carries the load.
    assertions: [],
  },
  {
    input:
      'Queue a send-welcome-email job in the afterChange hook on the users collection so that when a new user is created, a welcome email job is added to the queue.',
    expected:
      'An afterChange hook added to the users collection that calls req.payload.jobs.queue (or payload.jobs.queue) with the send-welcome-email task and passes req to the queue call',
    category: 'jobs',
    fixturePath: 'jobs/codegen/queue-job-from-afterchange',
    assertions: [{ kind: 'collectionHook', hook: 'afterChange', slug: 'users' }],
  },
  // ──────────────────────────────────────────────────────────
  // Correction case — broken fixture that the LLM must fix
  // ──────────────────────────────────────────────────────────
  {
    input:
      'This config has a task with a broken handler path — it uses a relative path like "./tasks/myHandler" instead of an absolute path. Fix it so the handler uses `path.resolve` with `import.meta.url` to build an absolute path.',
    expected:
      'The handler string changed from a relative path to an absolute path computed via path.resolve(dirname, ...) where dirname is derived from fileURLToPath(import.meta.url), and the path includes a named export reference (e.g. "#handlerName")',
    category: 'jobs',
    fixturePath: 'jobs/codegen/fix-relative-handler-path',
    // No AST assertion kind covers jobs.tasks[].handler string values — scorer carries the load.
    assertions: [],
  },
]
