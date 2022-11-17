/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export default function caretFromPoint(x: number, y: number): null | Range {
  if (typeof document.caretRangeFromPoint !== 'undefined') {
    return document.caretRangeFromPoint(x, y);
    // @ts-ignore
  } else if (document.caretPositionFromPoint !== 'undefined') {
    // @ts-ignore FF - no types
    return document.caretPositionFromPoint(x, y);
  } else {
    // Gracefully handle IE
    return null;
  }
}
