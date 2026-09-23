import { getAdminContext, type GetAdminContextArgs, type AdminContextCache, type PartialAdminContext } from 'payload/internal'
import { getAdminContext as initialize, type GetAdminContextArgs as Args } from 'payload/internal'

const context = getAdminContext(args as GetAdminContextArgs)
const aliased = initialize(args as Args)
type Cache = AdminContextCache
type PartialContext = PartialAdminContext
