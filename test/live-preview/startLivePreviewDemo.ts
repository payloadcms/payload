import payload, { Payload } from '../../packages/payload/src'
import { spawn } from 'child_process'
import path from 'path'

export const startLivePreviewDemo = async (args: { payload: Payload }): Promise<void> => {
  let installing = false
  let started = false

  // Install the node modules for the Next.js app
  const installation = spawn('yarn', ['install'], {
    cwd: path.resolve(__dirname, './next-app'),
  })

  installation.stdout.on('data', (data) => {
    if (!installing) {
      payload.logger.info('Installing Next.js...')
      installing = true
    }

    payload.logger.info(data.toString())
  })

  installation.stderr.on('data', (data) => {
    payload.logger.error(data.toString())
  })

  installation.on('exit', (code) => {
    payload.logger.info(`Next.js exited with code ${code}`)
  })

  // Boot up the Next.js app
  const app = spawn('yarn', ['dev'], {
    cwd: path.resolve(__dirname, './next-app'),
  })

  app.stdout.on('data', (data) => {
    if (!started) {
      payload.logger.info('Starting Next.js...')
      started = true
    }

    payload.logger.info(data.toString())
  })

  app.stderr.on('data', (data) => {
    payload.logger.error(data.toString())
  })

  app.on('exit', (code) => {
    payload.logger.info(`Next.js exited with code ${code}`)
  })
}
