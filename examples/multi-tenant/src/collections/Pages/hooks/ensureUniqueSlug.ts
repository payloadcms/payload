import { ValidationError, type FieldHook } from 'payload'
import type { Page } from '@/payload-types'

import { getTenantAccessIDs } from '@/utilities/getTenantAccessIDs'
import { userRole } from '@/collections/Users/roles'

export const ensureUniqueSlug: FieldHook<Page> = async ({ data, originalDoc, req, value }) => {
  // if value is unchanged, skip validation
  if (originalDoc?.slug === value) {
    return value
  }

  const incomingTenantID = typeof data?.tenant === 'object' ? data.tenant.id : data?.tenant

  const currentTenantID =
    typeof originalDoc?.tenant === 'object' ? originalDoc.tenant.id : originalDoc?.tenant

  const tenantIDToMatch = incomingTenantID || currentTenantID

  if (!tenantIDToMatch) {
    // Prevent admins to create pages without assigning a tenant
    throw new ValidationError({
      errors: [
        {
          message: `The entry with ID "${originalDoc?.id || data?.id || 'unknown'}" is missing a tenant assignment`,
          path: 'tenant',
        },
      ],
    })
  }

  const findDuplicatePages = await req.payload.find({
    collection: 'pages',
    where: {
      and: [
        {
          tenant: {
            equals: tenantIDToMatch,
          },
        },
        {
          slug: {
            equals: value,
          },
        },
      ],
    },
  })

  if (findDuplicatePages.docs.length > 0 && req.user) {
    const tenantIDs = getTenantAccessIDs(req.user)
    // if the user is an admin or has access to more than 1 tenant
    // provide a more specific error message
    if (req.user.roles?.includes(userRole.SUPER_ADMIN) || tenantIDs.length > 1) {
      const attemptedTenantChange = await req.payload.findByID({
        id: tenantIDToMatch!,
        collection: 'tenants',
      })

      throw new ValidationError({
        errors: [
          {
            message: `The "${attemptedTenantChange.name}" tenant already has a page with the slug "${value}". Slugs must be unique per tenant.`,
            path: 'slug',
          },
        ],
      })
    }

    throw new ValidationError({
      errors: [
        {
          message: `A page with the slug ${value} already exists. Slug must be unique per tenant.`,
          path: 'slug',
        },
      ],
    })
  }

  return value
}
