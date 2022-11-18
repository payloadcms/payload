/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const CAN_USE_DOM: boolean = typeof window !== 'undefined'
  && typeof window.document !== 'undefined'
  && typeof window.document.createElement !== 'undefined';
