import type { CreatePayloadRequestArgs as Options, AdminContext as Result } from 'payload'

import { createPayloadRequest as local, createPayloadRequestFromWebRequest as web } from 'payload'

const options: Omit<Options, 'payload'> = { user }
const req = local({ payload: payload, get context() { return options.context }, get depth() { return options.depth }, get fallbackLocale() { return options.fallbackLocale }, get locale() { return options.locale }, get req() { return options.req }, get urlSuffix() { return options.urlSuffix }, get user() { return options.user } })
const request = web(input, config)
type Context = Result
