// Shared helpers for scripts/docker-*.ts.

import { spawn } from 'node:child_process'

export const COMPOSE_FILE = 'test/docker-compose.yml'

// Containers declared with `container_name:` in docker-compose.yml. Used when
// force-removing by name, in case they were orphaned outside the compose
// project's namespace (e.g. from a previous aborted run).
const NAMED_CONTAINERS = [
  'postgres-payload-test',
  'postgres-replica-payload-test',
  'mongodb-payload-test',
  'mongot-payload-test',
  'mongodb-atlas-payload-test',
  'localstack_demo',
  'vercel-blob-payload-test',
]

function run(
  args: string[],
  opts: { silent?: boolean; ignoreFailure?: boolean } = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', args, { stdio: opts.silent ? 'ignore' : 'inherit' })
    child.on('exit', (code) => {
      if (code === 0 || opts.ignoreFailure) {
        return resolve()
      }
      reject(new Error(`docker ${args.join(' ')} exited ${code}`))
    })
    child.on('error', (err) => (opts.ignoreFailure ? resolve() : reject(err)))
  })
}

/** Run `docker compose` against the payload compose file with the given profiles + action. */
export function compose(profiles: string[], ...action: string[]): Promise<void> {
  return run([
    'compose',
    '-f',
    COMPOSE_FILE,
    ...profiles.flatMap((x) => ['--profile', x]),
    ...action,
  ])
}

/** Force-remove named containers (if any), then compose-down everything with volumes wiped. */
export async function cleanAll(): Promise<void> {
  await run(['rm', '-f', ...NAMED_CONTAINERS], { silent: true, ignoreFailure: true })
  await compose(['all'], 'down', '-v', '--remove-orphans')
}
