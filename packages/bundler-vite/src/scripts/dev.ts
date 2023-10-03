import type { PayloadHandler } from 'payload/config'
// @ts-expect-error
import type { InlineConfig } from 'vite'

import express from 'express'

import type { Payload } from '../../../payload'

import { getViteConfig } from '../config'

const router = express.Router()

type DevAdminType = (options: {
  payload: Payload
  viteConfig: InlineConfig
}) => Promise<PayloadHandler>
export const devAdmin: DevAdminType = async ({ payload, viteConfig: viteConfigArg }) => {
  const vite = await import('vite')

  try {
    const viteConfig = await getViteConfig(payload.config)
    const viteServer = await vite.createServer(viteConfig)

    router.use(viteServer.middlewares)
  } catch (err) {
    console.error(err)
    throw new Error('Error: there was an error creating the vite dev server.')
  }

  return router
}
