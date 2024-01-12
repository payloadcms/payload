import type { PayloadHandler, SanitizedConfig } from 'payload/config'

import type { Payload } from '../types'

export interface PayloadBundler {
  build: (payloadConfig: SanitizedConfig) => Promise<void> // used in `payload build`
  dev: (payload: Payload) => Promise<PayloadHandler> // this would be a typical Express middleware handler
  serve: (payload: Payload) => Promise<PayloadHandler> // serve built files in production
}
