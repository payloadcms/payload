import { createLocalReq, type CreateLocalReqOptions } from 'payload'

const options: CreateLocalReqOptions = { user }
const req = await createLocalReq({ user, context: { source: 'test' } }, payload)
