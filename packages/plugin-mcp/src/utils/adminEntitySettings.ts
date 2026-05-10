/**
 * Default admin entity settings for collections and globals.
 * Used to generate the MCP API key permission fields.
 */
export const adminEntitySettings = {
  collection: [
    {
      name: 'find',
      description: (slug: string) => `Allow clients to find ${slug}.`,
      label: 'Find',
    },
    {
      name: 'create',
      description: (slug: string) => `Allow clients to create ${slug}.`,
      label: 'Create',
    },
    {
      name: 'update',
      description: (slug: string) => `Allow clients to update ${slug}.`,
      label: 'Update',
    },
    {
      name: 'delete',
      description: (slug: string) => `Allow clients to delete ${slug}.`,
      label: 'Delete',
    },
  ],
  global: [
    {
      name: 'find',
      description: (slug: string) => `Allow clients to find ${slug} global.`,
      label: 'Find',
    },
    {
      name: 'update',
      description: (slug: string) => `Allow clients to update ${slug} global.`,
      label: 'Update',
    },
  ],
}
