import type { CollectionConfig, PayloadRequest } from 'payload'

import { populateFullTitle } from './populateFullTitle.js'

type Simulation = {
  /** Make the child re-save throw something that is not a `ValidationError`. */
  infraFailure?: boolean
  /** Make the child re-save throw a `ValidationError`. */
  staleReference?: boolean
}

const getSimulation = (req: PayloadRequest): Simulation =>
  (req?.context?.simulate as Simulation) || {}

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: {
    singular: 'Page',
    plural: 'Pages',
  },
  admin: {
    useAsTitle: 'fullTitle',
  },
  versions: {
    drafts: {
      schedulePublish: true,
    },
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        // Stands in for a non-validation failure during the re-save — the
        // reporter names a database error. Anything of this shape is swallowed
        // by the plugin's catch even one level deep.
        if (data?.breaksOnResave && getSimulation(req).infraFailure) {
          throw new Error('Simulated database failure while re-saving a child.')
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      required: true,
    },
    {
      // Marks a document that should fail when the plugin re-saves it. Both
      // failure modes are gated on request context as well, so they fire only
      // for the one cascade a test drives and leave the rest of the suite alone.
      name: 'breaksOnResave',
      type: 'checkbox',
      admin: {
        hidden: true,
      },
      // Stands in for the reported cause: a document that is valid as stored and
      // only fails when something re-validates it later — there, a required
      // upload field whose media document had since been deleted.
      validate: (value, { req }) =>
        value && getSimulation(req).staleReference ? 'This field is invalid.' : true,
    },
    {
      name: 'fullTitle',
      type: 'text',
      localized: true,
      hooks: {
        beforeChange: [populateFullTitle],
      },
      admin: {
        components: {
          Field: null,
        },
      },
    },
  ],
}
