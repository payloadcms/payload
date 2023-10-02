import payload, { Payload } from '../../packages/payload/src'
import { exec, execSync } from 'child_process'
import path from 'path'

export const startLivePreviewDemo = async (args: { payload: Payload }): Promise<void> => {
  payload.logger.info('Starting Next.js...')

  await exec(`cd ${path.resolve(__dirname, './next-app')} && yarn dev`, (err, stdout, stderr) => {
    if (err) {
      payload.logger.error(err)
      return
    }

    // Do not log here because the Next.js app does not send a response
  })

  payload.logger.info(`Next.js App URL: http://localhost:3001`)
}
