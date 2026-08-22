import { execFileSync } from 'node:child_process'
import os from 'node:os'

import { getDependencies } from '../../index.js'
import { PAYLOAD_PACKAGE_LIST } from '../../versions/payloadPackageList.js'
import { defineCLICommand } from '../defineCLICommand.js'
import { strictObject } from '../zod.js'

export const createInfoCommand = defineCLICommand({
  description: 'Print environment and dependency information.',
  handler: async ({ isJSON }) => {
    const dependencies = await getDependencies(process.cwd(), [
      ...PAYLOAD_PACKAGE_LIST,
      'next',
      'react',
      'react-dom',
    ])
    const resolvedDependencies = Array.from(dependencies.resolved.entries()).map(
      ([name, { version }]) => ({
        name,
        version,
      }),
    )

    const cpuCores = os.cpus().length
    const primaryDependencies = resolvedDependencies.filter(
      ({ name }) => name === 'payload' || name === 'next',
    )
    const otherDependencies = resolvedDependencies
      .filter(({ name }) => name !== 'payload' && name !== 'next')
      .sort((a, b) => a.name.localeCompare(b.name))
    const formattedDependencies = [...primaryDependencies, ...otherDependencies]
      .map(({ name, version }) => `  ${name}: ${version}`)
      .join('\n')
    const result = {
      binaries: {
        node: process.versions.node,
        npm: getBinaryVersion('npm'),
        pnpm: getBinaryVersion('pnpm'),
        yarn: getBinaryVersion('yarn'),
      },
      operatingSystem: {
        architecture: os.arch(),
        availableCPUCores: cpuCores > 0 ? cpuCores : null,
        availableMemoryMB: Math.ceil(os.totalmem() / 1024 / 1024),
        platform: os.platform(),
        version: os.version(),
      },
      packages: resolvedDependencies,
    }

    if (!isJSON) {
      // eslint-disable-next-line no-console
      console.log(`
Binaries:
  Node: ${result.binaries.node}
  npm: ${result.binaries.npm}
  Yarn: ${result.binaries.yarn}
  pnpm: ${result.binaries.pnpm}
Relevant Packages:
${formattedDependencies}
Operating System:
  Platform: ${result.operatingSystem.platform}
  Arch: ${result.operatingSystem.architecture}
  Version: ${result.operatingSystem.version}
  Available memory (MB): ${result.operatingSystem.availableMemoryMB}
  Available CPU cores: ${cpuCores > 0 ? cpuCores : 'N/A'}
`)
    }

    return { result }
  },
  helpGroup: 'Core commands',
  input: strictObject({}),
})

const getBinaryVersion = (binaryName: string): string => {
  try {
    return execFileSync(binaryName, ['--version']).toString().trim()
  } catch {
    return 'N/A'
  }
}
