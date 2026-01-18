export function removeUndefined(obj) {
    return Object.fromEntries(Object.entries(obj).filter(([, value])=>value !== undefined));
}

//# sourceMappingURL=removeUndefined.js.map