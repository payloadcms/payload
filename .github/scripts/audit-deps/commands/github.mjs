import { decidePrSteps } from '../github.mjs'
import { readPlan } from '../plan.mjs'

/**
 * Runs the `Decide PR steps` workflow step from actions/github-script. Reads `IS_DEFAULT_INPUTS`,
 * `PLAN_FILE` and `REF` from `env`.
 * @param {{ context: any, core: any, env: Record<string, string | undefined>, github: any }} params
 */
export async function runDecidePrSteps({ context, core, env, github }) {
  const plan = await readPlan({ path: env.PLAN_FILE })

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
