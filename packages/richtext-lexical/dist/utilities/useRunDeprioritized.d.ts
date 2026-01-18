/**
 * Simple hook that lets you run any callback once the main thread is idle
 * (via `requestIdleCallback`) or when that API is missing (Safari) - after the
 * next animation frame (`interactionResponse`).
 *
 * This will help you to avoid blocking the main thread with heavy work.
 *
 * The latest invocation wins: if a new run is queued before the previous one
 * executes, the previous task is cancelled.
 *
 * Usage:
 * ```ts
 * const runDeprioritized = useRunDeprioritized();
 *
 * const onEditorChange = (state: EditorState) => {
 *   runDeprioritized(() => {
 *     // heavy work here …
 *   });
 * };
 * ```
 *
 * @param timeout  Optional timeout (ms) for `requestIdleCallback`; defaults to 500 ms.
 * @returns        A `runDeprioritized(fn)` helper.
 */
export declare function useRunDeprioritized(timeout?: number): (fn: () => void) => Promise<void>;
//# sourceMappingURL=useRunDeprioritized.d.ts.map