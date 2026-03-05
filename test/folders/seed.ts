import type { Payload } from 'payload'

import { categoriesSlug, folderSlug, postSlug } from './shared.js'

export const seed = async (payload: Payload): Promise<void> => {
  // ============================================
  // Create Folders (hierarchical)
  // ============================================

  // Root folders
  const documents = await payload.create({
    collection: folderSlug,
    data: { name: 'Documents', folderType: ['posts', 'drafts'] },
  })

  const projects = await payload.create({
    collection: folderSlug,
    data: { name: 'Projects', folderType: ['posts', 'drafts', 'media'] },
  })

  const archive = await payload.create({
    collection: folderSlug,
    data: { name: 'Archive', folderType: ['posts'] },
  })

  // Documents children
  const reports = await payload.create({
    collection: folderSlug,
    data: { name: 'Reports', folder: documents.id, folderType: ['posts'] },
  })

  const contracts = await payload.create({
    collection: folderSlug,
    data: { name: 'Contracts', folder: documents.id, folderType: ['posts', 'drafts'] },
  })

  const invoices = await payload.create({
    collection: folderSlug,
    data: { name: 'Invoices', folder: documents.id, folderType: ['posts'] },
  })

  // Reports children
  const quarterlyReports = await payload.create({
    collection: folderSlug,
    data: { name: 'Quarterly Reports', folder: reports.id, folderType: ['posts'] },
  })

  const annualReports = await payload.create({
    collection: folderSlug,
    data: { name: 'Annual Reports', folder: reports.id, folderType: ['posts'] },
  })

  // Projects children
  const clientA = await payload.create({
    collection: folderSlug,
    data: { name: 'Client A', folder: projects.id, folderType: ['posts', 'media'] },
  })

  const clientB = await payload.create({
    collection: folderSlug,
    data: { name: 'Client B', folder: projects.id, folderType: ['posts', 'drafts'] },
  })

  const internal = await payload.create({
    collection: folderSlug,
    data: { name: 'Internal', folder: projects.id, folderType: ['drafts'] },
  })

  // Client A children
  const clientADesigns = await payload.create({
    collection: folderSlug,
    data: { name: 'Designs', folder: clientA.id, folderType: ['media'] },
  })

  const clientADocs = await payload.create({
    collection: folderSlug,
    data: { name: 'Documentation', folder: clientA.id, folderType: ['posts'] },
  })

  // Client B children
  const clientBDesigns = await payload.create({
    collection: folderSlug,
    data: { name: 'Designs', folder: clientB.id, folderType: ['media'] },
  })

  const clientBDocs = await payload.create({
    collection: folderSlug,
    data: { name: 'Documentation', folder: clientB.id, folderType: ['posts', 'drafts'] },
  })

  // Internal children
  const internalMeetings = await payload.create({
    collection: folderSlug,
    data: { name: 'Meeting Notes', folder: internal.id, folderType: ['drafts'] },
  })

  const internalPolicies = await payload.create({
    collection: folderSlug,
    data: { name: 'Policies', folder: internal.id, folderType: ['posts'] },
  })

  // Archive children
  const archive2023 = await payload.create({
    collection: folderSlug,
    data: { name: '2023', folder: archive.id, folderType: ['posts'] },
  })

  const archive2024 = await payload.create({
    collection: folderSlug,
    data: { name: '2024', folder: archive.id, folderType: ['posts'] },
  })

  // Deep nesting example
  const archive2023Q1 = await payload.create({
    collection: folderSlug,
    data: { name: 'Q1', folder: archive2023.id, folderType: ['posts'] },
  })

  const archive2023Q2 = await payload.create({
    collection: folderSlug,
    data: { name: 'Q2', folder: archive2023.id, folderType: ['posts'] },
  })

  const archive2023Q3 = await payload.create({
    collection: folderSlug,
    data: { name: 'Q3', folder: archive2023.id, folderType: ['posts'] },
  })

  const archive2023Q4 = await payload.create({
    collection: folderSlug,
    data: { name: 'Q4', folder: archive2023.id, folderType: ['posts'] },
  })

  // More root folders
  const drafts = await payload.create({
    collection: folderSlug,
    data: { name: 'Drafts', folderType: ['drafts'] },
  })

  const templates = await payload.create({
    collection: folderSlug,
    data: { name: 'Templates', folderType: ['posts', 'drafts'] },
  })

  // One unrestricted root folder for testing
  const shared = await payload.create({
    collection: folderSlug,
    data: { name: 'Shared' },
  })

  // ============================================
  // More root folders with specific folderType
  // ============================================

  const images = await payload.create({
    collection: folderSlug,
    data: { name: 'Images', folderType: ['media'] },
  })

  const mediaLibrary = await payload.create({
    collection: folderSlug,
    data: { name: 'Media Library', folderType: ['media'] },
  })

  // Child folders under "Media Library"
  await payload.create({
    collection: folderSlug,
    data: { name: 'Photos', folder: mediaLibrary.id, folderType: ['media'] },
  })

  await payload.create({
    collection: folderSlug,
    data: { name: 'Videos', folder: mediaLibrary.id, folderType: ['media'] },
  })

  // ============================================
  // Create Categories (hierarchical)
  // ============================================

  // Root categories
  const status = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Status' },
  })

  const priority = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Priority' },
  })

  const department = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Department' },
  })

  const type = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Type' },
  })

  // Status children
  const draft = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Draft', [`_h_${categoriesSlug}`]: status.id },
  })

  const inReview = await payload.create({
    collection: categoriesSlug,
    data: { name: 'In Review', [`_h_${categoriesSlug}`]: status.id },
  })

  const approved = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Approved', [`_h_${categoriesSlug}`]: status.id },
  })

  const published = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Published', [`_h_${categoriesSlug}`]: status.id },
  })

  const archived = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Archived', [`_h_${categoriesSlug}`]: status.id },
  })

  // Priority children
  const urgent = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Urgent', [`_h_${categoriesSlug}`]: priority.id },
  })

  const high = await payload.create({
    collection: categoriesSlug,
    data: { name: 'High', [`_h_${categoriesSlug}`]: priority.id },
  })

  const medium = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Medium', [`_h_${categoriesSlug}`]: priority.id },
  })

  const low = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Low', [`_h_${categoriesSlug}`]: priority.id },
  })

  // Department children
  const engineering = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Engineering', [`_h_${categoriesSlug}`]: department.id },
  })

  const design = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Design', [`_h_${categoriesSlug}`]: department.id },
  })

  const marketing = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Marketing', [`_h_${categoriesSlug}`]: department.id },
  })

  const sales = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Sales', [`_h_${categoriesSlug}`]: department.id },
  })

  const hr = await payload.create({
    collection: categoriesSlug,
    data: { name: 'HR', [`_h_${categoriesSlug}`]: department.id },
  })

  // Type children
  const blogPost = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Blog Post', [`_h_${categoriesSlug}`]: type.id },
  })

  const tutorial = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Tutorial', [`_h_${categoriesSlug}`]: type.id },
  })

  const announcement = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Announcement', [`_h_${categoriesSlug}`]: type.id },
  })

  const caseStudy = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Case Study', [`_h_${categoriesSlug}`]: type.id },
  })

  const documentation = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Documentation', [`_h_${categoriesSlug}`]: type.id },
  })

  // Nested under Engineering
  const frontend = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Frontend', [`_h_${categoriesSlug}`]: engineering.id },
  })

  const backend = await payload.create({
    collection: categoriesSlug,
    data: { name: 'Backend', [`_h_${categoriesSlug}`]: engineering.id },
  })

  const devops = await payload.create({
    collection: categoriesSlug,
    data: { name: 'DevOps', [`_h_${categoriesSlug}`]: engineering.id },
  })

  // ============================================
  // Create Posts with folders and tags
  // ============================================

  await payload.create({
    collection: postSlug,
    data: {
      folder: quarterlyReports.id,
      [`_h_${categoriesSlug}`]: [published.id, high.id],
      title: 'Q1 2023 Financial Report',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: annualReports.id,
      [`_h_${categoriesSlug}`]: [published.id, urgent.id],
      title: 'Annual Report 2023',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: clientADocs.id,
      [`_h_${categoriesSlug}`]: [approved.id, engineering.id],
      title: 'Client A Project Kickoff',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: clientADocs.id,
      [`_h_${categoriesSlug}`]: [inReview.id, design.id, frontend.id],
      title: 'Client A Design System',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: clientBDocs.id,
      [`_h_${categoriesSlug}`]: [draft.id, backend.id, documentation.id],
      title: 'Client B API Documentation',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: internalPolicies.id,
      [`_h_${categoriesSlug}`]: [archived.id, low.id],
      title: 'Team Meeting Notes - January',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: internalPolicies.id,
      [`_h_${categoriesSlug}`]: [published.id, hr.id],
      title: 'Remote Work Policy',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: contracts.id,
      [`_h_${categoriesSlug}`]: [approved.id, sales.id],
      title: 'Service Agreement Template',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: invoices.id,
      [`_h_${categoriesSlug}`]: [archived.id],
      title: 'Invoice #2023-001',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: templates.id,
      [`_h_${categoriesSlug}`]: [draft.id, devops.id, blogPost.id],
      title: 'Blog Post Draft: DevOps Best Practices',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: shared.id,
      [`_h_${categoriesSlug}`]: [inReview.id, marketing.id, high.id],
      title: 'Marketing Campaign Q2',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: shared.id,
      [`_h_${categoriesSlug}`]: [published.id, announcement.id, engineering.id],
      title: 'New Feature Announcement',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: templates.id,
      [`_h_${categoriesSlug}`]: [published.id, tutorial.id, frontend.id],
      title: 'React Tutorial: Getting Started',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: clientBDocs.id,
      [`_h_${categoriesSlug}`]: [approved.id, caseStudy.id, sales.id],
      title: 'Case Study: Client B Success Story',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: archive2023Q1.id,
      [`_h_${categoriesSlug}`]: [archived.id],
      title: 'Archived Q1 Notes',
    },
  })

  payload.logger.info('Seed data created successfully!')
  payload.logger.info('Created 30 folders with hierarchy:')
  payload.logger.info('  - Documents > Reports (Quarterly, Annual), Contracts, Invoices')
  payload.logger.info('  - Projects > Client A (Designs, Docs), Client B (Designs, Docs), Internal')
  payload.logger.info('  - Archive > 2023 (Q1-Q4), 2024')
  payload.logger.info('  - Drafts, Templates, Shared')
  payload.logger.info('Created 30 categories with hierarchy:')
  payload.logger.info('  - Status > Draft, In Review, Approved, Published, Archived')
  payload.logger.info('  - Priority > Urgent, High, Medium, Low')
  payload.logger.info(
    '  - Department > Engineering (Frontend, Backend, DevOps), Design, Marketing, Sales, HR',
  )
  payload.logger.info('  - Type > Blog Post, Tutorial, Announcement, Case Study, Documentation')
  payload.logger.info('Created 15 posts assigned to various folders and categories')
}
