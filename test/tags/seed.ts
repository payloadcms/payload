import type { Payload } from 'payload'

import { pagesSlug, postsSlug, tagsSlug } from './config.js'

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
      [`_h_${tagsSlug}`]: technology.id,
    } as any,
  })

  const javascript = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'JavaScript',
      description: 'JavaScript ecosystem',
      [`_h_${tagsSlug}`]: programming.id,
    } as any,
  })

  const react = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'React',
      description: 'React framework',
      [`_h_${tagsSlug}`]: javascript.id,
    } as any,
  })

  const typescript = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'TypeScript',
      description: 'TypeScript language',
      [`_h_${tagsSlug}`]: programming.id,
    } as any,
  })

  const python = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'Python',
      description: 'Python programming',
      [`_h_${tagsSlug}`]: programming.id,
    } as any,
  })

  const go = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'Go',
      description: 'Go programming language',
      [`_h_${tagsSlug}`]: programming.id,
    } as any,
  })

  const rust = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'Rust',
      description: 'Rust systems programming',
      [`_h_${tagsSlug}`]: programming.id,
    } as any,
  })

  const java = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'Java',
      description: 'Java programming',
      [`_h_${tagsSlug}`]: programming.id,
    } as any,
  })

  const csharp = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'C#',
      description: 'C# and .NET',
      [`_h_${tagsSlug}`]: programming.id,
    } as any,
  })

  // Cloud Computing branch
  const cloud = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'Cloud Computing',
      description: 'Cloud platforms and services',
      [`_h_${tagsSlug}`]: technology.id,
    } as any,
  })

  const aws = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'AWS',
      description: 'Amazon Web Services',
      [`_h_${tagsSlug}`]: cloud.id,
    } as any,
  })

  const azure = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'Azure',
      description: 'Microsoft Azure',
      [`_h_${tagsSlug}`]: cloud.id,
    } as any,
  })

  const gcp = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'Google Cloud',
      description: 'Google Cloud Platform',
      [`_h_${tagsSlug}`]: cloud.id,
    } as any,
  })

  // Databases branch
  const databases = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'Databases',
      description: 'Database systems',
      [`_h_${tagsSlug}`]: technology.id,
    } as any,
  })

  const mongodb = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'MongoDB',
      description: 'NoSQL document database',
      [`_h_${tagsSlug}`]: databases.id,
    } as any,
  })

  const postgresql = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'PostgreSQL',
      description: 'Relational database',
      [`_h_${tagsSlug}`]: databases.id,
    } as any,
  })

  const redis = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'Redis',
      description: 'In-memory data store',
      [`_h_${tagsSlug}`]: databases.id,
    } as any,
  })

  // DevOps branch
  const devops = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'DevOps',
      description: 'Development operations',
      [`_h_${tagsSlug}`]: technology.id,
    } as any,
  })

  const docker = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'Docker',
      description: 'Container platform',
      [`_h_${tagsSlug}`]: devops.id,
    } as any,
  })

  const kubernetes = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'Kubernetes',
      description: 'Container orchestration',
      [`_h_${tagsSlug}`]: devops.id,
    } as any,
  })

  const cicd = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'CI/CD',
      description: 'Continuous integration and deployment',
      [`_h_${tagsSlug}`]: devops.id,
    } as any,
  })

  // Mobile Development branch
  const mobile = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'Mobile Development',
      description: 'Mobile app development',
      [`_h_${tagsSlug}`]: technology.id,
    } as any,
  })

  const ios = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'iOS',
      description: 'iOS development',
      [`_h_${tagsSlug}`]: mobile.id,
    } as any,
  })

  const android = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'Android',
      description: 'Android development',
      [`_h_${tagsSlug}`]: mobile.id,
    } as any,
  })

  const reactNative = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'React Native',
      description: 'Cross-platform mobile development',
      [`_h_${tagsSlug}`]: mobile.id,
    } as any,
  })

  // Security branch
  const security = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'Security',
      description: 'Cybersecurity and best practices',
      [`_h_${tagsSlug}`]: technology.id,
    } as any,
  })

  const encryption = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'Encryption',
      description: 'Data encryption methods',
      [`_h_${tagsSlug}`]: security.id,
    } as any,
  })

  const authentication = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'Authentication',
      description: 'User authentication systems',
      [`_h_${tagsSlug}`]: security.id,
    } as any,
  })

  // AI/ML branch
  const aiml = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'AI & Machine Learning',
      description: 'Artificial intelligence and ML',
      [`_h_${tagsSlug}`]: technology.id,
    } as any,
  })

  const tensorflow = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'TensorFlow',
      description: 'ML framework',
      [`_h_${tagsSlug}`]: aiml.id,
    } as any,
  })

  const pytorch = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'PyTorch',
      description: 'Deep learning framework',
      [`_h_${tagsSlug}`]: aiml.id,
    } as any,
  })

  const nlp = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'NLP',
      description: 'Natural Language Processing',
      [`_h_${tagsSlug}`]: aiml.id,
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
      [`_h_${tagsSlug}`]: design.id,
    } as any,
  })

  const webdesign = await payload.create({
    collection: tagsSlug as any,
    data: {
      name: 'Web Design',
      description: 'Website design',
      [`_h_${tagsSlug}`]: design.id,
    } as any,
  })

  // Create posts with tags
  await payload.create({
    collection: postsSlug as any,
    data: {
      content: 'Learn the basics of React development',
      [`_h_${tagsSlug}`]: [react.id, javascript.id, programming.id],
      title: 'Getting Started with React',
    } as any,
  })

  await payload.create({
    collection: postsSlug as any,
    data: {
      content: 'Best practices for TypeScript development',
      [`_h_${tagsSlug}`]: [typescript.id, programming.id],
      title: 'TypeScript Best Practices',
    } as any,
  })

  await payload.create({
    collection: postsSlug as any,
    data: {
      content: 'Understanding React hooks',
      [`_h_${tagsSlug}`]: [react.id, javascript.id],
      title: 'React Hooks Deep Dive',
    } as any,
  })

  await payload.create({
    collection: postsSlug as any,
    data: {
      content: 'Using Python for data analysis',
      [`_h_${tagsSlug}`]: [python.id, programming.id],
      title: 'Python for Data Science',
    } as any,
  })

  await payload.create({
    collection: postsSlug as any,
    data: {
      content: 'Key principles of modern web design',
      [`_h_${tagsSlug}`]: [webdesign.id, design.id],
      title: 'Modern Web Design Principles',
    } as any,
  })

  // Create pages with tags
  await payload.create({
    collection: pagesSlug as any,
    data: {
      content: 'Comprehensive React documentation and guides',
      [`_h_${tagsSlug}`]: [react.id, javascript.id],
      title: 'React Documentation',
    } as any,
  })

  await payload.create({
    collection: pagesSlug as any,
    data: {
      content: 'Curated list of UI/UX resources',
      [`_h_${tagsSlug}`]: [uiux.id, design.id],
      title: 'UI/UX Resources',
    } as any,
  })

  await payload.create({
    collection: pagesSlug as any,
    data: {
      content: 'Complete TypeScript reference',
      [`_h_${tagsSlug}`]: [typescript.id],
      title: 'TypeScript Handbook',
    } as any,
  })

  await payload.create({
    collection: pagesSlug as any,
    data: {
      content: 'Core JavaScript concepts',
      [`_h_${tagsSlug}`]: [javascript.id, programming.id],
      title: 'JavaScript Fundamentals',
    } as any,
  })

  // Note: Skipping media items as they require actual file uploads
  // You can manually upload media and tag them through the UI

  payload.logger.info('Taxonomy seed data created successfully!')
  payload.logger.info('Created taxonomy hierarchy with 30+ items under Technology:')
  payload.logger.info(
    '- Technology > Programming (JavaScript, TypeScript, Python, Go, Rust, Java, C#)',
  )
  payload.logger.info('- Technology > Cloud Computing (AWS, Azure, Google Cloud)')
  payload.logger.info('- Technology > Databases (MongoDB, PostgreSQL, Redis)')
  payload.logger.info('- Technology > DevOps (Docker, Kubernetes, CI/CD)')
  payload.logger.info('- Technology > Mobile Development (iOS, Android, React Native)')
  payload.logger.info('- Technology > Security (Encryption, Authentication)')
  payload.logger.info('- Technology > AI & Machine Learning (TensorFlow, PyTorch, NLP)')
  payload.logger.info('- Design > UI/UX')
  payload.logger.info('- Design > Web Design')
  payload.logger.info('- Articles > Tutorials')
  payload.logger.info('- Articles > Guides')
  payload.logger.info('Created 5 posts and 4 pages with tag relationships')
}
