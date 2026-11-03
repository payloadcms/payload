import path from 'node:path'

import { decidePrSteps } from '../github.mjs'
import { readPlan } from '../plan.mjs'

/**
 * Runs the `Decide PR steps` workflow step from actions/github-script. Reads `IS_DEFAULT_INPUTS`,
 * `REF` and `RUNNER_TEMP` from `env`.
 * @param {{ context: any, core: any, env: Record<string, string | undefined>, github: any }} params
 */
export async function runDecidePrSteps({ context, core, env, github }) {
  const plan = await readPlan({ path: path.join(env.RUNNER_TEMP, 'audit-plan', 'plan.json') })

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
