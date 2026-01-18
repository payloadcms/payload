/**
 * Defines the default admin entity settings for Collections and Globals.
 * This is used to create the MCP API key permission fields for the API Keys collection.
 */
export declare const adminEntitySettings: {
    collection: {
        name: string;
        description: (slug: string) => string;
        label: string;
    }[];
    global: {
        name: string;
        description: (slug: string) => string;
        label: string;
    }[];
};
//# sourceMappingURL=adminEntitySettings.d.ts.map