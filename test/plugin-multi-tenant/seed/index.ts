import type { Config } from 'payload'

import { credentials } from '../credentials.js'
import { menuItemsSlug, menuSlug, tenantsSlug, usersSlug } from '../shared.js'

export const seed: Config['onInit'] = async (payload) => {
  // create users
  await payload.create({
    collection: usersSlug,
    data: {
      ...credentials.admin,
      roles: ['admin'],
    },
  })

  const blueDogUser = await payload.create({
    collection: usersSlug,
    data: {
      ...credentials.blueDog,
      roles: ['user'],
    },
  })

  const blueDogAndAnchorUser = await payload.create({
    collection: usersSlug,
    data: {
      ...credentials.owner,
      roles: ['user'],
    },
  })

  const steelCatUser = await payload.create({
    collection: usersSlug,
    data: {
      ...credentials.steelCat,
      roles: ['user'],
    },
  })

  // create tenants
  const blueDogTenant = await payload.create({
    collection: tenantsSlug,
    data: {
      name: 'Blue Dog',
      domain: 'bluedog.com',
      assignedUsers: [
        {
          user: blueDogUser.id,
        },
        {
          user: blueDogAndAnchorUser.id,
        },
      ],
    },
  })
  const steelCatTenant = await payload.create({
    collection: tenantsSlug,
    data: {
      name: 'Steel Cat',
      domain: 'steelcat.com',
      assignedUsers: [
        {
          user: steelCatUser.id,
        },
      ],
    },
  })
  const anchorBarTenant = await payload.create({
    collection: tenantsSlug,
    data: {
      name: 'Anchor Bar',
      domain: 'anchorbar.com',
      assignedUsers: [
        {
          user: blueDogAndAnchorUser.id,
        },
      ],
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
}
