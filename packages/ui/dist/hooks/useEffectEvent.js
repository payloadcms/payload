'use client';

/**

Taken and modified from https://github.com/bluesky-social/social-app/blob/ce0bf867ff3b50a495d8db242a7f55371bffeadc/src/lib/hooks/useNonReactiveCallback.ts

Copyright 2023–2025 Bluesky PBC

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import { c as _c } from "react/compiler-runtime";
import { useCallback, useInsertionEffect, useRef } from 'react';
// This should be used sparingly. It erases reactivity, i.e. when the inputs
// change, the function itself will remain the same. This means that if you
// use this at a higher level of your tree, and then some state you read in it
// changes, there is no mechanism for anything below in the tree to "react"
// to this change (e.g. by knowing to call your function again).
//
// Also, you should avoid calling the returned function during rendering
// since the values captured by it are going to lag behind.
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function useEffectEvent(fn) {
  const $ = _c(4);
  const ref = useRef(fn);
  let t0;
  let t1;
  if ($[0] !== fn) {
    t0 = () => {
      ref.current = fn;
    };
    t1 = [fn];
    $[0] = fn;
    $[1] = t0;
    $[2] = t1;
  } else {
    t0 = $[1];
    t1 = $[2];
  }
  useInsertionEffect(t0, t1);
  let t2;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = (...t3) => {
      const args = t3;
      const latestFn = ref.current;
      return latestFn(...args);
    };
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}
//# sourceMappingURL=useEffectEvent.js.map