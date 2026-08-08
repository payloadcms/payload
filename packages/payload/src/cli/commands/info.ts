import { execFileSync } from 'node:child_process'
import os from 'node:os'

import { getDependencies } from '../../index.js'
import { PAYLOAD_PACKAGE_LIST } from '../../versions/payloadPackageList.js'
import { defineCLICommand } from '../defineCLICommand.js'
import { strictObject } from '../zod.js'

export const createInfoCommand = defineCLICommand({
  name: 'info',
  description: 'Print environment and dependency information.',
  handler: async () => {
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

    // eslint-disable-next-line no-console
    console.log(`
Binaries:
  Node: ${process.versions.node}
  npm: ${getBinaryVersion('npm')}
  Yarn: ${getBinaryVersion('yarn')}
  pnpm: ${getBinaryVersion('pnpm')}
Relevant Packages:
${formattedDependencies}
Operating System:
  Platform: ${os.platform()}
  Arch: ${os.arch()}
  Version: ${os.version()}
  Available memory (MB): ${Math.ceil(os.totalmem() / 1024 / 1024)}
  Available CPU cores: ${cpuCores > 0 ? cpuCores : 'N/A'}
`)
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
