import type { FieldHook } from 'payload'

import { ValidationError } from 'payload'

import { getTenantAccessIDs } from '../../../utilities/getTenantAccessIDs'
import { extractID } from '../../../utilities/extractID'

export const ensureUniqueSlug: FieldHook = async ({ data, originalDoc, req, value }) => {
  if (!value) {
    return value;
  }

  // if value is unchanged, skip validation
  if (originalDoc.slug === value) {
    return value
  }

  const incomingTenantID = extractID(data?.website)
  const currentTenantID = extractID(originalDoc?.website)
  const tenantIDToMatch = incomingTenantID || currentTenantID

  if (!tenantIDToMatch) {
    return value
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
    if (req.user.roles?.includes('super-admin') || tenantIDs.length > 1) {
      const attemptedTenantChange = await req.payload.findByID({
        id: tenantIDToMatch,
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
