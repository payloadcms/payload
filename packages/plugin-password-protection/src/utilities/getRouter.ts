import type { Router } from 'express'
import express from 'express'
import type { Config as PayloadConfig } from 'payload/config'
import type { PayloadRequest } from 'payload/dist/express/types'

import type { PasswordProtectionOptions } from '../types'
import operation from './operation'

export default (config: PayloadConfig, options: PasswordProtectionOptions): Router => {
  const router = express.Router()

  // TODO: the second argument of router.post() needs to be typed correctly
  // @ts-expect-error
  router.post(options.routePath || '/validate-password', async (req: PayloadRequest, res) => {
    try {
      const { body: { collection, password, id } = {}, payload } = req

      await operation({
        config,
        payload,
        options,
        collection,
        password,
        id,
        res,
      })

      res.status(200).send()
    } catch (e: unknown) {
      res.status(401).send()
    }
  })

  return router
}
