import type { Config } from 'payload'

import type { VisualJobsPluginConfig } from './types.js'

export const visualJobsPlugin =
  (pluginConfig: VisualJobsPluginConfig) =>
  (config: Config): Config => {
    return {
      ...config,
      jobs: {
        ...config.jobs,

        jobsCollectionOverrides: ({ defaultJobsCollection }) => {
          return {
            ...defaultJobsCollection,

            admin: {
              ...(defaultJobsCollection.admin || {}),
              components: {
                ...(defaultJobsCollection.admin?.components || {}),
                views: {
                  ...(defaultJobsCollection.admin?.components?.views || {}),
                  edit: {
                    jobs: {
                      Component: '@payloadcms/plugin-visual-jobs/rsc#JobsView',
                      path: '/visualize',
                      tab: {
                        href: '/visualize',
                        label: 'Visualize',
                      },
                    },
                  },
                },
              },
              hidden: false,
            },
          }
        },
        tasks: [...(config.jobs?.tasks || [])],
      },
    }
  }
