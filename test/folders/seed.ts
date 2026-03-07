import type { Payload } from 'payload'

import { categoriesSlug, folderSlug, postSlug } from './shared.js'

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
  // Categories (tags)
  // ============================================

  // Content Type
  const contentType = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Content Type' },
  })

  const guide = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Guide', [`_h_${categoriesSlug}`]: contentType.id },
  })

  const tutorial = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Tutorial', [`_h_${categoriesSlug}`]: contentType.id },
  })

  const reference = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Reference', [`_h_${categoriesSlug}`]: contentType.id },
  })

  const announcement = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Announcement', [`_h_${categoriesSlug}`]: contentType.id },
  })

  // Audience
  const audience = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Audience' },
  })

  const developers = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Developers', [`_h_${categoriesSlug}`]: audience.id },
  })

  const productManagers = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Product Managers', [`_h_${categoriesSlug}`]: audience.id },
  })

  const marketers = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Marketers', [`_h_${categoriesSlug}`]: audience.id },
  })

  // Platform
  const platform = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Platform' },
  })

  const web = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Web', [`_h_${categoriesSlug}`]: platform.id },
  })

  const mobile = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Mobile', [`_h_${categoriesSlug}`]: platform.id },
  })

  await payload.create({
    collection: categoriesSlug,
    data: { name: 'iOS', [`_h_${categoriesSlug}`]: mobile.id },
  })

  await payload.create({
    collection: categoriesSlug,
    data: { name: 'Android', [`_h_${categoriesSlug}`]: mobile.id },
  })

  // ============================================
  // Posts
  // ============================================

  // Getting Started docs
  await payload.create({
    collection: postSlug,
    data: {
      folder: gettingStarted.id,
      [`_h_${categoriesSlug}`]: [guide.id, developers.id],
      title: 'Quick Start Guide',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: gettingStarted.id,
      [`_h_${categoriesSlug}`]: [guide.id],
      title: 'Installing Beacon Analytics',
    },
  })

  // SDK docs
  await payload.create({
    collection: postSlug,
    data: {
      folder: sdkJs.id,
      [`_h_${categoriesSlug}`]: [reference.id, developers.id, web.id],
      title: 'JavaScript SDK Reference',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: sdkJs.id,
      [`_h_${categoriesSlug}`]: [tutorial.id, developers.id],
      title: 'Tracking Custom Events',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: sdkIos.id,
      [`_h_${categoriesSlug}`]: [reference.id, developers.id, mobile.id],
      title: 'iOS SDK Reference',
    },
  })

  // Feature docs
  await payload.create({
    collection: postSlug,
    data: {
      folder: funnels.id,
      [`_h_${categoriesSlug}`]: [guide.id, productManagers.id],
      title: 'Building Your First Funnel',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: retention.id,
      [`_h_${categoriesSlug}`]: [guide.id, productManagers.id],
      title: 'Understanding Retention Curves',
    },
  })

  // Blog posts
  await payload.create({
    collection: postSlug,
    data: {
      folder: productUpdates.id,
      [`_h_${categoriesSlug}`]: [announcement.id],
      title: 'Introducing Real-time Dashboards',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: engineering.id,
      [`_h_${categoriesSlug}`]: [developers.id],
      title: 'How We Scaled to 1M Events per Second',
    },
  })

  // Case studies
  await payload.create({
    collection: postSlug,
    data: {
      folder: caseStudies.id,
      [`_h_${categoriesSlug}`]: [marketers.id],
      title: 'How Loom Increased Retention by 40%',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: caseStudies.id,
      [`_h_${categoriesSlug}`]: [productManagers.id],
      title: 'Linear: Data-Driven Product Development',
    },
  })

  // Changelog
  await payload.create({
    collection: postSlug,
    data: {
      folder: changelog.id,
      [`_h_${categoriesSlug}`]: [announcement.id],
      title: 'March 2026 Release Notes',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: changelog.id,
      [`_h_${categoriesSlug}`]: [announcement.id],
      title: 'February 2026 Release Notes',
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
