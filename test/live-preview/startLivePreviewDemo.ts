import next from 'next'
import path from 'path'
import payload, { Payload } from '../../packages/payload/src'
import express from 'express'

export const startLivePreviewDemo = async (args: {
  expressApp: express.Express
  payload: Payload
}): Promise<void> => {
  const { expressApp, payload } = args

  const nextApp = next({
    dev: process.env.NODE_ENV !== 'production',
    dir: path.resolve(__dirname, './next-app'),
  })

  const nextHandler = nextApp.getRequestHandler()

  expressApp.get('*', (req, res) => nextHandler(req, res))

  nextApp.prepare().then(() => {
    payload.logger.info('Next.js started')

    expressApp.listen(3001, async () => {
      payload.logger.info(`Next.js App URL: http://localhost:3001`)
    })
  })
}
