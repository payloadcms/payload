import type { Payload } from 'payload'

import { credentials } from '@tools/test-utils/shared'
import { menuItemsSlug, menuSlug, tenantsSlug, usersSlug } from '../shared.js'

export const seed = async (payload: Payload) => {
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
  const anchorBarTenant = await payload.create({
    collection: tenantsSlug,
    data: {
      name: 'Anchor Bar',
      domain: 'anchorbar.com',
      selectedLocales: ['en'],
    },
  })
  const publicTenant = await payload.create({
    collection: tenantsSlug,
    data: {
      name: 'Public Tenant',
      domain: 'public.com',
      isPublic: true,
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

  await payload.create({
    collection: 'relationships',
    data: {
      title: 'Owned by blue dog',
      tenant: blueDogTenant.id,
    },
  })

  await payload.create({
    collection: 'relationships',
    data: {
      title: 'Owned by steelcat',
      tenant: steelCatTenant.id,
    },
  })

  await payload.create({
    collection: 'relationships',
    data: {
      title: 'Owned by bar with no ac',
      tenant: anchorBarTenant.id,
    },
  })

  await payload.create({
    collection: 'relationships',
    data: {
      title: 'Owned by public tenant',
      tenant: publicTenant.id,
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

  // Create anchor bar menu items
  await payload.create({
    collection: menuItemsSlug,
    data: {
      name: 'Peanuts',
      tenant: anchorBarTenant.id,
      localizedName: 'Peanuts EN',
    },
    locale: 'en',
  })
  await payload.create({
    collection: menuItemsSlug,
    data: {
      name: 'Pretzels',
      tenant: anchorBarTenant.id,
      localizedName: 'Pretzels EN',
    },
    locale: 'en',
  })
  await payload.create({
    collection: menuItemsSlug,
    data: {
      name: 'Popcorn',
      tenant: anchorBarTenant.id,
      localizedName: 'Popcorn EN',
    },
    locale: 'en',
  })

  // Public tenant menu items
  await payload.create({
    collection: menuItemsSlug,
    data: {
      name: 'Free Pizza',
      tenant: publicTenant.id,
    },
  })
  await payload.create({
    collection: menuItemsSlug,
    data: {
      name: 'Free Dogs',
      tenant: publicTenant.id,
    },
  })

  // create users
  await payload.create({
    collection: usersSlug,
    data: {
      ...credentials.admin,
      roles: ['admin'],
    },
  })

  await payload.create({
    collection: usersSlug,
    data: {
      ...credentials.blueDog,
      roles: ['user'],
      tenants: [
        {
          tenant: blueDogTenant.id,
        },
      ],
    },
  })

  await payload.create({
    collection: usersSlug,
    data: {
      ...credentials.owner,
      roles: ['user'],
      tenants: [
        {
          tenant: anchorBarTenant.id,
        },
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
      ...credentials.steelCat,
      roles: ['user'],
      tenants: [
        {
          tenant: steelCatTenant.id,
        },
      ],
    },
  })
}
