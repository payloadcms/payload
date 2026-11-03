import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { decidePrSteps } from '../github.mjs'

/**
 * Step function for `Decide PR steps`. Reads env `IS_DEFAULT_INPUTS`, `REF`, `RUNNER_TEMP`.
 * @param {{ context: any, core: any, env: Record<string, string | undefined>, github: any }} params
 */
export async function runDecidePrSteps({ context, core, env, github }) {
  const plan = await readJson({ file: path.join(env.RUNNER_TEMP, 'audit-plan', 'plan.json') })

  await decidePrSteps({
    core,
    github,
    isDefaultInputs: env.IS_DEFAULT_INPUTS === 'true',
    owner: context.repo.owner,
    plan,
    ref: env.REF,
    repo: context.repo.repo,
  })
}

async function readJson({ file }) {
  return JSON.parse(await readFile(file, 'utf8'))
}
