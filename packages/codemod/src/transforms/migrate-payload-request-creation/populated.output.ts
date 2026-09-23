import { createPayloadReq, type CreatePayloadReqArgs } from 'payload'

const options: Omit<CreatePayloadReqArgs, 'payload'> = { user }
const req = await createPayloadReq({ payload: payload, get context() { return options.context }, get depth() { return options.depth }, get fallbackLocale() { return options.fallbackLocale }, get locale() { return options.locale }, get req() { return options.req }, get urlSuffix() { return options.urlSuffix }, get user() { return options.user } })
