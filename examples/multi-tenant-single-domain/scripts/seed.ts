/**
 * This is an example of a standalone script that loads in the Payload config
 * and uses the Payload Local API to query the database.
 */

process.env.PAYLOAD_DROP_DATABASE = 'true'

import type { Payload } from 'payload'

import { getPayload } from 'payload'
import { importConfig } from 'payload/node'

async function findOrCreateTenant({ data, payload }: { data: any; payload: Payload }) {
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

async function findOrCreateUser({ data, payload }: { data: any; payload: Payload }) {
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

async function findOrCreatePage({ data, payload }: { data: any; payload: Payload }) {
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
    data: {
      name: 'Tenant 1',
      slug: 'tenant-1',
    },
    payload,
  })

  const tenant2 = await findOrCreateTenant({
    data: {
      name: 'Tenant 2',
      slug: 'tenant-2',
      public: true,
    },
    payload,
  })

  const tenant3 = await findOrCreateTenant({
    data: {
      name: 'Tenant 3',
      slug: 'tenant-3',
    },
    payload,
  })

  await findOrCreateUser({
    data: {
      email: 'demo@payloadcms.com',
      password: 'demo',
      roles: ['super-admin'],
    },
    payload,
  })

  await findOrCreateUser({
    data: {
      email: 'tenant1@payloadcms.com',
      password: 'test',
      tenants: [
        {
          roles: ['tenant-admin'],
          tenant: tenant1.id,
        },
      ],
      username: 'tenant1',
    },
    payload,
  })

  await findOrCreateUser({
    data: {
      email: 'tenant2@payloadcms.com',
      password: 'test',
      tenants: [
        {
          roles: ['tenant-admin'],
          tenant: tenant2.id,
        },
      ],
      username: 'tenant2',
    },
    payload,
  })

  await findOrCreateUser({
    data: {
      email: 'multi-admin@payloadcms.com',
      password: 'test',
      tenants: [
        {
          roles: ['tenant-admin'],
          tenant: tenant1.id,
        },
        {
          roles: ['tenant-admin'],
          tenant: tenant2.id,
        },
      ],
      username: 'tenant3',
    },
    payload,
  })

  await findOrCreatePage({
    data: {
      slug: 'home',
      tenant: tenant1.id,
      title: 'Page for Tenant 1',
    },
    payload,
  })

  await findOrCreatePage({
    data: {
      slug: 'home',
      tenant: tenant2.id,
      title: 'Page for Tenant 2',
    },
    payload,
  })

  await findOrCreatePage({
    data: {
      slug: 'home',
      tenant: tenant3.id,
      title: 'Page for Tenant 3',
    },
    payload,
  })

  process.exit(0)
}

run().catch(console.error)
