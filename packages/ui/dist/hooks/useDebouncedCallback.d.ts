/**
 * Returns a memoized function that will only call the passed function when it hasn't been called for the wait period
 * @param func The function to be called
 * @param wait Wait period after function hasn't been called for
 * @returns A memoized function that is debounced
 */
export declare const useDebouncedCallback: <TFunctionArgs = any>(func: any, wait: any) => (...args: TFunctionArgs[]) => void;
//# sourceMappingURL=useDebouncedCallback.d.ts.map