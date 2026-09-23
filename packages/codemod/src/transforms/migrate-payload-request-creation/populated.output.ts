import { createPayloadReq, type CreatePayloadReqArgs } from 'payload'

const options: CreatePayloadReqArgs = { user }
const req = await createPayloadReq({ ...{ user, context: { source: 'test' } }, payload: payload })
