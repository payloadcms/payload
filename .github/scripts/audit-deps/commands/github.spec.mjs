import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { runDecidePrSteps } from './github.mjs'

describe('runDecidePrSteps', () => {
  let planDir

  afterEach(async () => {
    await rm(planDir, { force: true, recursive: true })
  })

  it('should dry-run every planned PR without calling the API for non-default inputs', async () => {
    planDir = await mkdtemp(path.join(tmpdir(), 'audit-deps-github-'))
    const planFile = path.join(planDir, 'plan.json')
    await writeFile(
      planFile,
      JSON.stringify({
        bumps: [{ id: 'lodash-4' }, { id: 'react-19' }],
        noFix: [],
        originDirs: {},
        prs: [
          { branch: 'ci/audit-deps-fix-main-non-major', bumpIds: ['lodash-4'], id: 'non-major' },
          { branch: 'ci/audit-deps-fix-main-react-19', bumpIds: ['react-19'], id: 'react-19' },
        ],
      }),
    )
    const core = { setOutput: vi.fn() }
    const github = { paginate: vi.fn(), rest: { pulls: { get: vi.fn(), list: vi.fn() } } }

    await runDecidePrSteps({
      context: { repo: { owner: 'payloadcms', repo: 'payload' } },
      core,
      env: { IS_DEFAULT_INPUTS: 'false', PLAN_FILE: planFile, REF: 'main' },
      github,
    })

    const outputs = Object.fromEntries(core.setOutput.mock.calls)

    expect(JSON.parse(outputs.pr_steps)).toEqual({
      'non-major': { headSha: null, prNumber: null, step: 'dry-run' },
      'react-19': { headSha: null, prNumber: null, step: 'dry-run' },
    })
    expect(outputs.stale_prs).toBe('[]')
    expect(github.paginate).not.toHaveBeenCalled()
    expect(github.rest.pulls.list).not.toHaveBeenCalled()
  })
})
