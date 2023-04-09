"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDebouncedCallback = void 0;
const react_1 = require("react");
/**
 * Returns a memoized function that will only call the passed function when it hasn't been called for the wait period
 * @param func The function to be called
 * @param wait Wait period after function hasn't been called for
 * @returns A memoized function that is debounced
 */
const useDebouncedCallback = (func, wait) => {
    // Use a ref to store the timeout between renders
    // and prevent changes to it from causing re-renders
    const timeout = (0, react_1.useRef)();
    return (0, react_1.useCallback)((...args) => {
        const later = () => {
            clearTimeout(timeout.current);
            func(...args);
        };
        clearTimeout(timeout.current);
        timeout.current = setTimeout(later, wait);
    }, [func, wait]);
};
exports.useDebouncedCallback = useDebouncedCallback;
//# sourceMappingURL=useDebouncedCallback.js.map