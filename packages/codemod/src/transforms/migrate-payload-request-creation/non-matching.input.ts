import { createLocalReq, initReq, type InitReqResult } from 'unrelated'
import { unrelated } from 'payload'

const req=createLocalReq({},payload);
const context = initReq(args)
type Result = InitReqResult
