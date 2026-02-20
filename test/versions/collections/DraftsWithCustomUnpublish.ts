import type { CollectionConfig } from 'payload'

export const draftWithCustomUnpublishSlug = 'drafts-with-custom-unpublish'

const DraftsWithCustomUnpublish: CollectionConfig = {
  slug: draftWithCustomUnpublishSlug,
  admin: {
    components: {
      edit: {
        UnpublishButton: '/elements/CustomUnpublishButton/index.js#CustomUnpublishButton',
      },
    },
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
  versions: {
    drafts: true,
  },
}

export default DraftsWithCustomUnpublish
