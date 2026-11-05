import { createLocalReq } from 'payload'

const options: any = { user }
const req = createLocalReq(
  /* options */ options /* after options */,
  // payload instance
  payload /* after payload */,
)
const empty = createLocalReq({ /* empty options */ }, payload)
