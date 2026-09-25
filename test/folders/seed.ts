import type { Payload } from 'payload'

import path from 'path'
import { getFileByPath } from 'payload'
import { fileURLToPath } from 'url'

import { folderSlug, postSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const seed = async (payload: Payload): Promise<void> => {
  // ============================================
  // Beacon Analytics - SaaS Content Structure
  // ============================================

  // Root: Documentation
  const documentation = await payload.create({
    collection: folderSlug,
    data: { name: 'Documentation', folderType: ['posts'] },
    overrideAccess: true,
  })

  // Documentation > Getting Started
  const gettingStarted = await payload.create({
    collection: folderSlug,
    data: { name: 'Getting Started', folder: documentation.id, folderType: ['posts'] },
    overrideAccess: true,
  })

  // Documentation > SDKs (container)
  const sdks = await payload.create({
    collection: folderSlug,
    data: { name: 'SDKs', folder: documentation.id, folderType: ['posts'] },
    overrideAccess: true,
  })

  // Documentation > SDKs > JavaScript
  const sdkJs = await payload.create({
    collection: folderSlug,
    data: { name: 'JavaScript', folder: sdks.id, folderType: ['posts'] },
    overrideAccess: true,
  })

  // Documentation > SDKs > iOS
  const sdkIos = await payload.create({
    collection: folderSlug,
    data: { name: 'iOS', folder: sdks.id, folderType: ['posts'] },
    overrideAccess: true,
  })

  // Documentation > SDKs > Python
  await payload.create({
    collection: folderSlug,
    data: { name: 'Python', folder: sdks.id, folderType: ['posts'] },
    overrideAccess: true,
  })

  // Documentation > SDKs > React Native
  await payload.create({
    collection: folderSlug,
    data: { name: 'React Native', folder: sdks.id, folderType: ['posts'] },
    overrideAccess: true,
  })

  // Documentation > Features (container)
  const features = await payload.create({
    collection: folderSlug,
    data: { name: 'Features', folder: documentation.id, folderType: ['posts'] },
    overrideAccess: true,
  })

  // Documentation > Features > Funnels
  const funnels = await payload.create({
    collection: folderSlug,
    data: { name: 'Funnels', folder: features.id, folderType: ['posts'] },
    overrideAccess: true,
  })

  // Documentation > Features > Cohorts
  await payload.create({
    collection: folderSlug,
    data: { name: 'Cohorts', folder: features.id, folderType: ['posts'] },
    overrideAccess: true,
  })

  // Documentation > Features > Retention
  const retention = await payload.create({
    collection: folderSlug,
    data: { name: 'Retention', folder: features.id, folderType: ['posts', 'media'] },
    overrideAccess: true,
  })

  // Documentation > Features > Dashboards
  await payload.create({
    collection: folderSlug,
    data: { name: 'Dashboards', folder: features.id, folderType: ['posts', 'media'] },
    overrideAccess: true,
  })

  // Root: Marketing
  const marketing = await payload.create({
    collection: folderSlug,
    data: { name: 'Marketing', folderType: ['posts', 'media'] },
    overrideAccess: true,
  })

  // Marketing > Blog (container)
  const blog = await payload.create({
    collection: folderSlug,
    data: { name: 'Blog', folder: marketing.id, folderType: ['posts'] },
    overrideAccess: true,
  })

  // Marketing > Blog > Product Updates
  const productUpdates = await payload.create({
    collection: folderSlug,
    data: { name: 'Product Updates', folder: blog.id, folderType: ['posts'] },
    overrideAccess: true,
  })

  // Marketing > Blog > Engineering
  const engineering = await payload.create({
    collection: folderSlug,
    data: { name: 'Engineering', folder: blog.id, folderType: ['posts'] },
    overrideAccess: true,
  })

  // Marketing > Blog > Customer Stories
  await payload.create({
    collection: folderSlug,
    data: { name: 'Customer Stories', folder: blog.id, folderType: ['posts'] },
    overrideAccess: true,
  })

  // Marketing > Landing Pages
  await payload.create({
    collection: folderSlug,
    data: { name: 'Landing Pages', folder: marketing.id, folderType: ['posts', 'media'] },
    overrideAccess: true,
  })

  // Marketing > Case Studies
  const caseStudies = await payload.create({
    collection: folderSlug,
    data: { name: 'Case Studies', folder: marketing.id, folderType: ['posts', 'media'] },
    overrideAccess: true,
  })

  // Marketing > Brand Assets (media only)
  const brandAssets = await payload.create({
    collection: folderSlug,
    data: { name: 'Brand Assets', folder: marketing.id, folderType: ['media'] },
    overrideAccess: true,
  })

  // Root: Product
  const product = await payload.create({
    collection: folderSlug,
    data: { name: 'Product', folderType: ['posts'] },
    overrideAccess: true,
  })

  // Product > Changelog
  const changelog = await payload.create({
    collection: folderSlug,
    data: { name: 'Changelog', folder: product.id, folderType: ['posts'] },
    overrideAccess: true,
  })

  // Product > Roadmap
  await payload.create({
    collection: folderSlug,
    data: { name: 'Roadmap', folder: product.id, folderType: ['posts'] },
    overrideAccess: true,
  })

  // Root: Legal
  const legal = await payload.create({
    collection: folderSlug,
    data: { name: 'Legal', folderType: ['posts'] },
    overrideAccess: true,
  })

  // Legal > Privacy
  const privacy = await payload.create({
    collection: folderSlug,
    data: { name: 'Privacy', folder: legal.id, folderType: ['posts'] },
    overrideAccess: true,
  })

  // Legal > Terms
  const terms = await payload.create({
    collection: folderSlug,
    data: { name: 'Terms', folder: legal.id, folderType: ['posts'] },
    overrideAccess: true,
  })

  // Root: Shared (no folderType restriction - for testing)
  const shared = await payload.create({
    collection: folderSlug,
    data: { name: 'Shared' },
    overrideAccess: true,
  })

  // ============================================
  // Posts - ensure every folder has at least 1 document
  // ============================================

  // Documentation (root)
  await payload.create({
    collection: postSlug,
    data: {
      folder: documentation.id,
      title: 'Documentation Overview',
    },
    overrideAccess: true,
  })

  // Getting Started docs
  await payload.create({
    collection: postSlug,
    data: {
      folder: gettingStarted.id,
      title: 'Quick Start Guide',
    },
    overrideAccess: true,
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: gettingStarted.id,
      title: 'Installing Beacon Analytics',
    },
    overrideAccess: true,
  })

  // SDKs (container)
  await payload.create({
    collection: postSlug,
    data: {
      folder: sdks.id,
      title: 'SDK Comparison Guide',
    },
    overrideAccess: true,
  })

  // SDK docs
  await payload.create({
    collection: postSlug,
    data: {
      folder: sdkJs.id,
      title: 'JavaScript SDK Reference',
    },
    overrideAccess: true,
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: sdkIos.id,
      title: 'iOS SDK Reference',
    },
    overrideAccess: true,
  })

  // Note: Python and React Native SDKs don't have stored refs, create inline
  const pythonSdk = (
    await payload.find({
      collection: folderSlug,
      limit: 1,
      where: { name: { equals: 'Python' } },
      overrideAccess: true,
    })
  ).docs[0]

  if (pythonSdk) {
    await payload.create({
      collection: postSlug,
      data: {
        folder: pythonSdk.id,
        title: 'Python SDK Reference',
      },
      overrideAccess: true,
    })
  }

  const reactNativeSdk = (
    await payload.find({
      collection: folderSlug,
      limit: 1,
      where: { name: { equals: 'React Native' } },
      overrideAccess: true,
    })
  ).docs[0]

  if (reactNativeSdk) {
    await payload.create({
      collection: postSlug,
      data: {
        folder: reactNativeSdk.id,
        title: 'React Native SDK Reference',
      },
      overrideAccess: true,
    })
  }

  // Features (container)
  await payload.create({
    collection: postSlug,
    data: {
      folder: features.id,
      title: 'Features Overview',
    },
    overrideAccess: true,
  })

  // Feature sub-folders
  await payload.create({
    collection: postSlug,
    data: {
      folder: funnels.id,
      title: 'Building Your First Funnel',
    },
    overrideAccess: true,
  })

  // Cohorts folder
  const cohorts = (
    await payload.find({
      collection: folderSlug,
      limit: 1,
      where: { name: { equals: 'Cohorts' } },
      overrideAccess: true,
    })
  ).docs[0]

  if (cohorts) {
    await payload.create({
      collection: postSlug,
      data: {
        folder: cohorts.id,
        title: 'Understanding Cohort Analysis',
      },
      overrideAccess: true,
    })
  }

  await payload.create({
    collection: postSlug,
    data: {
      folder: retention.id,
      title: 'Retention Metrics Guide',
    },
    overrideAccess: true,
  })

  // Dashboards folder
  const dashboards = (
    await payload.find({
      collection: folderSlug,
      limit: 1,
      where: { name: { equals: 'Dashboards' } },
      overrideAccess: true,
    })
  ).docs[0]

  if (dashboards) {
    await payload.create({
      collection: postSlug,
      data: {
        folder: dashboards.id,
        title: 'Creating Custom Dashboards',
      },
      overrideAccess: true,
    })
  }

  // Marketing (root)
  await payload.create({
    collection: postSlug,
    data: {
      folder: marketing.id,
      title: 'Marketing Resources Hub',
    },
    overrideAccess: true,
  })

  // Blog (container)
  await payload.create({
    collection: postSlug,
    data: {
      folder: blog.id,
      title: 'Blog Editorial Guidelines',
    },
    overrideAccess: true,
  })

  // Blog sub-folders
  await payload.create({
    collection: postSlug,
    data: {
      folder: productUpdates.id,
      title: 'March 2024 Product Update',
    },
    overrideAccess: true,
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: engineering.id,
      title: 'How We Built Real-Time Analytics',
    },
    overrideAccess: true,
  })

  // Customer Stories folder
  const customerStories = (
    await payload.find({
      collection: folderSlug,
      limit: 1,
      where: { name: { equals: 'Customer Stories' } },
      overrideAccess: true,
    })
  ).docs[0]

  if (customerStories) {
    await payload.create({
      collection: postSlug,
      data: {
        folder: customerStories.id,
        title: 'How Acme Corp Increased Retention by 40%',
      },
      overrideAccess: true,
    })
  }

  // Landing Pages folder
  const landingPages = (
    await payload.find({
      collection: folderSlug,
      limit: 1,
      where: { name: { equals: 'Landing Pages' } },
      overrideAccess: true,
    })
  ).docs[0]

  if (landingPages) {
    await payload.create({
      collection: postSlug,
      data: {
        folder: landingPages.id,
        title: 'Enterprise Landing Page Copy',
      },
      overrideAccess: true,
    })
  }

  // Case Studies
  await payload.create({
    collection: postSlug,
    data: {
      folder: caseStudies.id,
      title: 'TechStart Case Study',
    },
    overrideAccess: true,
  })

  // Brand Assets (media only) - add media
  const imageFilePath = path.resolve(dirname, './seed/image.png')
  const imageFile = await getFileByPath(imageFilePath)

  await payload.create({
    collection: 'media',
    data: {
      folder: brandAssets.id,
    },
    file: imageFile,
    overrideAccess: true,
  })

  // Product (root)
  await payload.create({
    collection: postSlug,
    data: {
      folder: product.id,
      title: 'Product Team Updates',
    },
    overrideAccess: true,
  })

  // Changelog
  await payload.create({
    collection: postSlug,
    data: {
      folder: changelog.id,
      title: 'v2.5.0 Release Notes',
    },
    overrideAccess: true,
  })

  // Roadmap folder
  const roadmap = (
    await payload.find({
      collection: folderSlug,
      limit: 1,
      where: { name: { equals: 'Roadmap' } },
      overrideAccess: true,
    })
  ).docs[0]

  if (roadmap) {
    await payload.create({
      collection: postSlug,
      data: {
        folder: roadmap.id,
        title: 'Q2 2024 Roadmap',
      },
      overrideAccess: true,
    })
  }

  // Legal (root)
  await payload.create({
    collection: postSlug,
    data: {
      folder: legal.id,
      title: 'Legal Overview',
    },
    overrideAccess: true,
  })

  // Legal sub-folders
  await payload.create({
    collection: postSlug,
    data: {
      folder: privacy.id,
      title: 'Privacy Policy',
    },
    overrideAccess: true,
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: terms.id,
      title: 'Terms of Service',
    },
    overrideAccess: true,
  })

  // Shared (no folder restriction)
  await payload.create({
    collection: postSlug,
    data: {
      folder: shared.id,
      title: 'Internal: Content Style Guide',
    },
    overrideAccess: true,
  })

  payload.logger.info('Beacon Analytics seed data created:')
  payload.logger.info('  Folders: 24 (Documentation, Marketing, Product, Legal, Shared)')
  payload.logger.info('  Posts: ~30 (every folder has at least 1 document)')
  payload.logger.info('  Media: 1 (Brand Assets)')
}
