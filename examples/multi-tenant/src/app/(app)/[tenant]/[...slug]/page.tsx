import type { Where } from 'payload'

import configPromise from '@payload-config'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import { headers as getHeaders } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import React from 'react'

import { RenderPage } from '../../../components/RenderPage'

export default async function Page({ params }: { params: { slug?: string[]; tenant: string } }) {
  const headers = await getHeaders()
  const payload = await getPayloadHMR({ config: configPromise })
  const { user } = await payload.auth({ headers })

  const tenantsQuery = await payload.find({
    collection: 'tenants',
    overrideAccess: false,
    user,
    where: {
      slug: {
        equals: params.tenant,
      },
    },
  })

  const slug = params?.slug

  // If no tenant is found, the user does not have access
  // Show the login view
  if (tenantsQuery.docs.length === 0) {
    redirect(
      `/${params.tenant}/login?redirect=${encodeURIComponent(
        `/${params.tenant}${slug ? `/${slug.join('/')}` : ''}`,
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
          'tenant.slug': {
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
