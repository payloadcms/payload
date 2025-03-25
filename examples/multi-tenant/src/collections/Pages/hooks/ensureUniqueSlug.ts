import type { FieldHook, Where } from 'payload'

import { ValidationError } from 'payload'

import { getUserTenantIDs } from '../../../utilities/getUserTenantIDs'
import { extractID } from '@/utilities/extractID'

export const ensureUniqueSlug: FieldHook = async ({ data, originalDoc, req, value }) => {
  // if value is unchanged, skip validation
  if (originalDoc.slug === value) {
    return value
  }

  const constraints: Where[] = [
    {
      slug: {
        equals: value,
      },
    },
  ]

  const incomingTenantID = extractID(data?.tenant)
  const currentTenantID = extractID(originalDoc?.tenant)
  const tenantIDToMatch = incomingTenantID || currentTenantID

  if (tenantIDToMatch) {
    constraints.push({
      tenant: {
        equals: tenantIDToMatch,
      },
    })
  }

  const findDuplicatePages = await req.payload.find({
    collection: 'pages',
    where: {
      and: constraints,
    },
  })

  if (findDuplicatePages.docs.length > 0 && req.user) {
    const tenantIDs = getUserTenantIDs(req.user)
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
