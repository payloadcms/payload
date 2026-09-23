import { createLocalReq } from 'payload'

const req = createLocalReq(
  /* options */ { user } /* after options */,
  // payload instance
  payload /* after payload */,
)
const empty = createLocalReq({ /* empty options */ }, payload)
