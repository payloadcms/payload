import type { EvalCase } from '../../types.js'

export type { EvalCase }

export const conventionsQADataset: EvalCase[] = [
  {
    input:
      'In Payload, should you prefer types or interfaces when defining TypeScript data shapes?',
    expected: 'types should be preferred over interfaces, except when extending external types',
    category: 'coding',
  },
  {
    input: 'What naming convention should be used for boolean variables in Payload code?',
    expected:
      'booleans should be prefixed with is, has, can, or should — for example isValid, hasData, canEdit, shouldRun',
    category: 'coding',
  },
  {
    input: 'Should Payload code prefer functions or classes?',
    expected: 'functions are preferred over classes; classes are only used for errors and adapters',
    category: 'coding',
  },
  {
    input: 'When passing an error to payload.logger.error, what is the correct format?',
    expected:
      'use an object with msg and err keys, like payload.logger.error({ msg: "message", err: error }); do not pass the error as a second argument',
    category: 'coding',
  },
  {
    input: 'Where do translation files live in the Payload monorepo?',
    expected: 'packages/translations/src/languages/',
    category: 'structure',
  },
  {
    input: 'What is the pattern for cleaning up database records created during a Payload test?',
    expected:
      'tests must delete any records they create; use afterEach with a shared array of created IDs to centralize cleanup, then clear the array',
    category: 'testing',
  },
  {
    input: 'What format should the first commit on a new Payload branch follow? Give an example.',
    expected:
      'conventional commits format: <type>(<scope>): <lowercase title> — for example feat(db-mongodb): add support for transactions or fix(ui): json field type ignoring editorOptions',
    category: 'commits',
  },
  {
    input: 'How do you start the Payload dev server using a specific test config directory?',
    expected:
      'run pnpm run dev <directory_name>, for example pnpm run dev fields loads test/fields/config.ts',
    category: 'development',
  },
  {
    input: 'What are the default auto-login credentials when running the Payload dev server?',
    expected: 'email dev@payloadcms.com and password test',
    category: 'development',
  },
  {
    input:
      'In Payload functions, should parameters be passed as individual arguments or as a single object?',
    expected: 'prefer single object parameters to improve backwards-compatibility',
    category: 'coding',
  },
]
