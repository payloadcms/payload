import type { Payload } from 'payload'

import { credentials } from '../credentials.js'
import { foldersSlug, menuItemsSlug, menuSlug, tenantsSlug, usersSlug } from '../shared.js'

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

  // Create folders for Blue Dog
  const blueDogDocumentsFolder = await payload.create({
    collection: foldersSlug,
    data: {
      name: 'Blue Dog Documents',
      tenant: blueDogTenant.id,
    },
  })
  const blueDogArchivesFolder = await payload.create({
    collection: foldersSlug,
    data: {
      name: 'Blue Dog Archives',
      tenant: blueDogTenant.id,
    },
  })
  const blueDogRecipesFolder = await payload.create({
    collection: foldersSlug,
    data: {
      name: 'Blue Dog Recipes',
      folder: blueDogDocumentsFolder.id, // parentFieldName is 'folder' in config
      tenant: blueDogTenant.id,
    },
  })

  // Create folders for Steel Cat
  const steelCatDocumentsFolder = await payload.create({
    collection: foldersSlug,
    data: {
      name: 'Steel Cat Documents',
      tenant: steelCatTenant.id,
    },
  })
  const steelCatArchivesFolder = await payload.create({
    collection: foldersSlug,
    data: {
      name: 'Steel Cat Archives',
      tenant: steelCatTenant.id,
    },
  })

  // Create folders for Anchor Bar
  const anchorBarFilesFolder = await payload.create({
    collection: foldersSlug,
    data: {
      name: 'Anchor Bar Files',
      tenant: anchorBarTenant.id,
    },
  })

  // Create blue dog menu items (some in folders, some at root)
  await payload.create({
    collection: menuItemsSlug,
    data: {
      name: 'Chorizo Con Queso and Chips',
      folder: blueDogRecipesFolder.id,
      tenant: blueDogTenant.id,
    },
  })
  await payload.create({
    collection: menuItemsSlug,
    data: {
      name: 'Garlic Parmesan Tots',
      folder: blueDogRecipesFolder.id,
      tenant: blueDogTenant.id,
    },
  })
  await payload.create({
    collection: menuItemsSlug,
    data: {
      name: 'Spicy Mac',
      folder: blueDogDocumentsFolder.id,
      tenant: blueDogTenant.id,
    },
  })
  // Menu items at root (no folder)
  await payload.create({
    collection: menuItemsSlug,
    data: {
      name: 'Veggie Wrap',
      tenant: blueDogTenant.id,
    },
  })
  await payload.create({
    collection: menuItemsSlug,
    data: {
      name: 'House Salad',
      tenant: blueDogTenant.id,
    },
  })
  await payload.create({
    collection: menuItemsSlug,
    data: {
      name: 'Draft Beer',
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

  // Create steel cat menu items (in folders)
  await payload.create({
    collection: menuItemsSlug,
    data: {
      name: 'Pretzel Bites',
      folder: steelCatDocumentsFolder.id,
      tenant: steelCatTenant.id,
    },
  })
  await payload.create({
    collection: menuItemsSlug,
    data: {
      name: 'Buffalo Chicken Dip',
      folder: steelCatDocumentsFolder.id,
      tenant: steelCatTenant.id,
    },
  })
  await payload.create({
    collection: menuItemsSlug,
    data: {
      name: 'Pulled Pork Nachos',
      folder: steelCatArchivesFolder.id,
      tenant: steelCatTenant.id,
    },
  })

  // Create anchor bar menu items (in folders)
  await payload.create({
    collection: menuItemsSlug,
    data: {
      name: 'Peanuts',
      folder: anchorBarFilesFolder.id,
      tenant: anchorBarTenant.id,
      localizedName: 'Peanuts EN',
    },
    locale: 'en',
  })
  await payload.create({
    collection: menuItemsSlug,
    data: {
      name: 'Pretzels',
      folder: anchorBarFilesFolder.id,
      tenant: anchorBarTenant.id,
      localizedName: 'Pretzels EN',
    },
    locale: 'en',
  })
  await payload.create({
    collection: menuItemsSlug,
    data: {
      name: 'Popcorn',
      folder: anchorBarFilesFolder.id,
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
