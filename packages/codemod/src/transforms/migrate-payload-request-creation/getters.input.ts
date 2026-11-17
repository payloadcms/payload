import { createLocalReq } from 'payload'

const events = []
let payload = { id: 'original' }
const inherited = {
  get context() { events.push('context'); payload = { id: 'replacement' }; return 'context' },
  get depth() { events.push('depth'); return 1 },
  get fallbackLocale() { events.push('fallbackLocale'); return 'en' },
  get locale() { events.push('locale'); return 'fr' },
  get req() { events.push('req'); return {} },
  get urlSuffix() { events.push('urlSuffix'); return '/path' },
  get user() { events.push('user'); return 'inherited' },
}
const options = Object.create(inherited, {
  unrelated: { enumerable: true, get() { throw new Error('unrelated getter must not run') } },
})
globalThis.observed = { request: createLocalReq(options, payload), events }
