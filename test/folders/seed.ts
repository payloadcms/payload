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
  })

  // Documentation > Getting Started
  const gettingStarted = await payload.create({
    collection: folderSlug,
    data: { name: 'Getting Started', folder: documentation.id, folderType: ['posts'] },
  })

  // Documentation > SDKs (container)
  const sdks = await payload.create({
    collection: folderSlug,
    data: { name: 'SDKs', folder: documentation.id, folderType: ['posts'] },
  })

  // Documentation > SDKs > JavaScript
  const sdkJs = await payload.create({
    collection: folderSlug,
    data: { name: 'JavaScript', folder: sdks.id, folderType: ['posts'] },
  })

  // Documentation > SDKs > iOS
  const sdkIos = await payload.create({
    collection: folderSlug,
    data: { name: 'iOS', folder: sdks.id, folderType: ['posts'] },
  })

  // Documentation > SDKs > Python
  await payload.create({
    collection: folderSlug,
    data: { name: 'Python', folder: sdks.id, folderType: ['posts'] },
  })

  // Documentation > SDKs > React Native
  await payload.create({
    collection: folderSlug,
    data: { name: 'React Native', folder: sdks.id, folderType: ['posts'] },
  })

  // Documentation > Features (container)
  const features = await payload.create({
    collection: folderSlug,
    data: { name: 'Features', folder: documentation.id, folderType: ['posts'] },
  })

  // Documentation > Features > Funnels
  const funnels = await payload.create({
    collection: folderSlug,
    data: { name: 'Funnels', folder: features.id, folderType: ['posts'] },
  })

  // Documentation > Features > Cohorts
  await payload.create({
    collection: folderSlug,
    data: { name: 'Cohorts', folder: features.id, folderType: ['posts'] },
  })

  // Documentation > Features > Retention
  const retention = await payload.create({
    collection: folderSlug,
    data: { name: 'Retention', folder: features.id, folderType: ['posts', 'media'] },
  })

  // Documentation > Features > Dashboards
  await payload.create({
    collection: folderSlug,
    data: { name: 'Dashboards', folder: features.id, folderType: ['posts', 'media'] },
  })

  // Root: Marketing
  const marketing = await payload.create({
    collection: folderSlug,
    data: { name: 'Marketing', folderType: ['posts', 'media'] },
  })

  // Marketing > Blog (container)
  const blog = await payload.create({
    collection: folderSlug,
    data: { name: 'Blog', folder: marketing.id, folderType: ['posts'] },
  })

  // Marketing > Blog > Product Updates
  const productUpdates = await payload.create({
    collection: folderSlug,
    data: { name: 'Product Updates', folder: blog.id, folderType: ['posts'] },
  })

  // Marketing > Blog > Engineering
  const engineering = await payload.create({
    collection: folderSlug,
    data: { name: 'Engineering', folder: blog.id, folderType: ['posts'] },
  })

  // Marketing > Blog > Customer Stories
  await payload.create({
    collection: folderSlug,
    data: { name: 'Customer Stories', folder: blog.id, folderType: ['posts'] },
  })

  // Marketing > Landing Pages
  await payload.create({
    collection: folderSlug,
    data: { name: 'Landing Pages', folder: marketing.id, folderType: ['posts', 'media'] },
  })

  // Marketing > Case Studies
  const caseStudies = await payload.create({
    collection: folderSlug,
    data: { name: 'Case Studies', folder: marketing.id, folderType: ['posts', 'media'] },
  })

  // Marketing > Brand Assets (media only)
  const brandAssets = await payload.create({
    collection: folderSlug,
    data: { name: 'Brand Assets', folder: marketing.id, folderType: ['media'] },
  })

  // Root: Product
  const product = await payload.create({
    collection: folderSlug,
    data: { name: 'Product', folderType: ['posts'] },
  })

  // Product > Changelog
  const changelog = await payload.create({
    collection: folderSlug,
    data: { name: 'Changelog', folder: product.id, folderType: ['posts'] },
  })

  // Product > Roadmap
  await payload.create({
    collection: folderSlug,
    data: { name: 'Roadmap', folder: product.id, folderType: ['posts'] },
  })

  // Root: Legal
  const legal = await payload.create({
    collection: folderSlug,
    data: { name: 'Legal', folderType: ['posts'] },
  })

  // Legal > Privacy
  const privacy = await payload.create({
    collection: folderSlug,
    data: { name: 'Privacy', folder: legal.id, folderType: ['posts'] },
  })

  // Legal > Terms
  const terms = await payload.create({
    collection: folderSlug,
    data: { name: 'Terms', folder: legal.id, folderType: ['posts'] },
  })

  // Root: Shared (no folderType restriction - for testing)
  const shared = await payload.create({
    collection: folderSlug,
    data: { name: 'Shared' },
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
  })

  // Getting Started docs
  await payload.create({
    collection: postSlug,
    data: {
      folder: gettingStarted.id,
      title: 'Quick Start Guide',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: gettingStarted.id,
      title: 'Installing Beacon Analytics',
    },
  })

  // SDKs (container)
  await payload.create({
    collection: postSlug,
    data: {
      folder: sdks.id,
      title: 'SDK Comparison Guide',
    },
  })

  // SDK docs
  await payload.create({
    collection: postSlug,
    data: {
      folder: sdkJs.id,
      title: 'JavaScript SDK Reference',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: sdkIos.id,
      title: 'iOS SDK Reference',
    },
  })

  // Note: Python and React Native SDKs don't have stored refs, create inline
  const pythonSdk = (
    await payload.find({
      collection: folderSlug,
      limit: 1,
      where: { name: { equals: 'Python' } },
    })
  ).docs[0]

  if (pythonSdk) {
    await payload.create({
      collection: postSlug,
      data: {
        folder: pythonSdk.id,
        title: 'Python SDK Reference',
      },
    })
  }

  const reactNativeSdk = (
    await payload.find({
      collection: folderSlug,
      limit: 1,
      where: { name: { equals: 'React Native' } },
    })
  ).docs[0]

  if (reactNativeSdk) {
    await payload.create({
      collection: postSlug,
      data: {
        folder: reactNativeSdk.id,
        title: 'React Native SDK Reference',
      },
    })
  }

  // Features (container)
  await payload.create({
    collection: postSlug,
    data: {
      folder: features.id,
      title: 'Features Overview',
    },
  })

  // Feature sub-folders
  await payload.create({
    collection: postSlug,
    data: {
      folder: funnels.id,
      title: 'Building Your First Funnel',
    },
  })

  // Cohorts folder
  const cohorts = (
    await payload.find({
      collection: folderSlug,
      limit: 1,
      where: { name: { equals: 'Cohorts' } },
    })
  ).docs[0]

  if (cohorts) {
    await payload.create({
      collection: postSlug,
      data: {
        folder: cohorts.id,
        title: 'Understanding Cohort Analysis',
      },
    })
  }

  await payload.create({
    collection: postSlug,
    data: {
      folder: retention.id,
      title: 'Retention Metrics Guide',
    },
  })

  // Dashboards folder
  const dashboards = (
    await payload.find({
      collection: folderSlug,
      limit: 1,
      where: { name: { equals: 'Dashboards' } },
    })
  ).docs[0]

  if (dashboards) {
    await payload.create({
      collection: postSlug,
      data: {
        folder: dashboards.id,
        title: 'Creating Custom Dashboards',
      },
    })
  }

  // Marketing (root)
  await payload.create({
    collection: postSlug,
    data: {
      folder: marketing.id,
      title: 'Marketing Resources Hub',
    },
  })

  // Blog (container)
  await payload.create({
    collection: postSlug,
    data: {
      folder: blog.id,
      title: 'Blog Editorial Guidelines',
    },
  })

  // Blog sub-folders
  await payload.create({
    collection: postSlug,
    data: {
      folder: productUpdates.id,
      title: 'March 2024 Product Update',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: engineering.id,
      title: 'How We Built Real-Time Analytics',
    },
  })

  // Customer Stories folder
  const customerStories = (
    await payload.find({
      collection: folderSlug,
      limit: 1,
      where: { name: { equals: 'Customer Stories' } },
    })
  ).docs[0]

  if (customerStories) {
    await payload.create({
      collection: postSlug,
      data: {
        folder: customerStories.id,
        title: 'How Acme Corp Increased Retention by 40%',
      },
    })
  }

  // Landing Pages folder
  const landingPages = (
    await payload.find({
      collection: folderSlug,
      limit: 1,
      where: { name: { equals: 'Landing Pages' } },
    })
  ).docs[0]

  if (landingPages) {
    await payload.create({
      collection: postSlug,
      data: {
        folder: landingPages.id,
        title: 'Enterprise Landing Page Copy',
      },
    })
  }

  // Case Studies
  await payload.create({
    collection: postSlug,
    data: {
      folder: caseStudies.id,
      title: 'TechStart Case Study',
    },
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
  })

  // Product (root)
  await payload.create({
    collection: postSlug,
    data: {
      folder: product.id,
      title: 'Product Team Updates',
    },
  })

  // Changelog
  await payload.create({
    collection: postSlug,
    data: {
      folder: changelog.id,
      title: 'v2.5.0 Release Notes',
    },
  })

  // Roadmap folder
  const roadmap = (
    await payload.find({
      collection: folderSlug,
      limit: 1,
      where: { name: { equals: 'Roadmap' } },
    })
  ).docs[0]

  if (roadmap) {
    await payload.create({
      collection: postSlug,
      data: {
        folder: roadmap.id,
        title: 'Q2 2024 Roadmap',
      },
    })
  }

  // Legal (root)
  await payload.create({
    collection: postSlug,
    data: {
      folder: legal.id,
      title: 'Legal Overview',
    },
  })

  // Legal sub-folders
  await payload.create({
    collection: postSlug,
    data: {
      folder: privacy.id,
      title: 'Privacy Policy',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: terms.id,
      title: 'Terms of Service',
    },
  })

  // Shared (no folder restriction)
  await payload.create({
    collection: postSlug,
    data: {
      folder: shared.id,
      title: 'Internal: Content Style Guide',
    },
  })

  payload.logger.info('Beacon Analytics seed data created:')
  payload.logger.info('  Folders: 24 (Documentation, Marketing, Product, Legal, Shared)')
  payload.logger.info('  Posts: ~30 (every folder has at least 1 document)')
  payload.logger.info('  Media: 1 (Brand Assets)')
}
