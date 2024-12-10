import type { InitializedEmailAdapter } from './types.js'

export const emailDefaults: Pick<
  InitializedEmailAdapter,
  'defaultFromAddress' | 'defaultFromName'
> = {
  defaultFromAddress: 'info@payloadcms.com',
  defaultFromName: 'Payload',
}
