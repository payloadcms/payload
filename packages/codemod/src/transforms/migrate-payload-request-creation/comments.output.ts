import { createPayloadReq } from 'payload'

const req = createPayloadReq({
  /* options */ ...{ user } /* after options */,
  // payload instance
  payload: payload /* after payload */,
})
const empty = createPayloadReq({ /* empty options */  payload: payload })
