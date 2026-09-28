import { createPayloadRequest } from 'payload'

const req = createPayloadRequest({ payload: payload })
function unrelated(createLocalReq: Function) {
  return createLocalReq({}, payload)
}
