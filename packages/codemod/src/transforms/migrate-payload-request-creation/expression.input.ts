import { createLocalReq } from 'payload'

const req = await createLocalReq(getOptions(), getPayload())
const conditional = createLocalReq(enabled ? first : second, payload)
const nested = createLocalReq({ req: await createLocalReq({}, payload) }, payload)
