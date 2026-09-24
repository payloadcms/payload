import { createAdminContext, type CreateAdminContextArgs, type AdminContextCache, type PartialAdminContext } from 'payload/internal'
import { createAdminContext as initialize, type CreateAdminContextArgs as Args } from 'payload/internal'

const context = createAdminContext(args as CreateAdminContextArgs)
const aliased = initialize(args as Args)
type Cache = AdminContextCache
type PartialContext = PartialAdminContext
