import type { CollectionConfig } from 'payload'

import { slugs } from '../../shared.js'

export const TagsCollection: CollectionConfig = {
  slug: slugs.tags,
  treeView: true,
  admin: {
    useAsTitle: 'name',
  },
  endpoints: [
    {
      path: '/seed-data',
      method: 'post',
      handler: async (req) => {
        const { payload } = req

        // Clear existing tags
        await payload.delete({
          collection: 'tags',
          where: {},
        })

        // Root level folders
        const categories = await payload.create({
          collection: 'tags',
          data: { name: 'Categories' },
        })

        const projects = await payload.create({
          collection: 'tags',
          data: { name: 'Projects' },
        })

        const archived = await payload.create({
          collection: 'tags',
          data: { name: 'Archived' },
        })

        // Categories children
        const frontend = await payload.create({
          collection: 'tags',
          data: { name: 'Frontend', _parentDoc: categories.id },
        })

        const backend = await payload.create({
          collection: 'tags',
          data: { name: 'Backend', _parentDoc: categories.id },
        })

        const design = await payload.create({
          collection: 'tags',
          data: { name: 'Design', _parentDoc: categories.id },
        })

        // Frontend children
        const react = await payload.create({
          collection: 'tags',
          data: { name: 'React', _parentDoc: frontend.id },
        })

        const vue = await payload.create({
          collection: 'tags',
          data: { name: 'Vue', _parentDoc: frontend.id },
        })

        const css = await payload.create({
          collection: 'tags',
          data: { name: 'CSS', _parentDoc: frontend.id },
        })

        // React children (leaf nodes)
        await payload.create({
          collection: 'tags',
          data: { name: 'Hooks', _parentDoc: react.id },
        })

        await payload.create({
          collection: 'tags',
          data: { name: 'Components', _parentDoc: react.id },
        })

        await payload.create({
          collection: 'tags',
          data: { name: 'State Management', _parentDoc: react.id },
        })

        // Vue children (leaf nodes)
        await payload.create({
          collection: 'tags',
          data: { name: 'Composition API', _parentDoc: vue.id },
        })

        await payload.create({
          collection: 'tags',
          data: { name: 'Pinia', _parentDoc: vue.id },
        })

        // CSS children (leaf nodes)
        await payload.create({
          collection: 'tags',
          data: { name: 'Tailwind', _parentDoc: css.id },
        })

        await payload.create({
          collection: 'tags',
          data: { name: 'SCSS', _parentDoc: css.id },
        })

        // Backend children
        const nodejs = await payload.create({
          collection: 'tags',
          data: { name: 'Node.js', _parentDoc: backend.id },
        })

        const databases = await payload.create({
          collection: 'tags',
          data: { name: 'Databases', _parentDoc: backend.id },
        })

        const apis = await payload.create({
          collection: 'tags',
          data: { name: 'APIs', _parentDoc: backend.id },
        })

        // Node.js children (leaf nodes)
        await payload.create({
          collection: 'tags',
          data: { name: 'Express', _parentDoc: nodejs.id },
        })

        await payload.create({
          collection: 'tags',
          data: { name: 'Fastify', _parentDoc: nodejs.id },
        })

        // Databases children (leaf nodes)
        await payload.create({
          collection: 'tags',
          data: { name: 'MongoDB', _parentDoc: databases.id },
        })

        await payload.create({
          collection: 'tags',
          data: { name: 'PostgreSQL', _parentDoc: databases.id },
        })

        await payload.create({
          collection: 'tags',
          data: { name: 'Redis', _parentDoc: databases.id },
        })

        // APIs children (leaf nodes)
        await payload.create({
          collection: 'tags',
          data: { name: 'REST', _parentDoc: apis.id },
        })

        await payload.create({
          collection: 'tags',
          data: { name: 'GraphQL', _parentDoc: apis.id },
        })

        // Design children (leaf nodes)
        await payload.create({
          collection: 'tags',
          data: { name: 'UI/UX', _parentDoc: design.id },
        })

        await payload.create({
          collection: 'tags',
          data: { name: 'Figma', _parentDoc: design.id },
        })

        await payload.create({
          collection: 'tags',
          data: { name: 'Design Systems', _parentDoc: design.id },
        })

        // Projects children
        const activeProjects = await payload.create({
          collection: 'tags',
          data: { name: 'Active', _parentDoc: projects.id },
        })

        const planning = await payload.create({
          collection: 'tags',
          data: { name: 'Planning', _parentDoc: projects.id },
        })

        // Active projects (leaf nodes)
        await payload.create({
          collection: 'tags',
          data: { name: 'E-commerce Platform', _parentDoc: activeProjects.id },
        })

        await payload.create({
          collection: 'tags',
          data: { name: 'Mobile App', _parentDoc: activeProjects.id },
        })

        await payload.create({
          collection: 'tags',
          data: { name: 'Dashboard Redesign', _parentDoc: activeProjects.id },
        })

        // Planning projects (leaf nodes)
        await payload.create({
          collection: 'tags',
          data: { name: 'AI Integration', _parentDoc: planning.id },
        })

        await payload.create({
          collection: 'tags',
          data: { name: 'Performance Optimization', _parentDoc: planning.id },
        })

        // Archived (leaf nodes at root level)
        await payload.create({
          collection: 'tags',
          data: { name: '2023 Projects', _parentDoc: archived.id },
        })

        await payload.create({
          collection: 'tags',
          data: { name: 'Legacy Code', _parentDoc: archived.id },
        })

        return Response.json({ success: true, message: 'Seed data created with 50+ tags' })
      },
    },
  ],
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
}
