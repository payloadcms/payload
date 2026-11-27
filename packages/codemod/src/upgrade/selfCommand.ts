import { resolve } from 'node:path'
import semver from 'semver'

import { readOwnVersion } from './defaultTag.js'

type ResolveSelfCommandArgs = {
  argv1?: string
  override?: string
}

/**
 * The command a follower types to re-invoke this CLI. A published install lives
 * under node_modules and is reached with npx pinned to this version; a source checkout is reached with
 * `node <bin>` so local testing runs the local build, not a published version.
 * `PAYLOAD_CODEMOD_COMMAND` overrides both.
 */
export function resolveSelfCommand({
  argv1 = process.argv[1],
  override = process.env.PAYLOAD_CODEMOD_COMMAND,
}: ResolveSelfCommandArgs = {}): string {
  if (override) {
    return override
  }
  if (argv1 && !argv1.includes('node_modules')) {
    return `node ${resolve(argv1)}`
  }
  const version = readOwnVersion()
  if (!version || !semver.valid(version)) {
    throw new Error(
      'Cannot determine this codemod version. Set PAYLOAD_CODEMOD_COMMAND to the command used to invoke it.',
    )
  }
  return `npx @payloadcms/codemod@${version}`
}
