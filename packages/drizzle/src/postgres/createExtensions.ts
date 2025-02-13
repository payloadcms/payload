import { captureError } from 'payload'

import type { BasePostgresAdapter } from './types.js'

export const createExtensions = async function (this: BasePostgresAdapter): Promise<void> {
  for (const extension in this.extensions) {
    if (this.extensions[extension]) {
      try {
        await this.drizzle.execute(`CREATE EXTENSION IF NOT EXISTS "${extension}"`)
      } catch (err) {
        await captureError({
          err,
          msg: `Failed to create extension ${extension}`,
          payload: this.payload,
        })
      }
    }
  }
}
