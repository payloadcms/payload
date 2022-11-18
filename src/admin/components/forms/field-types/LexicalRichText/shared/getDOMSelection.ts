/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CAN_USE_DOM } from './canUseDOM';

const getSelection = (): Selection | null => (CAN_USE_DOM ? window.getSelection() : null);

export default getSelection;
