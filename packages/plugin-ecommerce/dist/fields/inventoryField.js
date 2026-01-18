export const inventoryField = (props)=>{
    const { overrides } = props || {};
    // @ts-expect-error - issue with payload types
    const field = {
        name: 'inventory',
        type: 'number',
        defaultValue: 0,
        // @ts-expect-error - translations are not typed in plugins yet
        label: ({ t })=>t('plugin-ecommerce:inventory'),
        min: 0,
        ...overrides || {}
    };
    return field;
};

//# sourceMappingURL=inventoryField.js.map