import { PROJECT_ROOT } from '@tools/constants'
import { execSync } from 'child_process'
import path from 'path'
import { describe, expect, it } from 'vitest'

import { packagePublishList } from './publishList.js'

type TurboTask = {
  dependencies: string[]
  directory: string
  package: string
  task: string
}

const shortNameFromTaskId = (taskId: string, byPackage: Map<string, string>): string | undefined =>
  byPackage.get(taskId.replace(/#.*$/, ''))

describe('packagePublishList topological order (turbo-derived)', () => {
  it('should list every build dependency before its dependents', async () => {
    const raw = execSync('pnpm turbo run build --dry-run=json', {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
    })
    // Guard against any non-JSON preamble turbo may print.
    const json = JSON.parse(raw.slice(raw.indexOf('{'))) as { tasks: TurboTask[] }
    const buildTasks = json.tasks.filter((task) => task.task === 'build')

    // npm name -> short (publish-list) name, via each task's directory basename.
    const shortByPackage = new Map(
      buildTasks.map((task) => [task.package, path.basename(task.directory)]),
    )

    const publishSet = new Set(packagePublishList)
    const positions = new Map(packagePublishList.map((short, index) => [short, index]))

    expect(buildTasks.length).toBeGreaterThan(0)

    let comparisonsChecked = 0
    const violations: string[] = []
    for (const task of buildTasks) {
      const short = shortByPackage.get(task.package)
      if (!short || !publishSet.has(short)) {
        continue
      }
      for (const depTaskId of task.dependencies) {
        const depShort = shortNameFromTaskId(depTaskId, shortByPackage)
        if (!depShort || !publishSet.has(depShort) || depShort === short) {
          continue
        }
        comparisonsChecked++
        if (positions.get(depShort)! > positions.get(short)!) {
          violations.push(`${depShort} must precede ${short}`)
        }
      }
    }

    expect(comparisonsChecked).toBeGreaterThan(0)
    expect(violations).toEqual([])
  }, 120_000)
})
