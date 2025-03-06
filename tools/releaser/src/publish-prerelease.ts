import chalk from 'chalk'
import minimist from 'minimist'

import { getWorkspace } from './lib/getWorkspace.js'

async function main() {
  const args = minimist(process.argv.slice(2))

  const { bump = 'minor', 'dry-run': dryRun, tag } = args

  if (!tag || !['canary', 'internal'].includes(tag)) {
    abort('Tag is required. Use --tag <canary|internal>')
  }

  console.log(`\n  Bump: ${bump}`)
  console.log(`  Tag: ${tag}`)
  console.log(`  Dry Run: ${dryRun ? 'Enabled' : 'Disabled'}`)

  const workspace = await getWorkspace()
  await workspace.bumpVersion(tag)
  await workspace.build()
  await workspace.publishSync({ dryRun: dryRun ?? false, tag })

  header('🎉 Done!')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

function abort(message = 'Abort', exitCode = 1) {
  console.error(chalk.bold.red(`\n${message}\n`))
  process.exit(exitCode)
}

function header(message: string, opts?: { enable?: boolean }) {
  const { enable } = opts ?? {}
  if (!enable) {
    return
  }

  console.log(chalk.bold.green(`${message}\n`))
}
