import type { Config, TaskHandlerArgs, VersionedCollectionSlug } from 'payload'

type Options = {
  collections: Partial<Record<VersionedCollectionSlug, true>>
  disabled?: boolean
}

type PublishDocumentInput = {
  collectionSlug: VersionedCollectionSlug
  documentID: number | string
}

export const pluginScheduledPublish = (options: Options) => {
  return (config: Config) => {
    if (options.disabled) {
      return config
    }

    if (config.collections) {
      for (const collection of config.collections) {
        if (!options.collections[collection.slug]) {
          continue
        }

        collection.fields.push({
          name: 'scheduled_publish_ui',
          type: 'ui',
          admin: {
            components: {
              Field: '@payloadcms/plugin-scheduled-publish/rsc#ScheduledPublishField',
            },
            position: 'sidebar',
          },
        })
      }

      return config
    }

    if (!config.jobs) {
      config.jobs = {
        tasks: [],
      }
    }

    config.jobs.tasks.push({
      slug: 'PublishDocument',
      handler: async ({
        input,
        req,
      }: TaskHandlerArgs<{
        input: PublishDocumentInput
        output: any
      }>) => {
        const { collectionSlug, documentID } = input

        await req.payload.update({
          id: documentID,
          collection: collectionSlug,
          data: { _status: 'published' },
        })

        return {
          output: null,
          state: 'succeeded',
        }
      },
      inputSchema: [
        {
          name: 'collectionSlug',
          type: 'select',
          options: Object.keys(options.collections),
          required: true,
        },
        {
          name: 'documentID',
          type: 'json',
          jsonSchema: {
            fileMatch: ['a://b/foo.json'],
            schema: {
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'number',
                },
              ],
              required: true,
            },
            uri: 'a://b/foo.json',
          },
        },
      ],
    })

    config.jobs.tasks.push({
      slug: 'UnpublishDocument',
      handler: async ({
        input,
        req,
      }: TaskHandlerArgs<{
        input: PublishDocumentInput
        output: any
      }>) => {
        const { collectionSlug, documentID } = input

        await req.payload.update({
          id: documentID,
          collection: collectionSlug,
          data: { _status: 'draft' },
        })

        return {
          output: null,
          state: 'succeeded',
        }
      },
      inputSchema: [
        {
          name: 'collectionSlug',
          type: 'select',
          options: Object.keys(options.collections),
          required: true,
        },
        {
          name: 'documentID',
          type: 'json',
          jsonSchema: {
            fileMatch: ['a://b/foo.json'],
            schema: {
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'number',
                },
              ],
              required: true,
            },
            uri: 'a://b/foo.json',
          },
        },
      ],
    })

    return config
  }
}
