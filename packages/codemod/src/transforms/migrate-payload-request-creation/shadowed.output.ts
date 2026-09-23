import { createPayloadReq } from 'payload'

const req = createPayloadReq({ payload: payload })
function unrelated(createLocalReq: Function) {
  return createLocalReq({}, payload)
}
