export const createParentField = (relationTo, overrides)=>({
        name: 'parent',
        admin: {
            position: 'sidebar',
            ...overrides?.admin || {}
        },
        // filterOptions are assigned dynamically based on the pluginConfig
        // filterOptions: parentFilterOptions(),
        type: 'relationship',
        maxDepth: 1,
        relationTo,
        ...overrides || {}
    });

//# sourceMappingURL=parent.js.map