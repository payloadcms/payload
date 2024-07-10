/**
 * This is an example of a standalone script that loads in the Payload config
 * and uses the Payload Local API to query the database.
 */

import { getPayload } from 'payload'
import { importConfig } from 'payload/node'

async function findOrCreateTenant({ payload, data }) {
  const tenantsQuery = await payload.find({
    collection: 'tenants',
    where: {
      slug: {
        equals: data.slug,
      },
    },
  })

  if (tenantsQuery.docs?.[0]) return tenantsQuery.docs[0]

  return payload.create({
    collection: 'tenants',
    data,
  })
}

async function findOrCreateUser({ payload, data }) {
  const usersQuery = await payload.find({
    collection: 'users',
    where: {
      email: {
        equals: data.email,
      },
    },
  })

  if (usersQuery.docs?.[0]) return usersQuery.docs[0]

  return payload.create({
    collection: 'users',
    data,
  })
}

async function findOrCreatePage({ payload, data }) {
  const pagesQuery = await payload.find({
    collection: 'pages',
    where: {
      slug: {
        equals: data.slug,
      },
    },
  })

  if (pagesQuery.docs?.[0]) return pagesQuery.docs[0]

  return payload.create({
    collection: 'pages',
    data,
  })
}

async function run() {
  const awaitedConfig = await importConfig('../src/payload.config.ts')
  const payload = await getPayload({ config: awaitedConfig })

  const tenant1 = await findOrCreateTenant({
    payload,
    data: {
      name: 'Tenant 1',
      slug: 'tenant-1',
    },
  })

  const tenant2 = await findOrCreateTenant({
    payload,
    data: {
      name: 'Tenant 2',
      slug: 'tenant-2',
      public: true,
    },
  })

  const tenant3 = await findOrCreateTenant({
    payload,
    data: {
      name: 'Tenant 3',
      slug: 'tenant-3',
    },
  })

  const superAdmin = await findOrCreateUser({
    payload,
    data: {
      email: 'demo@payloadcms.com',
      password: 'demo',
      roles: ['super-admin'],
    },
  })

  const tenantAdmin1 = await findOrCreateUser({
    payload,
    data: {
      email: 'tenant1@payloadcms.com',
      password: 'test',
      tenants: [
        {
          tenant: tenant1.id,
          roles: ['super-admin'],
        },
      ],
      username: 'tenant1',
    },
  })

  const tenantAdmin2 = await findOrCreateUser({
    payload,
    data: {
      email: 'tenant2@payloadcms.com',
      password: 'test',
      tenants: [
        {
          tenant: tenant2.id,
          roles: ['super-admin'],
        },
      ],
      username: 'tenant2',
    },
  })

  const multiAdmin = await findOrCreateUser({
    payload,
    data: {
      email: 'multi-admin@payloadcms.com',
      password: 'test',
      tenants: [
        {
          tenant: tenant1.id,
          roles: ['super-admin'],
        },
        {
          tenant: tenant2.id,
          roles: ['super-admin'],
        },
      ],
      username: 'tenant3',
    },
  })

  const page1 = await findOrCreatePage({
    payload,
    data: {
      title: 'Page for Tenant 1',
      tenant: tenant1.id,
      slug: 'home',
    },
  })

  const page2 = await findOrCreatePage({
    payload,
    data: {
      title: 'Page for Tenant 2',
      tenant: tenant2.id,
      slug: 'home',
    },
  })

  const page3 = await findOrCreatePage({
    payload,
    data: {
      title: 'Page for Tenant 3',
      tenant: tenant3.id,
      slug: 'home',
    },
  })

  process.exit(0)
}

run().catch(console.error)
