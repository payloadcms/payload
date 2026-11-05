import { createLocalReq } from 'payload'

const req = createLocalReq({}, payload)
function unrelated(createLocalReq: Function) {
  return createLocalReq({}, payload)
}
