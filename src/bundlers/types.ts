import type { PayloadHandler, SanitizedConfig } from 'payload/config';

export interface PayloadBundler {
  dev: (config: SanitizedConfig) => Promise<PayloadHandler>, // this would be a typical Express middleware handler
  build: (config: SanitizedConfig) => Promise<void> // used in `payload build`
  serve: (config: SanitizedConfig) => Promise<PayloadHandler> // serve built files in production
}
