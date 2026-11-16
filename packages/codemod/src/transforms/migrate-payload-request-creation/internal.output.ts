import { initAdminContext, type InitAdminContextArgs, type AdminContextCache, type PartialAdminContext } from 'payload/internal'
import { initAdminContext as initialize, type InitAdminContextArgs as Args } from 'payload/internal'

const context = initAdminContext(args as InitAdminContextArgs)
const aliased = initialize(args as Args)
type Cache = AdminContextCache
type PartialContext = PartialAdminContext
