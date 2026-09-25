import type { CliArgs, ProjectTemplate } from '../types.js'

const VALID_DB_TYPES = 'mongodb, postgres, sqlite, vercel-postgres, d1-sqlite'

/**
 * When `--yes` is set, fills in defaults for prompt-backed choices that were not
 * set explicitly (template → blank, agent → none) and validates the inputs that
 * have no safe default (project name, database). Mutates and returns `args`.
 * A no-op when `--yes` is not set. Explicit flags always take precedence.
 */
export function applyYesDefaults(args: CliArgs, validTemplates: ProjectTemplate[]): CliArgs {
  if (!args['--yes']) {
    return args
  }

  const projectName = args['--name'] || args._[0]
  if (!projectName) {
    throw new Error(
      "--yes requires a project name or '.' for the current directory (e.g. create-payload-app my-app --db sqlite -y, or create-payload-app . --db sqlite -y)",
    )
  }

  const usingExample = Boolean(args['--example'])

  if (!args['--template'] && !usingExample) {
    args['--template'] = 'blank'
  }

  if (!args['--agent'] && !args['--no-agent']) {
    args['--no-agent'] = true
  }

  const template = validTemplates.find((t) => t.name === args['--template'])
  const needsDb = !usingExample && template?.type === 'starter' && !template?.dbType
  if (needsDb && !args['--db']) {
    throw new Error(`--yes requires --db (one of: ${VALID_DB_TYPES})`)
  }

  return args
}
