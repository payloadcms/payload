import { spawn } from 'node:child_process'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import path from 'path'

const _filename = fileURLToPath(import.meta.url)
const _dirname = dirname(_filename)

export const startChildProcess = async (filePath: string): Promise<number> => {
  return new Promise<number>((res) => {
    const childProcess = spawn(
      'node',
      [
        '--no-deprecation',
        '--import',
        '@swc-node/register/esm-register',
        path.resolve(_dirname, 'init.js'),
      ],
      {
        env: {
          LOADER_TEST_FILE_PATH: filePath,
          NODE_ENV: 'development',
          PATH: process.env.PATH,
        },
        stdio: 'inherit',
      },
    )

    childProcess.on('close', (code) => {
      res(code)
    })
  })
}
