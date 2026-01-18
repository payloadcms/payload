export function createArrayFromCommaDelineated(input) {
    if (Array.isArray(input)) {
        return input;
    }
    return input.split(',');
}

//# sourceMappingURL=createArrayFromCommaDelineated.js.map