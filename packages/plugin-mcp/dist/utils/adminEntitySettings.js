/**
 * Defines the default admin entity settings for Collections and Globals.
 * This is used to create the MCP API key permission fields for the API Keys collection.
 */ export const adminEntitySettings = {
    collection: [
        {
            name: 'find',
            description: (slug)=>`Allow clients to find ${slug}.`,
            label: 'Find'
        },
        {
            name: 'create',
            description: (slug)=>`Allow clients to create ${slug}.`,
            label: 'Create'
        },
        {
            name: 'update',
            description: (slug)=>`Allow clients to update ${slug}.`,
            label: 'Update'
        },
        {
            name: 'delete',
            description: (slug)=>`Allow clients to delete ${slug}.`,
            label: 'Delete'
        }
    ],
    global: [
        {
            name: 'find',
            description: (slug)=>`Allow clients to find ${slug} global.`,
            label: 'Find'
        },
        {
            name: 'update',
            description: (slug)=>`Allow clients to update ${slug} global.`,
            label: 'Update'
        }
    ]
};

//# sourceMappingURL=adminEntitySettings.js.map