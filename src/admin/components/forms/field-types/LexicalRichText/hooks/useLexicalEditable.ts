/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {LexicalSubscription} from './useLexicalSubscription';
import type {LexicalEditor} from 'lexical';

import useLexicalSubscription from './useLexicalSubscription';

function subscription(editor: LexicalEditor): LexicalSubscription<boolean> {
  return {
    initialValueFn: () => editor.isEditable(),
    subscribe: (callback) => {
      return editor.registerEditableListener(callback);
    },
  };
}

export default function useLexicalEditable(): boolean {
  return useLexicalSubscription(subscription);
}
