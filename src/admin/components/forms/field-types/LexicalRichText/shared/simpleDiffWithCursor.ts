/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export default function simpleDiffWithCursor(
  a: string,
  b: string,
  cursor: number,
): {index: number; insert: string; remove: number} {
  const aLength = a.length;
  const bLength = b.length;
  let left = 0; // number of same characters counting from left
  let right = 0; // number of same characters counting from right
  // Iterate left to the right until we find a changed character
  // First iteration considers the current cursor position
  while (
    left < aLength &&
    left < bLength &&
    a[left] === b[left] &&
    left < cursor
  ) {
    left++;
  }
  // Iterate right to the left until we find a changed character
  while (
    right + left < aLength &&
    right + left < bLength &&
    a[aLength - right - 1] === b[bLength - right - 1]
  ) {
    right++;
  }
  // Try to iterate left further to the right without caring about the current cursor position
  while (
    right + left < aLength &&
    right + left < bLength &&
    a[left] === b[left]
  ) {
    left++;
  }
  return {
    index: left,
    insert: b.slice(left, bLength - right),
    remove: aLength - left - right,
  };
}
