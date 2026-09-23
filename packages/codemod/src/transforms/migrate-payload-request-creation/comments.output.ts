import { createPayloadReq } from 'payload'

const options: any = { user }
const req = createPayloadReq({
  /* options */  /* after options */
  // payload instance
  payload: payload /* after payload */, get context() { return options.context }, get depth() { return options.depth }, get fallbackLocale() { return options.fallbackLocale }, get locale() { return options.locale }, get req() { return options.req }, get urlSuffix() { return options.urlSuffix }, get user() { return options.user },
})
const empty = createPayloadReq({ /* empty options */  payload: payload })
