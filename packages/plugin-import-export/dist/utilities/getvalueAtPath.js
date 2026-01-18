/**
 * Safely retrieves a deeply nested value from an object using a dot-notation path.
 *
 * Supports:
 * - Indexed array access (e.g., "array.0.field1")
 * - Polymorphic blocks or keyed unions (e.g., "blocks.0.hero.title"), where the block key
 *   (e.g., "hero") maps to a nested object inside the block item.
 *
 *
 * @param obj - The input object to traverse.
 * @param path - A dot-separated string representing the path to retrieve.
 * @returns The value at the specified path, or undefined if not found.
 */ export const getValueAtPath = (obj, path)=>{
    if (!obj || typeof obj !== 'object') {
        return undefined;
    }
    const parts = path.split('.');
    let current = obj;
    for (const part of parts){
        if (current == null) {
            return undefined;
        }
        // If the path part is a number, treat it as an array index
        if (!isNaN(Number(part))) {
            current = current[Number(part)];
            continue;
        }
        // Special case: if current is an array of blocks like [{ hero: { title: '...' } }]
        // and the path is "blocks.0.hero.title", then `part` would be "hero"
        if (Array.isArray(current)) {
            const idx = Number(parts[parts.indexOf(part) - 1]);
            const blockItem = current[idx];
            if (typeof blockItem === 'object') {
                const keys = Object.keys(blockItem);
                // Find the key (e.g., "hero") that maps to an object
                const matchingBlock = keys.find((key)=>blockItem[key] && typeof blockItem[key] === 'object');
                if (matchingBlock && part === matchingBlock) {
                    current = blockItem[matchingBlock];
                    continue;
                }
            }
        }
        // Fallback to plain object key access
        current = current[part];
    }
    return current;
};

//# sourceMappingURL=getvalueAtPath.js.map