export function isValidBlockConfig(blockConfig) {
    return typeof blockConfig !== 'string' && typeof blockConfig?.block?.slug === 'string' && Array.isArray(blockConfig?.block?.fields);
}

//# sourceMappingURL=types.js.map