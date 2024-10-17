import type { FieldHook } from 'payload'

import { ValidationError } from 'payload'

import { getTenantAccessIDs } from '../../../utilities/getTenantAccessIDs'

export const ensureUniqueSlug: FieldHook = async ({ data, originalDoc, req, value }) => {
  // if value is unchanged, skip validation
  if (originalDoc.slug === value) {return value}

  const incomingTenantID = typeof data?.tenant === 'object' ? data.tenant.id : data?.tenant
  const currentTenantID =
    typeof originalDoc?.tenant === 'object' ? originalDoc.tenant.id : originalDoc?.tenant
  const tenantIDToMatch = incomingTenantID || currentTenantID

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
    if (req.user.roles?.includes('super-admin') || tenantIDs.length > 1) {
      const attemptedTenantChange = await req.payload.findByID({
        id: tenantIDToMatch,
        collection: 'tenants',
      })

      throw new ValidationError({
        errors: [
          {
            field: 'slug',
            message: `The "${attemptedTenantChange.name}" tenant already has a page with the slug "${value}". Slugs must be unique per tenant.`,
          },
        ],
      })
    }

    throw new ValidationError({
      errors: [
        {
          field: 'slug',
          message: `A page with the slug ${value} already exists. Slug must be unique per tenant.`,
        },
      ],
    })
  }

  return value
}
