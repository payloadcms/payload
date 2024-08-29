import * as p from '@clack/prompts'
import slugify from '@sindresorhus/slugify'

import type { CliArgs } from '../types.js'

export async function parseProjectName(args: CliArgs): Promise<string> {
  if (args['--name']) {
    return slugify(args['--name'])
  }
  if (args._[0]) {
    return slugify(args._[0])
  }

  const projectName = await p.text({
    message: 'Project name?',
    validate: (value) => {
      if (!value) {
        return 'Please enter a project name.'
      }
    },
  })
  if (p.isCancel(projectName)) {
    process.exit(0)
  }
  return slugify(projectName)
}
