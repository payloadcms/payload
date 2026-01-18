export declare function abortAndIgnore(abortController: AbortController): void;
/**
 * Use this function when an effect is triggered multiple times over and you want to cancel the previous effect.
 * It will abort the previous effect and create a new AbortController for the next effect.
 * Important: You must also _reset_ the `abortControllerRef` after the effect is done, otherwise the next effect will be aborted immediately.
 * For example, run `abortControllerRef.current = null` in a `finally` block or after an awaited promise.
 * @param abortControllerRef
 * @returns {AbortController}
 */
export declare function handleAbortRef(abortControllerRef: React.RefObject<AbortController>): AbortController;
//# sourceMappingURL=abortAndIgnore.d.ts.map