import chalk from 'chalk'

import { getWorkspace } from './lib/getWorkspace.js'

async function main() {
  const workspace = await getWorkspace()
  await workspace.bumpVersion('canary')
  await workspace.build()
  await workspace.publishSync({ dryRun: false, tag: 'canary' })

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
