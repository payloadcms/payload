import { initReq, type InitReqArgs, type InitReqCache, type InitReqPartialResult } from 'payload/internal'
import { initReq as initialize, type InitReqArgs as Args } from 'payload/internal'

const context = initReq(args as InitReqArgs)
const aliased = initialize(args as Args)
type Cache = InitReqCache
type PartialContext = InitReqPartialResult
