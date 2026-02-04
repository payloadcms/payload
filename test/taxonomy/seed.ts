import type { Payload } from 'payload'

import { categoriesSlug, mediaSlug, pagesSlug, postsSlug, tagsSlug } from './config.js'

export const seed = async (payload: Payload): Promise<void> => {
  // Create hierarchical tags taxonomy
  const technology = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'Technology',
      description: 'All things tech',
    } as any,
  })

  const programming = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'Programming',
      description: 'Programming languages and tools',
      parent: technology.id,
    } as any,
  })

  const javascript = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'JavaScript',
      description: 'JavaScript ecosystem',
      parent: programming.id,
    } as any,
  })

  const react = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'React',
      description: 'React framework',
      parent: javascript.id,
    } as any,
  })

  const typescript = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'TypeScript',
      description: 'TypeScript language',
      parent: programming.id,
    } as any,
  })

  const python = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'Python',
      description: 'Python programming',
      parent: programming.id,
    } as any,
  })

  const design = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'Design',
      description: 'Design and UX',
    } as any,
  })

  const uiux = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'UI/UX',
      description: 'User interface and experience',
      parent: design.id,
    } as any,
  })

  const webdesign = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'Web Design',
      description: 'Website design',
      parent: design.id,
    } as any,
  })

  // Create hierarchical categories taxonomy
  const articles = await payload.create({
    collection: categoriesSlug as any,
    data: {
      name: 'Articles',
    } as any,
  })

  const tutorials = await payload.create({
    collection: categoriesSlug as any,
    data: {
      name: 'Tutorials',
      parentCategory: articles.id,
    } as any,
  })

  const guides = await payload.create({
    collection: categoriesSlug as any,
    data: {
      name: 'Guides',
      parentCategory: articles.id,
    } as any,
  })

  // Create posts with tags
  await payload.create({
    collection: postsSlug as any,
    data: {
      content: 'Learn the basics of React development',
      tags: [react.id, javascript.id, programming.id],
      title: 'Getting Started with React',
    } as any,
  })

  await payload.create({
    collection: postsSlug as any,
    data: {
      content: 'Best practices for TypeScript development',
      tags: [typescript.id, programming.id],
      title: 'TypeScript Best Practices',
    } as any,
  })

  await payload.create({
    collection: postsSlug as any,
    data: {
      content: 'Understanding React hooks',
      tags: [react.id, javascript.id],
      title: 'React Hooks Deep Dive',
    } as any,
  })

  await payload.create({
    collection: postsSlug as any,
    data: {
      content: 'Using Python for data analysis',
      tags: [python.id, programming.id],
      title: 'Python for Data Science',
    } as any,
  })

  await payload.create({
    collection: postsSlug as any,
    data: {
      content: 'Key principles of modern web design',
      tags: [webdesign.id, design.id],
      title: 'Modern Web Design Principles',
    } as any,
  })

  // Create pages with tags
  await payload.create({
    collection: pagesSlug as any,
    data: {
      content: 'Comprehensive React documentation and guides',
      tags: [react.id, javascript.id],
      title: 'React Documentation',
    } as any,
  })

  await payload.create({
    collection: pagesSlug as any,
    data: {
      content: 'Curated list of UI/UX resources',
      tags: [uiux.id, design.id],
      title: 'UI/UX Resources',
    } as any,
  })

  await payload.create({
    collection: pagesSlug as any,
    data: {
      content: 'Complete TypeScript reference',
      tags: [typescript.id],
      title: 'TypeScript Handbook',
    } as any,
  })

  await payload.create({
    collection: pagesSlug as any,
    data: {
      content: 'Core JavaScript concepts',
      tags: [javascript.id, programming.id],
      title: 'JavaScript Fundamentals',
    } as any,
  })

  // Note: Skipping media items as they require actual file uploads
  // You can manually upload media and tag them through the UI

  payload.logger.info('Taxonomy seed data created successfully!')
  payload.logger.info('Created taxonomy hierarchy:')
  payload.logger.info('- Technology > Programming > JavaScript > React')
  payload.logger.info('- Technology > Programming > TypeScript')
  payload.logger.info('- Technology > Programming > Python')
  payload.logger.info('- Design > UI/UX')
  payload.logger.info('- Design > Web Design')
  payload.logger.info('- Articles > Tutorials')
  payload.logger.info('- Articles > Guides')
  payload.logger.info('Created 5 posts and 4 pages with tag relationships')
}
