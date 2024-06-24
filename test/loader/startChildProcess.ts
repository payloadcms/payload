import { spawn } from 'node:child_process'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import path from 'path'

const _filename = fileURLToPath(import.meta.url)
const _dirname = dirname(_filename)

export const startChildProcess = async (filePath: string): Promise<number> => {
  return new Promise<number>((res) => {
    const childProcess = spawn('node', [path.resolve(_dirname, 'init.js')], {
      stdio: 'inherit',
      env: {
        PATH: process.env.PATH,
        NODE_ENV: 'development',
        LOADER_TEST_FILE_PATH: filePath,
      },
    })

    childProcess.on('close', (code) => {
      res(code)
    })
  })
}
