import type { MigrateUpArgs } from '@payloadcms/db-mongodb'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.create({
    collection: 'users',
    data: {
      email: 'demo@payloadcms.com',
      password: 'demo',
      roles: ['super-admin'],
    },
  })

  const tenant1 = await payload.create({
    collection: 'tenants',
    data: {
      name: 'Tenant 1',
      slug: 'gold',
      domain: 'gold.localhost.com',
    },
  })

  const tenant2 = await payload.create({
    collection: 'tenants',
    data: {
      name: 'Tenant 2',
      slug: 'silver',
      domain: 'silver.localhost.com',
    },
  })

  const tenant3 = await payload.create({
    collection: 'tenants',
    data: {
      name: 'Tenant 3',
      slug: 'bronze',
      domain: 'bronze.localhost.com',
    },
  })

  await payload.create({
    collection: 'users',
    data: {
      email: 'tenant1@payloadcms.com',
      password: 'test',
      tenants: [
        {
          roles: ['tenant-admin'],
          tenant: tenant1.id,
        },
        // {
        //   roles: ['tenant-admin'],
        //   tenant: tenant2.id,
        // },
      ],
      username: 'tenant1',
    },
  })

  await payload.create({
    collection: 'users',
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
  })

  await payload.create({
    collection: 'users',
    data: {
      email: 'tenant3@payloadcms.com',
      password: 'test',
      tenants: [
        {
          roles: ['tenant-admin'],
          tenant: tenant3.id,
        },
      ],
      username: 'tenant3',
    },
  })

  await payload.create({
    collection: 'users',
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
        {
          roles: ['tenant-admin'],
          tenant: tenant3.id,
        },
      ],
      username: 'tenant3',
    },
  })

  await payload.create({
    collection: 'pages',
    data: {
      slug: 'home',
      tenant: tenant1.id,
      title: 'Page for Tenant 1',
    },
  })

  await payload.create({
    collection: 'pages',
    data: {
      slug: 'home',
      tenant: tenant2.id,
      title: 'Page for Tenant 2',
    },
  })

  await payload.create({
    collection: 'pages',
    data: {
      slug: 'home',
      tenant: tenant3.id,
      title: 'Page for Tenant 3',
    },
  })
}
