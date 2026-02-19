import type { Payload } from 'payload'

import { folderSlug, postSlug, taxonomySlug } from './shared.js'

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
    data: { name: 'Reports', parent: documents.id },
  })

  const contracts = await payload.create({
    collection: folderSlug,
    data: { name: 'Contracts', parent: documents.id },
  })

  const invoices = await payload.create({
    collection: folderSlug,
    data: { name: 'Invoices', parent: documents.id },
  })

  // Reports children
  const quarterlyReports = await payload.create({
    collection: folderSlug,
    data: { name: 'Quarterly Reports', parent: reports.id },
  })

  const annualReports = await payload.create({
    collection: folderSlug,
    data: { name: 'Annual Reports', parent: reports.id },
  })

  // Projects children
  const clientA = await payload.create({
    collection: folderSlug,
    data: { name: 'Client A', parent: projects.id },
  })

  const clientB = await payload.create({
    collection: folderSlug,
    data: { name: 'Client B', parent: projects.id },
  })

  const internal = await payload.create({
    collection: folderSlug,
    data: { name: 'Internal', parent: projects.id },
  })

  // Client A children
  const clientADesigns = await payload.create({
    collection: folderSlug,
    data: { name: 'Designs', parent: clientA.id },
  })

  const clientADocs = await payload.create({
    collection: folderSlug,
    data: { name: 'Documentation', parent: clientA.id },
  })

  // Client B children
  const clientBDesigns = await payload.create({
    collection: folderSlug,
    data: { name: 'Designs', parent: clientB.id },
  })

  const clientBDocs = await payload.create({
    collection: folderSlug,
    data: { name: 'Documentation', parent: clientB.id },
  })

  // Internal children
  const internalMeetings = await payload.create({
    collection: folderSlug,
    data: { name: 'Meeting Notes', parent: internal.id },
  })

  const internalPolicies = await payload.create({
    collection: folderSlug,
    data: { name: 'Policies', parent: internal.id },
  })

  // Archive children
  const archive2023 = await payload.create({
    collection: folderSlug,
    data: { name: '2023', parent: archive.id },
  })

  const archive2024 = await payload.create({
    collection: folderSlug,
    data: { name: '2024', parent: archive.id },
  })

  // Deep nesting example
  const archive2023Q1 = await payload.create({
    collection: folderSlug,
    data: { name: 'Q1', parent: archive2023.id },
  })

  const archive2023Q2 = await payload.create({
    collection: folderSlug,
    data: { name: 'Q2', parent: archive2023.id },
  })

  const archive2023Q3 = await payload.create({
    collection: folderSlug,
    data: { name: 'Q3', parent: archive2023.id },
  })

  const archive2023Q4 = await payload.create({
    collection: folderSlug,
    data: { name: 'Q4', parent: archive2023.id },
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
    collection: taxonomySlug,
    data: { name: 'Status' },
  })

  const priority = await payload.create({
    collection: taxonomySlug,
    data: { name: 'Priority' },
  })

  const department = await payload.create({
    collection: taxonomySlug,
    data: { name: 'Department' },
  })

  const type = await payload.create({
    collection: taxonomySlug,
    data: { name: 'Type' },
  })

  // Status children
  const draft = await payload.create({
    collection: taxonomySlug,
    data: { name: 'Draft', parent: status.id },
  })

  const inReview = await payload.create({
    collection: taxonomySlug,
    data: { name: 'In Review', parent: status.id },
  })

  const approved = await payload.create({
    collection: taxonomySlug,
    data: { name: 'Approved', parent: status.id },
  })

  const published = await payload.create({
    collection: taxonomySlug,
    data: { name: 'Published', parent: status.id },
  })

  const archived = await payload.create({
    collection: taxonomySlug,
    data: { name: 'Archived', parent: status.id },
  })

  // Priority children
  const urgent = await payload.create({
    collection: taxonomySlug,
    data: { name: 'Urgent', parent: priority.id },
  })

  const high = await payload.create({
    collection: taxonomySlug,
    data: { name: 'High', parent: priority.id },
  })

  const medium = await payload.create({
    collection: taxonomySlug,
    data: { name: 'Medium', parent: priority.id },
  })

  const low = await payload.create({
    collection: taxonomySlug,
    data: { name: 'Low', parent: priority.id },
  })

  // Department children
  const engineering = await payload.create({
    collection: taxonomySlug,
    data: { name: 'Engineering', parent: department.id },
  })

  const design = await payload.create({
    collection: taxonomySlug,
    data: { name: 'Design', parent: department.id },
  })

  const marketing = await payload.create({
    collection: taxonomySlug,
    data: { name: 'Marketing', parent: department.id },
  })

  const sales = await payload.create({
    collection: taxonomySlug,
    data: { name: 'Sales', parent: department.id },
  })

  const hr = await payload.create({
    collection: taxonomySlug,
    data: { name: 'HR', parent: department.id },
  })

  // Type children
  const blogPost = await payload.create({
    collection: taxonomySlug,
    data: { name: 'Blog Post', parent: type.id },
  })

  const tutorial = await payload.create({
    collection: taxonomySlug,
    data: { name: 'Tutorial', parent: type.id },
  })

  const announcement = await payload.create({
    collection: taxonomySlug,
    data: { name: 'Announcement', parent: type.id },
  })

  const caseStudy = await payload.create({
    collection: taxonomySlug,
    data: { name: 'Case Study', parent: type.id },
  })

  const documentation = await payload.create({
    collection: taxonomySlug,
    data: { name: 'Documentation', parent: type.id },
  })

  // Nested under Engineering
  const frontend = await payload.create({
    collection: taxonomySlug,
    data: { name: 'Frontend', parent: engineering.id },
  })

  const backend = await payload.create({
    collection: taxonomySlug,
    data: { name: 'Backend', parent: engineering.id },
  })

  const devops = await payload.create({
    collection: taxonomySlug,
    data: { name: 'DevOps', parent: engineering.id },
  })

  // ============================================
  // Create Posts with folders and tags
  // ============================================

  await payload.create({
    collection: postSlug,
    data: {
      _f_folders: quarterlyReports.id,
      _t_tags: [published.id, high.id],
      title: 'Q1 2023 Financial Report',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      _f_folders: annualReports.id,
      _t_tags: [published.id, urgent.id],
      title: 'Annual Report 2023',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      _f_folders: clientADocs.id,
      _t_tags: [approved.id, engineering.id],
      title: 'Client A Project Kickoff',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      _f_folders: clientADesigns.id,
      _t_tags: [inReview.id, design.id, frontend.id],
      title: 'Client A Design System',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      _f_folders: clientBDocs.id,
      _t_tags: [draft.id, backend.id, documentation.id],
      title: 'Client B API Documentation',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      _f_folders: internalMeetings.id,
      _t_tags: [archived.id, low.id],
      title: 'Team Meeting Notes - January',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      _f_folders: internalPolicies.id,
      _t_tags: [published.id, hr.id],
      title: 'Remote Work Policy',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      _f_folders: contracts.id,
      _t_tags: [approved.id, sales.id],
      title: 'Service Agreement Template',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      _f_folders: invoices.id,
      _t_tags: [archived.id],
      title: 'Invoice #2023-001',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      _f_folders: drafts.id,
      _t_tags: [draft.id, devops.id, blogPost.id],
      title: 'Blog Post Draft: DevOps Best Practices',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      _f_folders: shared.id,
      _t_tags: [inReview.id, marketing.id, high.id],
      title: 'Marketing Campaign Q2',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      _f_folders: shared.id,
      _t_tags: [published.id, announcement.id, engineering.id],
      title: 'New Feature Announcement',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      _f_folders: templates.id,
      _t_tags: [published.id, tutorial.id, frontend.id],
      title: 'React Tutorial: Getting Started',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      _f_folders: clientBDocs.id,
      _t_tags: [approved.id, caseStudy.id, sales.id],
      title: 'Case Study: Client B Success Story',
    },
  })

  await payload.create({
    collection: postSlug,
    data: {
      _f_folders: archive2023Q1.id,
      _t_tags: [archived.id],
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
