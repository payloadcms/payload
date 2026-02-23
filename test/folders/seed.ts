import type { Payload } from 'payload'

import { folderSlug, postSlug, tagsSlug } from './shared.js'

export const seed = async (payload: Payload): Promise<void> => {
  // ============================================
  // Create Folders (hierarchical)
  // ============================================

  // Root folders
  const documents = await payload.create({
    collection: folderSlug,
    data: { name: 'Documents' },
  })

  const projects = await payload.create({
    collection: folderSlug,
    data: { name: 'Projects' },
  })

  const archive = await payload.create({
    collection: folderSlug,
    data: { name: 'Archive' },
  })

  // Documents children
  const reports = await payload.create({
    collection: folderSlug,
    data: { name: 'Reports', folder: documents.id },
  })

  const contracts = await payload.create({
    collection: folderSlug,
    data: { name: 'Contracts', folder: documents.id },
  })

  const invoices = await payload.create({
    collection: folderSlug,
    data: { name: 'Invoices', folder: documents.id },
  })

  // Reports children
  const quarterlyReports = await payload.create({
    collection: folderSlug,
    data: { name: 'Quarterly Reports', folder: reports.id },
  })

  const annualReports = await payload.create({
    collection: folderSlug,
    data: { name: 'Annual Reports', folder: reports.id },
  })

  // Projects children
  const clientA = await payload.create({
    collection: folderSlug,
    data: { name: 'Client A', folder: projects.id },
  })

  const clientB = await payload.create({
    collection: folderSlug,
    data: { name: 'Client B', folder: projects.id },
  })

  const internal = await payload.create({
    collection: folderSlug,
    data: { name: 'Internal', folder: projects.id },
  })

  // Client A children
  const clientADesigns = await payload.create({
    collection: folderSlug,
    data: { name: 'Designs', folder: clientA.id },
  })

  const clientADocs = await payload.create({
    collection: folderSlug,
    data: { name: 'Documentation', folder: clientA.id },
  })

  // Client B children
  const clientBDesigns = await payload.create({
    collection: folderSlug,
    data: { name: 'Designs', folder: clientB.id },
  })

  const clientBDocs = await payload.create({
    collection: folderSlug,
    data: { name: 'Documentation', folder: clientB.id },
  })

  // Internal children
  const internalMeetings = await payload.create({
    collection: folderSlug,
    data: { name: 'Meeting Notes', folder: internal.id },
  })

  const internalPolicies = await payload.create({
    collection: folderSlug,
    data: { name: 'Policies', folder: internal.id },
  })

  // Archive children
  const archive2023 = await payload.create({
    collection: folderSlug,
    data: { name: '2023', folder: archive.id },
  })

  const archive2024 = await payload.create({
    collection: folderSlug,
    data: { name: '2024', folder: archive.id },
  })

  // Deep nesting example
  const archive2023Q1 = await payload.create({
    collection: folderSlug,
    data: { name: 'Q1', folder: archive2023.id },
  })

  const archive2023Q2 = await payload.create({
    collection: folderSlug,
    data: { name: 'Q2', folder: archive2023.id },
  })

  const archive2023Q3 = await payload.create({
    collection: folderSlug,
    data: { name: 'Q3', folder: archive2023.id },
  })

  const archive2023Q4 = await payload.create({
    collection: folderSlug,
    data: { name: 'Q4', folder: archive2023.id },
  })

  // More root folders
  const drafts = await payload.create({
    collection: folderSlug,
    data: { name: 'Drafts' },
  })

  const templates = await payload.create({
    collection: folderSlug,
    data: { name: 'Templates' },
  })

  const shared = await payload.create({
    collection: folderSlug,
    data: { name: 'Shared' },
  })

  // ============================================
  // Create Tags (hierarchical)
  // ============================================

  // Root tags
  const status = await payload.create({
    collection: tagsSlug,
    data: { name: 'Status' },
  })

  const priority = await payload.create({
    collection: tagsSlug,
    data: { name: 'Priority' },
  })

  const department = await payload.create({
    collection: tagsSlug,
    data: { name: 'Department' },
  })

  const type = await payload.create({
    collection: tagsSlug,
    data: { name: 'Type' },
  })

  // Status children
  const draft = await payload.create({
    collection: tagsSlug,
    data: { name: 'Draft', _h_parent: status.id },
  })

  const inReview = await payload.create({
    collection: tagsSlug,
    data: { name: 'In Review', _h_parent: status.id },
  })

  const approved = await payload.create({
    collection: tagsSlug,
    data: { name: 'Approved', _h_parent: status.id },
  })

  const published = await payload.create({
    collection: tagsSlug,
    data: { name: 'Published', _h_parent: status.id },
  })

  const archived = await payload.create({
    collection: tagsSlug,
    data: { name: 'Archived', _h_parent: status.id },
  })

  // Priority children
  const urgent = await payload.create({
    collection: tagsSlug,
    data: { name: 'Urgent', _h_parent: priority.id },
  })

  const high = await payload.create({
    collection: tagsSlug,
    data: { name: 'High', _h_parent: priority.id },
  })

  const medium = await payload.create({
    collection: tagsSlug,
    data: { name: 'Medium', _h_parent: priority.id },
  })

  const low = await payload.create({
    collection: tagsSlug,
    data: { name: 'Low', _h_parent: priority.id },
  })

  // Department children
  const engineering = await payload.create({
    collection: tagsSlug,
    data: { name: 'Engineering', _h_parent: department.id },
  })

  const design = await payload.create({
    collection: tagsSlug,
    data: { name: 'Design', _h_parent: department.id },
  })

  const marketing = await payload.create({
    collection: tagsSlug,
    data: { name: 'Marketing', _h_parent: department.id },
  })

  const sales = await payload.create({
    collection: tagsSlug,
    data: { name: 'Sales', _h_parent: department.id },
  })

  const hr = await payload.create({
    collection: tagsSlug,
    data: { name: 'HR', _h_parent: department.id },
  })

  // Type children
  const blogPost = await payload.create({
    collection: tagsSlug,
    data: { name: 'Blog Post', _h_parent: type.id },
  })

  const tutorial = await payload.create({
    collection: tagsSlug,
    data: { name: 'Tutorial', _h_parent: type.id },
  })

  const announcement = await payload.create({
    collection: tagsSlug,
    data: { name: 'Announcement', _h_parent: type.id },
  })

  const caseStudy = await payload.create({
    collection: tagsSlug,
    data: { name: 'Case Study', _h_parent: type.id },
  })

  const documentation = await payload.create({
    collection: tagsSlug,
    data: { name: 'Documentation', _h_parent: type.id },
  })

  // Nested under Engineering
  const frontend = await payload.create({
    collection: tagsSlug,
    data: { name: 'Frontend', _h_parent: engineering.id },
  })

  const backend = await payload.create({
    collection: tagsSlug,
    data: { name: 'Backend', _h_parent: engineering.id },
  })

  const devops = await payload.create({
    collection: tagsSlug,
    data: { name: 'DevOps', _h_parent: engineering.id },
  })

  // ============================================
  // Create Posts with folders and tags
  // ============================================

  await payload.create({
    collection: postSlug,
    data: {
      folder: quarterlyReports.id,
      _h_tags: [published.id, high.id],
      title: 'Q1 2023 Financial Report',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: annualReports.id,
      _h_tags: [published.id, urgent.id],
      title: 'Annual Report 2023',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: clientADocs.id,
      _h_tags: [approved.id, engineering.id],
      title: 'Client A Project Kickoff',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: clientADesigns.id,
      _h_tags: [inReview.id, design.id, frontend.id],
      title: 'Client A Design System',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: clientBDocs.id,
      _h_tags: [draft.id, backend.id, documentation.id],
      title: 'Client B API Documentation',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: internalMeetings.id,
      _h_tags: [archived.id, low.id],
      title: 'Team Meeting Notes - January',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: internalPolicies.id,
      _h_tags: [published.id, hr.id],
      title: 'Remote Work Policy',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: contracts.id,
      _h_tags: [approved.id, sales.id],
      title: 'Service Agreement Template',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: invoices.id,
      _h_tags: [archived.id],
      title: 'Invoice #2023-001',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: drafts.id,
      _h_tags: [draft.id, devops.id, blogPost.id],
      title: 'Blog Post Draft: DevOps Best Practices',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: shared.id,
      _h_tags: [inReview.id, marketing.id, high.id],
      title: 'Marketing Campaign Q2',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: shared.id,
      _h_tags: [published.id, announcement.id, engineering.id],
      title: 'New Feature Announcement',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: templates.id,
      _h_tags: [published.id, tutorial.id, frontend.id],
      title: 'React Tutorial: Getting Started',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: clientBDocs.id,
      _h_tags: [approved.id, caseStudy.id, sales.id],
      title: 'Case Study: Client B Success Story',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      folder: archive2023Q1.id,
      _h_tags: [archived.id],
      title: 'Archived Q1 Notes',
    },
  })

  payload.logger.info('Seed data created successfully!')
  payload.logger.info('Created 30 folders with hierarchy:')
  payload.logger.info('  - Documents > Reports (Quarterly, Annual), Contracts, Invoices')
  payload.logger.info('  - Projects > Client A (Designs, Docs), Client B (Designs, Docs), Internal')
  payload.logger.info('  - Archive > 2023 (Q1-Q4), 2024')
  payload.logger.info('  - Drafts, Templates, Shared')
  payload.logger.info('Created 30 tags with hierarchy:')
  payload.logger.info('  - Status > Draft, In Review, Approved, Published, Archived')
  payload.logger.info('  - Priority > Urgent, High, Medium, Low')
  payload.logger.info(
    '  - Department > Engineering (Frontend, Backend, DevOps), Design, Marketing, Sales, HR',
  )
  payload.logger.info('  - Type > Blog Post, Tutorial, Announcement, Case Study, Documentation')
  payload.logger.info('Created 15 posts assigned to various folders and tags')
}
