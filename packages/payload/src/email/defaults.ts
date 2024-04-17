import type { EmailAdapter } from './types.js'

export const emailDefaults: Pick<
  EmailAdapter<any, unknown>,
  'defaultFromAddress' | 'defaultFromName'
> = {
  defaultFromAddress: 'info@payloadcms.com',
  defaultFromName: 'Payload',
}
