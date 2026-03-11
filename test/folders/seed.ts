import type { Payload } from 'payload'

import { folderSlug, postSlug } from './shared.js'

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
  // Posts
  // ============================================

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

  // SDK docs
  await payload.create({
    collection: postSlug,
    data: {
      folder: sdkJs.id,
      title: 'JavaScript SDK Reference',
    },
  })

  // Legal
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
  payload.logger.info('  Categories: 14 (Content Type, Audience, Platform hierarchies)')
  payload.logger.info('  Posts: 16 (docs, blog posts, case studies, legal)')
}
