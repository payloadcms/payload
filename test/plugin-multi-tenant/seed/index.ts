import type { Config } from 'payload'

import { devUser } from '../../credentials.js'
import { menuItemsSlug, menuSlug, tenantsSlug, usersSlug } from '../shared.js'

export const seed: Config['onInit'] = async (payload) => {
  // create tenants
  const blueDogTenant = await payload.create({
    collection: tenantsSlug,
    data: {
      name: 'Blue Dog',
      domain: 'bluedog.com',
    },
  })
  const steelCatTenant = await payload.create({
    collection: tenantsSlug,
    data: {
      name: 'Steel Cat',
      domain: 'steelcat.com',
    },
  })

  // Create blue dog menu items
  await payload.create({
    collection: menuItemsSlug,
    data: {
      name: 'Chorizo Con Queso and Chips',
      tenant: blueDogTenant.id,
    },
  })
  await payload.create({
    collection: menuItemsSlug,
    data: {
      name: 'Garlic Parmesan Tots',
      tenant: blueDogTenant.id,
    },
  })
  await payload.create({
    collection: menuItemsSlug,
    data: {
      name: 'Spicy Mac',
      tenant: blueDogTenant.id,
    },
  })

  // Create steel cat menu items
  await payload.create({
    collection: menuItemsSlug,
    data: {
      name: 'Pretzel Bites',
      tenant: steelCatTenant.id,
    },
  })
  await payload.create({
    collection: menuItemsSlug,
    data: {
      name: 'Buffalo Chicken Dip',
      tenant: steelCatTenant.id,
    },
  })
  await payload.create({
    collection: menuItemsSlug,
    data: {
      name: 'Pulled Pork Nachos',
      tenant: steelCatTenant.id,
    },
  })

  // create users
  await payload.create({
    collection: usersSlug,
    data: {
      email: devUser.email,
      password: devUser.password,
      roles: ['admin'],
    },
  })

  await payload.create({
    collection: usersSlug,
    data: {
      email: 'jane@blue-dog.com',
      password: 'test',
      roles: ['user'],
      tenants: [
        {
          tenant: blueDogTenant.id,
        },
      ],
    },
  })

  // create menus
  await payload.create({
    collection: menuSlug,
    data: {
      description: 'This collection behaves like globals, 1 document per tenant. No list view.',
      title: 'Blue Dog Menu',
      tenant: blueDogTenant.id,
    },
  })
  await payload.create({
    collection: menuSlug,
    data: {
      description: 'This collection behaves like globals, 1 document per tenant. No list view.',
      title: 'Steel Cat Menu',
      tenant: steelCatTenant.id,
    },
  })

  await payload.create({
    collection: usersSlug,
    data: {
      email: 'huel@steel-cat.com',
      password: 'test',
      roles: ['user'],
      tenants: [
        {
          tenant: steelCatTenant.id,
        },
      ],
    },
  })
}
