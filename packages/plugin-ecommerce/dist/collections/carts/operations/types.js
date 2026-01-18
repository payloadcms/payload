/**
 * Checks if a value is a NumericOperator.
 */ export function isNumericOperator(value) {
    return typeof value === 'object' && value !== null && '$inc' in value;
}

//# sourceMappingURL=types.js.map