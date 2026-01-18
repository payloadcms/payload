'use client';

import { c as _c } from "react/compiler-runtime";
import { useCallback, useRef } from 'react';
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
export function useRunDeprioritized(t0) {
  const $ = _c(2);
  const timeout = t0 === undefined ? 500 : t0;
  const idleHandleRef = useRef(undefined);
  let t1;
  if ($[0] !== timeout) {
    t1 = fn => new Promise(resolve => {
      const exec = () => {
        fn();
        resolve();
      };
      if ("requestIdleCallback" in window) {
        if ("cancelIdleCallback" in window && idleHandleRef.current !== undefined) {
          cancelIdleCallback(idleHandleRef.current);
        }
        idleHandleRef.current = requestIdleCallback(exec, {
          timeout
        });
      } else {
        interactionResponse().then(exec);
      }
    });
    $[0] = timeout;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const runDeprioritized = t1;
  return runDeprioritized;
}
function interactionResponse() {
  // Taken from https://github.com/vercel-labs/await-interaction-response/tree/main/packages/await-interaction-response/src
  return new Promise(resolve => {
    setTimeout(resolve, 100); // Fallback for the case where the animation frame never fires.
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });
}
//# sourceMappingURL=useRunDeprioritized.js.map