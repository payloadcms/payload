import { createLocalReq, createLocalReq as optional, createLocalReq as spread, createLocalReq as indirect } from 'payload'

const safe = createLocalReq({}, payload)
const wrong = createLocalReq(options)
const maybe = optional?.({}, payload)
const variadic = spread(...args, payload)
const callback = indirect
const viaCall = indirect.call(null, {}, payload)
