import { createLocalReq } from 'payload'

const options = { user: 'old' }
const newUser = 'new'
const payload = {}
const safe = createLocalReq({}, payload)
globalThis.observed = createLocalReq(options, (options.user = newUser, payload)).user
