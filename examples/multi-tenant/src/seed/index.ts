import type { Payload } from 'payload'

export const seed = async (payload: Payload): Promise<void> => {
  // create super admin
  await payload.create({
    collection: 'users',
    data: {
      email: 'dev@payloadcms.com',
      password: 'test',
      roles: ['super-admin'],
    },
  })

  // create tenants, use `*.localhost.com` so that accidentally forgotten changes the hosts file are acceptable
  const [abc, bbc] = await Promise.all([
    await payload.create({
      collection: 'tenants',
      data: {
        name: 'ABC',
        domains: [{ domain: 'abc.localhost.com:3000' }],
      },
    }),
    await payload.create({
      collection: 'tenants',
      data: {
        name: 'BBC',
        domains: [{ domain: 'bbc.localhost.com:3000' }],
      },
    }),
  ])

  // create tenant-scoped admins and users
  await Promise.all([
    await payload.create({
      collection: 'users',
      data: {
        email: 'admin@abc.com',
        password: 'test',
        roles: ['user'],
        tenants: [
          {
            tenant: abc.id,
            roles: ['admin'],
          },
        ],
      },
    }),
    await payload.create({
      collection: 'users',
      data: {
        email: 'user@abc.com',
        password: 'test',
        roles: ['user'],
        tenants: [
          {
            tenant: abc.id,
            roles: ['user'],
          },
        ],
      },
    }),
    await payload.create({
      collection: 'users',
      data: {
        email: 'admin@bbc.com',
        password: 'test',
        roles: ['user'],
        tenants: [
          {
            tenant: bbc.id,
            roles: ['admin'],
          },
        ],
      },
    }),
    await payload.create({
      collection: 'users',
      data: {
        email: 'user@bbc.com',
        password: 'test',
        roles: ['user'],
        tenants: [
          {
            tenant: bbc.id,
            roles: ['user'],
          },
        ],
      },
    }),
  ])

  // create tenant-scoped pages
  await Promise.all([
    await payload.create({
      collection: 'pages',
      data: {
        tenant: abc.id,
        title: 'ABC Home',
        richText: [
          {
            text: 'Hello, ABC!',
          },
        ],
      },
    }),
    await payload.create({
      collection: 'pages',
      data: {
        title: 'BBC Home',
        tenant: bbc.id,
        richText: [
          {
            text: 'Hello, BBC!',
          },
        ],
      },
    }),
  ])
}
