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

  // The 'domains' field is used to associate a domain with this tenant.
  // Uncomment and set the domain if you want to enable domain-based tenant assignment.

  const tenant1 = await payload.create({
    collection: 'tenants',
    data: {
      name: 'Tenant 1',
      slug: 'tenant-1',
      // domains: [{ domain: 'abc.localhost.com:3000' }],
    },
  })

  const tenant2 = await payload.create({
    collection: 'tenants',
    data: {
      name: 'Tenant 2',
      slug: 'tenant-2',
      // domains: [{ domain: 'bbc.localhost.com:3000' }],
    },
  })

  const tenant3 = await payload.create({
    collection: 'tenants',
    data: {
      name: 'Tenant 3',
      slug: 'tenant-3',
      // domains: [{ domain: 'cbc.localhost.com:3000' }],
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
