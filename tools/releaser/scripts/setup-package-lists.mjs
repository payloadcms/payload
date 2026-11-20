import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const generator = fileURLToPath(new URL('./generate-package-list.mjs', import.meta.url))
const packageDirectories = ['codemod', 'create-payload-app'].map((directory) =>
  fileURLToPath(new URL(`../../../packages/${directory}`, import.meta.url)),
)

export default function setup({ config: { root } }) {
  const directories = packageDirectories.includes(root) ? [root] : packageDirectories

  for (const cwd of directories) {
    execFileSync(process.execPath, [generator], { cwd, stdio: 'inherit' })
  }
}
