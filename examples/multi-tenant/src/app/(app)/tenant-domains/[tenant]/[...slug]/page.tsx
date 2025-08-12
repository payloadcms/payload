import type { Where } from 'payload'

import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import { RenderPage } from '../../../../components/RenderPage'

// eslint-disable-next-line no-restricted-exports
export default async function Page({
  params: paramsPromise,
}: {
  params: Promise<{ slug?: string[]; tenant: string }>
}) {
  const params = await paramsPromise
  let slug = undefined
  if (params?.slug) {
    // remove the domain route param
    params.slug.splice(0, 1)
    slug = params.slug
  }

  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  try {
    const tenantsQuery = await payload.find({
      collection: 'tenants',
      overrideAccess: false,
      user,
      where: {
        domain: {
          equals: params.tenant,
        },
      },
    })

    // If no tenant is found, the user does not have access
    // Show the login view
    if (tenantsQuery.docs.length === 0) {
      redirect(
        `/tenant-domains/login?redirect=${encodeURIComponent(
          `/tenant-domains${slug ? `/${slug.join('/')}` : ''}`,
        )}`,
      )
    }
  } catch (e) {
    // If the query fails, it means the user did not have access to query on the domain field
    // Show the login view
    redirect(
      `/tenant-domains/login?redirect=${encodeURIComponent(
        `/tenant-domains${slug ? `/${slug.join('/')}` : ''}`,
      )}`,
    )
  }

  const slugConstraint: Where = slug
    ? {
        slug: {
          equals: slug.join('/'),
        },
      }
    : {
        or: [
          {
            slug: {
              equals: '',
            },
          },
          {
            slug: {
              equals: 'home',
            },
          },
          {
            slug: {
              exists: false,
            },
          },
        ],
      }

  const pageQuery = await payload.find({
    collection: 'pages',
    overrideAccess: false,
    user,
    where: {
      and: [
        {
          'tenant.domain': {
            equals: params.tenant,
          },
        },
        slugConstraint,
      ],
    },
  })

  const pageData = pageQuery.docs?.[0]

  // The page with the provided slug could not be found
  if (!pageData) {
    return notFound()
  }

  // The page was found, render the page with data
  return <RenderPage data={pageData} />
}
